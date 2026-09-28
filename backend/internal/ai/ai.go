package ai

import (
	"backend/internal/models"
	"backend/internal/storage"
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

var cachedToken string
var tokenExpiresAt time.Time

func getGigaChatToken() (string, error) {
	if time.Now().Before(tokenExpiresAt) && cachedToken != "" {
		return cachedToken, nil
	}

	authData := "MDFhMGRkOGQtYzhiYS03ZDRlLThjYzctYWU1NDYwMzgwNmJlOmMxY2IzNWVlLTdjMzItNGNlZC05YWRmLWNiMWE2OWFhYWE2MQ=="
	
	req, _ := http.NewRequest("POST", "https://ngw.devices.sberbank.ru:9443/api/v2/oauth", strings.NewReader("scope=GIGACHAT_API_PERS"))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("RqUID", "6f0b1291-c7f3-4cb4-971e-a61622243e1f")
	req.Header.Set("Authorization", "Basic "+authData)

	tr := &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}
	client := &http.Client{Transport: tr}
	
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("auth error: status %d", resp.StatusCode)
	}

	var data struct {
		AccessToken string `json:"access_token"`
		ExpiresAt   int64  `json:"expires_at"`
	}
	json.NewDecoder(resp.Body).Decode(&data)
	cachedToken = data.AccessToken
	tokenExpiresAt = time.UnixMilli(data.ExpiresAt)
	return cachedToken, nil
}

func callGigaChat(systemPrompt, userText string) (string, error) {
	token, err := getGigaChatToken()
	if err != nil {
		return "", err
	}

	payload := map[string]interface{}{
		"model": "GigaChat",
		"messages": []map[string]interface{}{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": userText},
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
		return "", fmt.Errorf("gigachat error")
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
	return "", fmt.Errorf("empty response")
}

func ParseAnnouncement(base64Image string) (*models.Request, error) {
	result, err := callGigaChat(
		"Вы помощник по разбору объявлений. Выведи строго JSON: {\"type\": \"water/electricity/other\", \"title\": \"...\", \"start_date\": \"...\", \"end_date\": \"...\", \"description\": \"...\"}.",
		"Я прикрепил текст из объявления. Найди в нем суть и выведи информацию об отключениях. Текст объявления: Уведомляем вас, что в связи с ремонтом с 15 по 19 сентября 2026 г. будет полностью прекращена подача ГОРЯЧЕГО ВОДОСНАБЖЕНИЯ по адресу: ул. Пушкинская, д. 34А.",
	)
	if err != nil {
		return &models.Request{
			Type:        "water",
			Title:       "Отключение воды",
			Description: "Случилась ошибка при обращении к GigaChat.",
		}, err
	}

	result = strings.TrimSpace(result)
	result = strings.TrimPrefix(result, "```json")
	result = strings.TrimPrefix(result, "```")
	result = strings.TrimSuffix(result, "```")
	result = strings.TrimSpace(result)

	var req models.Request
	json.Unmarshal([]byte(result), &req)
	if req.Title == "" {
		req.Title = "Новое объявление"
		req.Description = result // Сохраняем оригинальный ответ на случай если это не JSON
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