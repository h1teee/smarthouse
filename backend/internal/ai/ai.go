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
	result, err := callGigaChat(
		"Вы помощник по разбору объявлений. Выведи строго JSON: {\"type\": \"water/electricity/other\", \"title\": \"...\", \"start_date\": \"...\", \"end_date\": \"...\", \"description\": \"...\"}.",
		"Я прикрепил текст из объявления. Найди в нем суть и выведи информацию об отключениях. Текст объявления: Уведомляем вас, что в связи с ремонтом с 15 по 19 сентября 2026 г. будет полностью прекращена подача ГОРЯЧЕГО ВОДОСНАБЖЕНИЯ по адресу: ул. Пушкинская, д. 34А.",
	)
	if err != nil {
		return &models.Request{
			Type:        "water",
			Title:       "Отключение горячей воды",
			Description: "Случилась ошибка при обращении к GigaChat. Скорее всего, токен протух или не задан.",
		}, err
	}

	var req models.Request
	json.Unmarshal([]byte(result), &req)
	if req.Title == "" {
		req.Title = "Новое объявление"
	}
	return &req, nil
}

func AnalyzeBill(billID int) (string, error) {
	var amount float64
	var isPaid bool
	err := storage.DB.QueryRow("SELECT amount, is_paid FROM bills WHERE id = $1", billID).Scan(&amount, &isPaid)
	if err != nil {
		return "", err
	}

	prompt := fmt.Sprintf("Проанализируй квитанцию на сумму %.2f руб. Оплачена: %v. Ответь коротко (2-3 предложения), дай совет по экономии.", amount, isPaid)
	
	result, err := callGigaChat("Ты умный помощник ЖКХ.", prompt)
	if err != nil {
		return "Ошибка при анализе квитанции. Возможно, проблемы с GigaChat.", err
	}
	return result, nil
}

func AIWeeklyAnalysis() (string, error) {
	var reqCount int
	storage.DB.QueryRow("SELECT COUNT(*) FROM requests WHERE created_at >= NOW() - INTERVAL '7 days'").Scan(&reqCount)

	prompt := fmt.Sprintf("За неделю поступило %d заявок от жителей. Дай короткий комментарий (2 предложения) для директора УК, как улучшить работу.", reqCount)
	result, err := callGigaChat("Ты аналитик УК.", prompt)
	if err != nil {
		return "Слишком много заявок, рекомендуется усилить контроль диспетчерской (Mock).", err
	}
	return result, nil
}

func ImproveText(text string) (string, error) {
	result, err := callGigaChat(
		"Ты помощник управляющей компании ЖКХ. Улучши текст рассылки для жителей: исправь грамматику, сделай более информативным и официальным. Ответь только улучшенным текстом без пояснений.",
		text,
	)
	if err != nil {
		return text, err
	}
	return result, nil
}