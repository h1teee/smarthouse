package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"

	"backend/internal/bot"
	"backend/internal/storage"
)

type MaxWebhookPayload struct {
	UpdateType string `json:"update_type"`
	Timestamp  int64  `json:"timestamp"`
	ChatID     int64  `json:"chat_id"`
	User       *struct {
		UserID   int64  `json:"user_id"`
		Name     string `json:"name"`
		Username string `json:"username"`
	} `json:"user"`
	Message *struct {
		Sender *struct {
			UserID   int64  `json:"user_id"`
			Name     string `json:"name"`
			Username string `json:"username"`
		} `json:"sender"`
		Recipient *struct {
			ChatID int64 `json:"chat_id"`
			UserID int64 `json:"user_id"`
		} `json:"recipient"`
		Body *struct {
			Text string `json:"text"`
			Mid  string `json:"mid"`
		} `json:"body"`
	} `json:"message"`
}

func MaxWebhookHandler(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	log.Println("[WEBHOOK] Received from MAX:", string(body))

	var payload MaxWebhookPayload
	if err := json.Unmarshal(body, &payload); err == nil {
		var targetUserID int64
		var userName string

		if payload.User != nil && payload.User.UserID != 0 {
			targetUserID = payload.User.UserID
			userName = payload.User.Name
		} else if payload.Message != nil && payload.Message.Sender != nil && payload.Message.Sender.UserID != 0 {
			targetUserID = payload.Message.Sender.UserID
			userName = payload.Message.Sender.Name
		}

		if targetUserID != 0 {
			uidStr := strconv.FormatInt(targetUserID, 10)
			log.Printf("[WEBHOOK] Registering MAX user: ID=%s, Name=%s\n", uidStr, userName)

			// Сохраняем в таблицу users
			_, dbErr := storage.DB.Exec("INSERT INTO users (vk_id, role) VALUES ($1, 'resident') ON CONFLICT (vk_id) DO NOTHING", uidStr)
			if dbErr != nil {
				log.Println("[WEBHOOK] DB error saving user:", dbErr)
			} else {
				log.Println("[WEBHOOK] User successfully saved in DB:", uidStr)
			}

			// Автоматически привязываем к адресу 1 (кв. 15, счет 61-0001-0015)
			var dbUserID int
			err = storage.DB.QueryRow("SELECT id FROM users WHERE vk_id = $1", uidStr).Scan(&dbUserID)
			if err == nil {
				storage.DB.Exec("INSERT INTO user_addresses (user_id, address_id, apartment, account_number) VALUES ($1, 1, '15', '61-0001-0015') ON CONFLICT (user_id, address_id) DO NOTHING", dbUserID)
			}

			// Приветственное сообщение в чат
			if payload.UpdateType == "bot_started" || (payload.Message != nil && payload.Message.Body != nil) {
				welcomeMsg := "👋 Здравствуйте!\n\nВы успешно подключены к системе оповещений «Мой Дом».\nТеперь сюда будут приходить пуш-уведомления от вашей УК."
				if userName != "" {
					welcomeMsg = fmt.Sprintf("👋 Здравствуйте, %s!\n\nВы успешно подключены к системе оповещений «Мой Дом».\nТеперь сюда будут приходить пуш-уведомления от вашей УК.", userName)
				}
				go bot.SendPushNotification([]string{uidStr}, welcomeMsg, "welcome")
			}
		}
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"success":true}`))
}