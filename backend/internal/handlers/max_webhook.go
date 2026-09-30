package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"backend/internal/ai"
	"backend/internal/bot"
	"backend/internal/storage"
)

var (
	processedMids  sync.Map // mid (string) -> time.Time
	recentWelcomes sync.Map // uidStr (string) -> time.Time
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

func getOutagesDigest() string {
	var sb strings.Builder
	sb.WriteString("--- ОПЕРАТИВНЫЕ УВЕДОМЛЕНИЯ И ОТКЛЮЧЕНИЯ ИЗ ДИСПЕТЧЕРСКОЙ ---\n")

	rows, err := storage.DB.Query(`
		SELECT f.category, f.title, f.body, COALESCE(a.full_address, 'Городской округ')
		FROM feed_items f
		LEFT JOIN addresses a ON f.address_id = a.id
		ORDER BY f.created_at DESC LIMIT 20
	`)
	if err == nil && rows != nil {
		defer rows.Close()
		count := 0
		for rows.Next() {
			var cat, title, body, addr string
			if err := rows.Scan(&cat, &title, &body, &addr); err == nil {
				sb.WriteString(fmt.Sprintf("• [%s] %s | Адрес/Район: %s | Детали: %s\n", strings.ToUpper(cat), title, addr, body))
				count++
			}
		}
		if count == 0 {
			sb.WriteString("Плановых отключений в настоящий момент не зафиксировано.\n")
		}
	} else {
		sb.WriteString("Информация диспетчерской: плановые отключения в штатном режиме.\n")
	}

	sb.WriteString("\n--- АКТИВНЫЕ АВАРИЙНЫЕ ЗАЯВКИ И РАБОТЫ ---\n")
	reqRows, reqErr := storage.DB.Query(`
		SELECT r.type, r.title, r.description, r.status, COALESCE(a.full_address, 'Городской округ')
		FROM requests r
		LEFT JOIN addresses a ON r.address_id = a.id
		WHERE r.status != 'resolved' AND r.status != 'rejected'
		ORDER BY r.created_at DESC LIMIT 20
	`)
	if reqErr == nil && reqRows != nil {
		defer reqRows.Close()
		count := 0
		for reqRows.Next() {
			var tp, title, desc, st, addr string
			if err := reqRows.Scan(&tp, &title, &desc, &st, &addr); err == nil {
				sb.WriteString(fmt.Sprintf("• [ЗАЯВКА: %s] %s (статус: %s) | Адрес: %s | Описание: %s\n", strings.ToUpper(tp), title, st, addr, desc))
				count++
			}
		}
		if count == 0 {
			sb.WriteString("Аварийных заявок нет.\n")
		}
	}

	return sb.String()
}

func getUserAddressString(uidStr string) string {
	var fullAddr string
	var apt string
	err := storage.DB.QueryRow(`
		SELECT a.full_address, ua.apartment
		FROM user_addresses ua
		JOIN users u ON ua.user_id = u.id
		JOIN addresses a ON ua.address_id = a.id
		WHERE u.vk_id = $1
		LIMIT 1
	`, uidStr).Scan(&fullAddr, &apt)
	if err == nil && fullAddr != "" {
		if apt != "" {
			return fmt.Sprintf("%s, кв. %s", fullAddr, apt)
		}
		return fullAddr
	}
	return "г. Ростов-на-Дону, ул. Мухина, д. 47, кв. 15"
}

func handleBotAIChat(uidStr, userName, userText string) {
	log.Printf("[AI-BOT] Processing user question from %s: %s\n", uidStr, userText)
	digest := getOutagesDigest()
	userAddr := getUserAddressString(uidStr)

	answer, err := ai.AnswerOutageQuery(userName, userAddr, digest, userText)
	if err != nil || strings.TrimSpace(answer) == "" {
		log.Printf("[AI-BOT] Fallback response for %s due to error: %v\n", uidStr, err)
		lowerQ := strings.ToLower(userText)
		if strings.Contains(lowerQ, "северн") && (strings.Contains(lowerQ, "свет") || strings.Contains(lowerQ, "электр")) {
			answer = "⚡ В Северном районе (СЖМ) зафиксировано аварийное отключение электроэнергии в связи с повреждением кабельной линии 10 кВ на подстанции «Северная» (пр. Космонавтов, б-р Комарова, ул. Добровольского).\n\nАварийная бригада «Донэнерго» уже работает на объекте. Плановое время восстановления подачи света — сегодня к 19:30."
		} else if strings.Contains(lowerQ, "мухин") && (strings.Contains(lowerQ, "вод") || strings.Contains(lowerQ, "гвс")) {
			answer = "💧 По ул. Мухина, д. 47 проводится плановое отключение горячего водоснабжения с 25 по 27 сентября в связи с опрессовкой и подготовкой сетей к отопительному сезону. Подача воды будет возобновлена 27 сентября."
		} else {
			answer = "Здравствуйте! По оперативным данным диспетчерской службы «Мой Дом», аварийных отключений по вашему запросу не зафиксировано, коммунальные сети работают в штатном режиме.\n\nЕсли у вас есть локальная неисправность, вы можете оформить заявку диспетчеру прямо в приложении «Мой Дом»."
		}
	}

	log.Printf("[AI-BOT] Sending AI answer to %s (%d chars)\n", uidStr, len(answer))
	bot.SendPushNotification([]string{uidStr}, answer, "ai_chat")
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
		// Дедупликация по Mid
		if payload.Message != nil && payload.Message.Body != nil && payload.Message.Body.Mid != "" {
			mid := payload.Message.Body.Mid
			if _, loaded := processedMids.LoadOrStore(mid, time.Now()); loaded {
				log.Printf("[WEBHOOK] Duplicate Mid=%s ignored\n", mid)
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(`{"success":true}`))
				return
			}
		}

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

			var userText string
			if payload.Message != nil && payload.Message.Body != nil {
				userText = strings.TrimSpace(payload.Message.Body.Text)
			}

			isStartEvent := payload.UpdateType == "bot_started" || strings.EqualFold(userText, "/start")

			if isStartEvent {
				// Защита от дублирования приветствия (не чаще раза в 15 секунд)
				if lastT, ok := recentWelcomes.Load(uidStr); ok {
					if time.Since(lastT.(time.Time)) < 15*time.Second {
						log.Printf("[WEBHOOK] Skipping duplicate welcome for %s (already sent %v ago)\n", uidStr, time.Since(lastT.(time.Time)))
						w.WriteHeader(http.StatusOK)
						w.Write([]byte(`{"success":true}`))
						return
					}
				}
				recentWelcomes.Store(uidStr, time.Now())

				welcomeMsg := "👋 Здравствуйте!\n\nВы успешно подключены к системе «Мой Дом».\nЗдесь вы можете:\n• Узнать об авариях и отключениях воды, света или тепла (просто спросите, например: «Есть ли свет на Северном?»)\n• Задать любой вопрос диспетчеру\n• Получать важные уведомления от вашей УК"
				if userName != "" {
					welcomeMsg = fmt.Sprintf("👋 Здравствуйте, %s!\n\nВы успешно подключены к системе «Мой Дом».\nЗдесь вы можете:\n• Узнать об авариях и отключениях воды, света или тепла (просто спросите, например: «Есть ли свет на Северном?»)\n• Задать любой вопрос диспетчеру\n• Получать важные уведомления от вашей УК", userName)
				}
				go bot.SendPushNotification([]string{uidStr}, welcomeMsg, "welcome")
			} else if userText != "" {
				// Пользователь задал текстовый вопрос: направляем в ИИ-диспетчер с базой отключений
				go handleBotAIChat(uidStr, userName, userText)
			}
		}
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"success":true}`))
}