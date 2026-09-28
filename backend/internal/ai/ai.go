package ai

import (
	"bytes"
	"crypto/tls"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"backend/internal/models"
	"backend/internal/storage"
)

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
	req.Header.Set("RqUID", "6f0b1291-c7f3-43c6-bb2e-9f3efb2dc98e")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	tr := &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}
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

func callGigaChat(systemPrompt string, userMessage string) (string, error) {
	token, err := getGigaChatToken()
	if err != nil {
		return "", err
	}

	payload := map[string]interface{}{
		"model": "GigaChat",
		"messages": []map[string]interface{}{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": userMessage},
		},
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://gigachat.devices.sberbank.ru/api/v1/chat/completions", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	tr := &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}
	client := &http.Client{Transport: tr, Timeout: 30 * time.Second}

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("gigachat returned status %d", resp.StatusCode)
	}

	respBody, _ := io.ReadAll(resp.Body)
	var routerResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	json.Unmarshal(respBody, &routerResp)

	if len(routerResp.Choices) > 0 {
		return routerResp.Choices[0].Message.Content, nil
	}
	return "", fmt.Errorf("no response from gigachat")
}

func ParseAnnouncement(base64Image string) (*models.Request, error) {
	if os.Getenv("USE_MOCK_AI") == "true" {
		time.Sleep(1 * time.Second)
		return &models.Request{
			Type:        "water",
			Title:       "Отключение горячей воды",
			Description: "Завтра с 10:00 до 15:00 планируется отключение горячей воды.",
			StartDate:   "Завтра 10:00",
			EndDate:     "Завтра 15:00",
		}, nil
	}

	result, err := callGigaChat(
		"Вы помощник по разбору объявлений. Выведи строго JSON: {\"type\": \"water/electricity/other\", \"title\": \"...\", \"start_date\": \"...\", \"end_date\": \"...\", \"description\": \"...\"}.",
		"Я прикрепил текст из объявления. Найди в нем суть и выведи информацию об отключениях. Текст объявления: Уведомляем вас, что в связи с ремонтом с 15 по 19 сентября 2026 г. будет полностью прекращена подача ГОРЯЧЕГО ВОДОСНАБЖЕНИЯ по адресу: ул. Пушкинская, д. 34А.",
	)
	if err != nil {
		return &models.Request{
			Type:        "water",
			Title:       "Отключение ГВС",
			Description: "Не удалось распознать текст автоматически.",
		}, err
	}

	var req models.Request
	json.Unmarshal([]byte(result), &req)
	if req.Title == "" {
		req.Title = "Распознанное объявление"
		req.Description = result
		req.Type = "water"
	}
	return &req, nil
}

func AnalyzeBill(billID int) (*models.AIAnalysis, error) {
	if os.Getenv("USE_MOCK_AI") == "true" {
		time.Sleep(2 * time.Second)
		return &models.AIAnalysis{Summary: "Ваш счет в пределах нормы. Вы потратили 4500 рублей в текущем месяце."}, nil
	}

	var amount float64
	var month string
	err := storage.DB.QueryRow("SELECT amount, month FROM bills WHERE id = $1", billID).Scan(&amount, &month)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("bill not found")
		}
		return nil, err
	}

	prompt := fmt.Sprintf("Сумма платежа ЖКХ за %s составляет %.2f руб. Объясни в двух словах пользователю (вода, свет, отопление), дай советы об экономии. Будь краток, 3-4 предложения.", month, amount)

	result, err := callGigaChat(
		"Вы эксперт в коммунальных платежах ЖКХ. Ваша цель - понятно объяснить пользователю его счет.",
		prompt,
	)
	if err != nil {
		return nil, err
	}

	return &models.AIAnalysis{Summary: result}, nil
}

func ImproveText(text string) (string, error) {
	token, err := getGigaChatToken()
	if err != nil {
		return text, err
	}

	payload := map[string]interface{}{
		"model": "GigaChat",
		"messages": []map[string]interface{}{
			{"role": "system", "content": "Ты помощник управляющей компании ЖКХ. Улучши текст рассылки для жителей: исправь грамматику, сделай более информативным и официальным. Ответь только улучшенным текстом без пояснений."},
			{"role": "user", "content": text},
		},
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://gigachat.devices.sberbank.ru/api/v1/chat/completions", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	tr := &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}
	client := &http.Client{Transport: tr}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != 200 {
		return text, fmt.Errorf("gigachat error")
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
	if len(routerResp.Choices) > 0 {
		return routerResp.Choices[0].Message.Content, nil
	}
	return text, nil
}

func WeeklyAnalysis(reqCount int, amount float64) (string, error) {
	token, err := getGigaChatToken()
	if err != nil {
		return "Ошибка токена", err
	}

	prompt := fmt.Sprintf("Сделай краткую еженедельную аналитику для УК: За неделю поступило %d заявок, общая сумма по счетам %.2f руб. Опиши динамику, дай 1 совет УК.", reqCount, amount)

	payload := map[string]interface{}{
		"model": "GigaChat",
		"messages": []map[string]interface{}{
			{"role": "system", "content": "Ты финансовый и операционный аналитик управляющей компании."},
			{"role": "user", "content": prompt},
		},
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://gigachat.devices.sberbank.ru/api/v1/chat/completions", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	tr := &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}
	client := &http.Client{Transport: tr}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != 200 {
		return "Ошибка gigachat", fmt.Errorf("gigachat error")
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
	if len(routerResp.Choices) > 0 {
		return routerResp.Choices[0].Message.Content, nil
	}
	return "Нет ответа", nil
}