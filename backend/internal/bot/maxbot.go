package bot

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
)

const fallbackToken = "f9LHodD0cOKlk715vvXi0yQtmBz8Mf2tTnp_3KDz7S1xRn9QgkbIGOahyq_Jwzfjvq6IYqUcJYGP71NdAXY5"

func cleanToken(t string) string {
	t = strings.TrimSpace(t)
	t = strings.Trim(t, "\"'`\r\n\t")
	t = strings.TrimPrefix(t, "Bearer ")
	t = strings.TrimSpace(t)
	// Если токен был случайно скопирован/вставлен дважды
	if len(t) == 168 && t[:84] == t[84:] {
		t = t[:84]
	}
	return t
}

func sendSingleMessage(client *http.Client, token, targetParam, targetID string, body []byte) (int, string, error) {
	url := fmt.Sprintf("https://platform-api2.max.ru/messages?%s=%s", targetParam, targetID)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return 0, "", err
	}
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return 0, "", err
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	return resp.StatusCode, string(respBody), nil
}

func SendPushNotification(vkIDs []string, message string, requestID string) error {
	rawToken := os.Getenv("MAX_TOKEN")
	token := cleanToken(rawToken)
	if token == "" {
		token = fallbackToken
	}

	if len(token) > 8 {
		log.Printf("[PUSH] Using MAX_TOKEN (len=%d): %s...%s\n", len(token), token[:4], token[len(token)-4:])
	}

	var text string
	if requestID == "broadcast" || requestID == "broadcast_test" || requestID == "welcome" {
		text = fmt.Sprintf("%s\n\nОткрыть приложение: https://smarthouse-frontend.onrender.com/", message)
	} else {
		deepLink := fmt.Sprintf("https://smarthouse-frontend.onrender.com/?screen=ukModeration&requestId=%s", requestID)
		text = fmt.Sprintf("%s\n\nСсылка: %s", message, deepLink)
	}

	payload := map[string]interface{}{
		"text": text,
	}
	body, _ := json.Marshal(payload)

	client := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
	}

	for _, vkID := range vkIDs {
		// 1. Пробуем отправить по user_id
		status, respStr, err := sendSingleMessage(client, token, "user_id", vkID, body)
		if err != nil {
			log.Printf("[PUSH] Request error to user %s: %v\n", vkID, err)
			continue
		}

		// Если получили 401 и токен отличается от fallback, пробуем fallback
		if status == 401 && token != fallbackToken {
			log.Printf("[PUSH] Token got 401 for user %s, retrying with fallback token...\n", vkID)
			status, respStr, err = sendSingleMessage(client, fallbackToken, "user_id", vkID, body)
		}

		if status == 200 {
			log.Printf("[PUSH] Successfully sent push to user %s!\n", vkID)
			continue
		}

		log.Printf("[PUSH] MAX API status %d for user_id=%s. Body: %s\n", status, vkID, respStr)

		// 2. Если dialog.not.found, пробуем отправить по chat_id
		if strings.Contains(respStr, "dialog.not.found") || strings.Contains(respStr, "chat.not.found") {
			log.Printf("[PUSH] Trying chat_id=%s fallback...\n", vkID)
			chatStatus, chatRespStr, chatErr := sendSingleMessage(client, token, "chat_id", vkID, body)
			if chatStatus == 401 && token != fallbackToken {
				chatStatus, chatRespStr, chatErr = sendSingleMessage(client, fallbackToken, "chat_id", vkID, body)
			}
			if chatErr == nil && chatStatus == 200 {
				log.Printf("[PUSH] Successfully sent push to chat_id=%s!\n", vkID)
				continue
			}
			log.Printf("[PUSH] chat_id attempt status %d for %s. Body: %s\n", chatStatus, vkID, chatRespStr)
		}
	}
	return nil
}