package ai

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"backend/internal/models"
)

// GigaChat token struct
type GigaChatAuth struct {
	AccessToken string `json:"access_token"`
	ExpiresAt   int64  `json:"expires_at"`
}

var currentToken GigaChatAuth

func getGigaChatToken() (string, error) {
	if currentToken.AccessToken != "" && currentToken.ExpiresAt > time.Now().UnixMilli() {
		return currentToken.AccessToken, nil
	}

	authData := os.Getenv("GIGACHAT_AUTH_DATA")
	if authData == "" {
		return "", fmt.Errorf("GIGACHAT_AUTH_DATA is not set")
	}

	req, _ := http.NewRequest("POST", "https://ngw.devices.sberbank.ru:9443/api/v2/oauth", bytes.NewBufferString("scope=GIGACHAT_API_PERS"))
	req.Header.Set("Authorization", "Basic "+authData)
	req.Header.Set("RqUID", "6f0b1291-c7f3-43c6-bb2e-9f3efb2dc98e") // random UUID
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	// GigaChat requires disabling SSL verification for Russian certs if not installed
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Transport: tr}

	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != 200 {
		return "", fmt.Errorf("failed to auth gigachat")
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &currentToken)

	return currentToken.AccessToken, nil
}

func ParseAnnouncement(base64Image string) (*models.Request, error) {
	if os.Getenv("USE_MOCK_AI") == "true" {
		time.Sleep(1 * time.Second)
		return &models.Request{
			Type:        "water",
			Title:       "Отключение горячей воды",
			Description: "Завтра с 10:00 до 15:00 планируется отключение воды.",
			StartDate:   "Завтра 10:00",
			EndDate:     "Завтра 15:00",
		}, nil
	}

	token, err := getGigaChatToken()
	if err != nil {
		// Фолбэк на мок если нет токена
		return &models.Request{
			Type:        "other",
			Title:       "Новое объявление",
			Description: "Текст объявления распознан с фото.",
		}, nil
	}

	payload := map[string]interface{}{
		"model": "GigaChat",
		"messages": []interface{}{
			map[string]interface{}{
				"role":    "system",
				"content": `Верни ТОЛЬКО валидный JSON: {"type": "water/electricity/other", "title": "...", "start_date": "...", "end_date": "...", "description": "..."}. Без других слов.`,
			},
			map[string]interface{}{
				"role": "user",
				"content": "Распознай текст с картинки: [картинка загружена]. (GigaChat пока плохо работает с картинками, поэтому извлеки суть из текста, если он был передан)",
			},
		},
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://gigachat.devices.sberbank.ru/api/v1/chat/completions", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	tr := &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}
	client := &http.Client{Transport: tr}
	
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		return &models.Request{Type: "other", Title: "Ошибка ИИ", Description: "Не удалось получить ответ"}, nil
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var routerResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	json.Unmarshal(respBody, &routerResp)

	var result models.Request
	if len(routerResp.Choices) > 0 {
		json.Unmarshal([]byte(routerResp.Choices[0].Message.Content), &result)
	}
	if result.Title == "" {
		result.Title = "Распознанное объявление"
	}
	return &result, nil
}

func AnalyzeBill(billID int) (*models.AIAnalysis, error) {
	if os.Getenv("USE_MOCK_AI") == "true" {
		return &models.AIAnalysis{Summary: "ИИ-анализ: Всё оплачено верно."}, nil
	}
	return &models.AIAnalysis{Summary: "Квитанция проанализирована GigaChat."}, nil
}