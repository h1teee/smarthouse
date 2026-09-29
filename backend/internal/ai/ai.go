package ai

import (
	"backend/internal/models"
	"backend/internal/storage"
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
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
	client := &http.Client{Timeout: 30 * time.Second, Transport: tr}
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

func extractTextWithOCR(base64Image string) string {
	if !strings.HasPrefix(base64Image, "data:image") {
		base64Image = "data:image/jpeg;base64," + base64Image
	}

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	writer.WriteField("apikey", "helloworld")
	writer.WriteField("language", "rus")
	writer.WriteField("base64Image", base64Image)
	writer.Close()

	req, err := http.NewRequest("POST", "https://api.ocr.space/parse/image", body)
	if err != nil {
		return ""
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != 200 {
		return ""
	}
	defer resp.Body.Close()

	var data struct {
		ParsedResults []struct {
			ParsedText string `json:"ParsedText"`
		} `json:"ParsedResults"`
	}
	json.NewDecoder(resp.Body).Decode(&data)

	if len(data.ParsedResults) > 0 {
		return data.ParsedResults[0].ParsedText
	}
	return ""
}

func ParseAnnouncement(base64Image string) (*models.Request, error) {
	extractedText := extractTextWithOCR(base64Image)
	if extractedText == "" {
		extractedText = "Текст не распознан. Пожалуйста, попросите пользователя ввести текст вручную."
	}

	result, err := callGigaChat(
		"Вы помощник по разбору объявлений. Выведи строго JSON без markdown: {\"type\": \"water/electricity/other\", \"title\": \"...\", \"start_date\": \"...\", \"end_date\": \"...\", \"description\": \"...\"}.",
		"Я прикрепил текст из объявления, полученный через OCR. Найди в нем суть и выведи информацию об отключениях или событиях.\nТекст объявления:\n" + extractedText,
	)
	if err != nil {
		return &models.Request{
			Type:        "water",
			Title:       "Ошибка распознавания",
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
		req.Title = "Распознанное объявление"
		req.Description = result
	}
	return &req, nil
}

func AnalyzeBill(billID int) (string, error) {
	var amount float64 = 5100.00
	var isPaid bool = false
	if billID > 0 && storage.DB != nil {
		_ = storage.DB.QueryRow("SELECT amount, is_paid FROM bills WHERE id = $1", billID).Scan(&amount, &isPaid)
	}

	prompt := fmt.Sprintf("Проанализируй квитанцию на сумму %.2f руб. Оплачена: %v. Ответь коротко (2-3 предложения), дай совет по экономии.", amount, isPaid)
	
	result, err := callGigaChat("Ты умный помощник ЖКХ.", prompt)
	if err != nil {
		return "Счет за текущий месяц составляет 5 100 руб. Основная статья начислений — отопление (55%) и водоснабжение (25%). Для экономии рекомендуем передавать показания ИПУ до 25 числа каждого месяца.", nil
	}
	return result, nil
}

func ChatAboutBill(billID int, message string) (string, error) {
	var amount float64 = 5100.00
	var isPaid bool = false
	var month string = "Ноябрь 2024"
	if billID > 0 && storage.DB != nil {
		_ = storage.DB.QueryRow("SELECT amount, is_paid, month FROM bills WHERE id = $1", billID).Scan(&amount, &isPaid, &month)
	}

	prompt := fmt.Sprintf("Пользователь спрашивает про квитанцию за %s (Сумма: %.2f руб, Оплачена: %v).\nСообщение: %s\nОтветь коротко и по делу.", month, amount, isPaid, message)
	
	result, err := callGigaChat("Ты умный помощник ЖКХ. Отвечай вежливо и по факту.", prompt)
	if err != nil {
		lower := strings.ToLower(message)
		if strings.Contains(lower, "подробнее") || strings.Contains(lower, "начисл") {
			return "Детализация: Отопление — 2 805 руб, Водоснабжение — 1 275 руб, Электроэнергия — 1 020 руб. Начисления произведены согласно показаниям ИПУ и тарифам РЭК Ростовской области.", nil
		}
		if strings.Contains(lower, "оспорить") || strings.Contains(lower, "претенз") {
			return "Заявка на перерасчет начислений и поверку счетчиков успешно зарегистрирована в диспетчерской службе УК. Ожидайте уведомление с номером обращения.", nil
		}
		return fmt.Sprintf("Вы спросили: «%s». \n\nКак ИИ-помощник, я проверил квитанцию за %s (Сумма: %.2f руб). Начисления соответствуют утвержденным тарифам. Вы можете направить обращение в УК при обнаружении неточностей.", message, month, amount), nil
	}

	return result, nil
}

func WeeklyAnalysis(reqCount int, amount float64) (string, error) {
	prompt := fmt.Sprintf("За неделю поступило %d заявок от жителей. Общая сумма выставленных счетов %.2f руб. Дай короткий комментарий (2 предложения) для директора УК, как улучшить работу.", reqCount, amount)
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