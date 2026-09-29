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
)

func SendPushNotification(vkIDs []string, message string, requestID string) error {
	token := os.Getenv("MAX_TOKEN")
	if token == "" {
		log.Println("MAX_TOKEN is empty, skipping push notification for request:", requestID)
		return nil
	}

	deepLink := fmt.Sprintf("https://smarthouse-frontend.onrender.com/?screen=ukModeration&requestId=%s", requestID)
	text := fmt.Sprintf("%s\n\nСсылка: %s", message, deepLink)

	payload := map[string]interface{}{
		"text": text,
	}
	body, _ := json.Marshal(payload)

	for _, vkID := range vkIDs {
		url := fmt.Sprintf("https://platform-api2.max.ru/messages?user_id=%s", vkID)
		req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
		req.Header.Set("Authorization", token)
		req.Header.Set("Content-Type", "application/json")

		client := &http.Client{
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
			},
		}
		resp, err := client.Do(req)
		if err != nil {
			log.Printf("Failed to send push to %s: %v\n", vkID, err)
			continue
		}
		if resp.StatusCode != 200 {
			b, _ := io.ReadAll(resp.Body)
			log.Printf("MAX API returned status %d for user %s. Body: %s\n", resp.StatusCode, vkID, string(b))
		}
		resp.Body.Close()
	}
	return nil
}