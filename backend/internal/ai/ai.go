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
		"Ты анализируешь фото объявления из подъезда. Верни только JSON: {\"type\": \"water/electricity/other\", \"title\": \"...\", \"start_date\": \"...\", \"end_date\": \"...\", \"description\": \"...\"}. Не пиши ничего кроме JSON.",
		"Распознай текст с фото объявления и извлеки из него информацию об отключениях или ремонтных работах.",
	)
	if err != nil {
		return &models.Request{
			Type:        "other",
			Title:       "Неизвестное объявление",
			Description: "Не удалось распознать текст.",
		}, nil
	}

	var req models.Request
	json.Unmarshal([]byte(result), &req)
	if req.Title == "" {
		req.Title = "Объявление распознано"
		req.Description = result
		req.Type = "other"
	}
	return &req, nil
}

func AnalyzeBill(billID int) (*models.AIAnalysis, error) {
	if os.Getenv("USE_MOCK_AI") == "true" {
		time.Sleep(2 * time.Second)
		return &models.AIAnalysis{Summary: "Ваш счёт в пределах нормы. Вы платите около 4500 рублей за коммунальные услуги. Отличный показатель!"}, nil
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

	prompt := fmt.Sprintf("Проанализируй квитанцию ЖКХ. Сумма за %s составляет %.2f руб. Объясни из чего складывается сумма (вода, свет, отопление), дай советы по экономии. Ответь кратко, 3-4 предложения.", month, amount)

	result, err := callGigaChat(
		"Ты специалист по коммунальным услугам ЖКХ. Твоя цель - понятно объяснить жителю его квитанцию и дать советы по экономии.",
		prompt,
	)
	if err != nil {
		return &models.AIAnalysis{Summary: "Не удалось получить ответ от GigaChat. Попробуйте позже."}, nil
	}

	return &models.AIAnalysis{Summary: result}, nil
}

func ImproveText(text string) (string, error) {
	if os.Getenv("USE_MOCK_AI") == "true" {
		time.Sleep(1 * time.Second)
		return "Уважаемые жители! " + text + " С уважением, управляющая компания.", nil
	}

	return callGigaChat(
		"Ты помощник управляющей компании ЖКХ. Улучши текст рассылки для жителей: исправь грамматику, сделай более информативным и официальным. Ответь только улучшенным текстом без пояснений.",
		text,
	)
}

func WeeklyAnalysis() (string, error) {
	if os.Getenv("USE_MOCK_AI") == "true" {
		time.Sleep(2 * time.Second)
		return "За последнюю неделю поступило 5 заявок. 3 одобрены, 2 на рассмотрении. Основные проблемы: водоснабжение (60%), электричество (40%). Рекомендуется провести профилактику сетей водоснабжения.", nil
	}

	var total, pending, approved, rejected int
	storage.DB.QueryRow("SELECT COUNT(*) FROM requests WHERE created_at > NOW() - INTERVAL '7 days'").Scan(&total)
	storage.DB.QueryRow("SELECT COUNT(*) FROM requests WHERE status = 'pending' AND created_at > NOW() - INTERVAL '7 days'").Scan(&pending)
	storage.DB.QueryRow("SELECT COUNT(*) FROM requests WHERE status = 'approved' AND created_at > NOW() - INTERVAL '7 days'").Scan(&approved)
	storage.DB.QueryRow("SELECT COUNT(*) FROM requests WHERE status = 'rejected' AND created_at > NOW() - INTERVAL '7 days'").Scan(&rejected)

	prompt := fmt.Sprintf("Сделай краткий аналитический отчёт для управляющей компании ЖКХ за неделю. Данные: всего заявок: %d, на рассмотрении: %d, одобрено: %d, отклонено: %d. Дай рекомендации. Ответь 3-5 предложениями.", total, pending, approved, rejected)

	return callGigaChat(
		"Ты аналитик управляющей компании ЖКХ. Составь краткий еженедельный отчёт на основе данных.",
		prompt,
	)
}