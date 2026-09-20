package ai

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"backend/internal/models"
)

func AnalyzeImage(base64Image string) (*models.Request, error) {
	apiKey := os.Getenv("AI_KEY")
	if apiKey == "" {
		return nil, errors.New("AI_KEY не задан в .env")
	}

	url := "https://openrouter.ai/api/v1/chat/completions"

	payload := map[string]interface{}{
		"model": "qwen/qwen-2-vl-7b-instruct:free",
		"response_format": map[string]string{"type": "json_object"},
		"messages": []interface{}{
			map[string]interface{}{
				"role": "system",
				"content": "Ты диспетчер ЖКХ. Верни строго JSON объект без markdown форматирования: \"type\" (water, electricity, heating, other), \"title\", \"start_date\", \"end_date\", \"description\".",
			},
			map[string]interface{}{
				"role": "user",
				"content": []map[string]interface{}{
					{
						"type": "image_url",
						"image_url": map[string]string{
							"url": "data:image/jpeg;base64," + base64Image,
						},
					},
				},
			},
		},
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("HTTP-Referer", "http://localhost:8080") 
	req.Header.Set("X-Title", "SmartHome Hackathon")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
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

	if err := json.Unmarshal(respBody, &routerResp); err != nil {
		return nil, errors.New("ошибка парсинга ответа OpenRouter")
	}

	if len(routerResp.Choices) == 0 {
		return nil, errors.New("пустой ответ от нейросети")
	}

	var result models.Request
	if err := json.Unmarshal([]byte(routerResp.Choices[0].Message.Content), &result); err != nil {
		return nil, errors.New("ошибка конвертации ИИ-ответа в структуру: " + err.Error())
	}

	return &result, nil
}