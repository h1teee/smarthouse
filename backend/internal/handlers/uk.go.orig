package handlers

import (
	"crypto/tls"
	"encoding/json"
	"net/http"
	"io"
	"strconv"
	"bytes"
	"os"
	"database/sql"

	"backend/internal/ai"
	"backend/internal/bot"
	"backend/internal/models"
	"backend/internal/storage"
)

func GetUKRequestsHandler(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	var rows *sql.Rows
	var err error

	if status != "" && status != "all" {
		rows, err = storage.DB.Query(`
			SELECT r.id, r.user_id, r.type, r.title, r.description, r.start_date, r.end_date, r.status, r.photo_url, r.created_at, r.address_id, u.vk_id, ua.apartment
			FROM requests r
			LEFT JOIN users u ON r.user_id = u.id
			LEFT JOIN user_addresses ua ON r.address_id = ua.address_id AND ua.user_id = r.user_id
			WHERE r.status = $1 ORDER BY r.created_at DESC`, status)
	} else {
		rows, err = storage.DB.Query(`
			SELECT r.id, r.user_id, r.type, r.title, r.description, r.start_date, r.end_date, r.status, r.photo_url, r.created_at, r.address_id, u.vk_id, ua.apartment
			FROM requests r
			LEFT JOIN users u ON r.user_id = u.id
			LEFT JOIN user_addresses ua ON r.address_id = ua.address_id AND ua.user_id = r.user_id
			ORDER BY r.created_at DESC`)
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type UKReq struct {
		models.Request
		Author    string `json:"author"`
		Apartment string `json:"apartment"`
	}
	var requests []UKReq
	for rows.Next() {
		var req UKReq
		var photoURL sql.NullString
		var vkID sql.NullString
		var apt sql.NullString
		
		if err := rows.Scan(&req.ID, &req.UserID, &req.Type, &req.Title, &req.Description, &req.StartDate, &req.EndDate, &req.Status, &photoURL, &req.CreatedAt, &req.AddressID, &vkID, &apt); err == nil {
			if photoURL.Valid {
				req.PhotoURL = photoURL.String
			}
			if vkID.Valid && vkID.String != "" {
				req.Author = "ID: " + vkID.String
			} else {
				req.Author = "Пользователь" // Or get real name from TamTam
			}
			if apt.Valid && apt.String != "" {
				req.Apartment = apt.String
			}
			requests = append(requests, req)
		} else {
			// error logging
		}
	}
	if requests == nil {
		requests = []UKReq{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(requests)
}

func GetUKObjectsHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := storage.DB.Query("SELECT id, full_address, lat, lng FROM addresses ORDER BY id")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type MapObject struct {
		AddressID   int     `json:"address_id"`
		FullAddress string  `json:"full_address"`
		Lat         float64 `json:"lat"`
		Lng         float64 `json:"lng"`
		Status      string  `json:"status"`
	}

	var objects []MapObject
	for rows.Next() {
		var o MapObject
		rows.Scan(&o.AddressID, &o.FullAddress, &o.Lat, &o.Lng)
		
		var criticalCount int
		storage.DB.QueryRow("SELECT count(*) FROM requests WHERE address_id = $1 AND type IN ('water', 'electricity') AND status = 'pending'", o.AddressID).Scan(&criticalCount)
		
		if criticalCount > 0 {
			o.Status = "critical"
		} else {
			o.Status = "ok"
		}
		
		objects = append(objects, o)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(objects)
}

func ApproveRequestHandler(w http.ResponseWriter, r *http.Request) {
	reqID := r.PathValue("id")
	
	var req models.Request
	err := storage.DB.QueryRow("SELECT address_id, type, title, description FROM requests WHERE id = $1", reqID).
		Scan(&req.AddressID, &req.Type, &req.Title, &req.Description)
	
	if err == nil {
		storage.DB.Exec("UPDATE requests SET status = 'approved' WHERE id = $1", reqID)
		// Publish approved announcement to feed_items so all residents see it!
		storage.DB.Exec("INSERT INTO feed_items (address_id, title, body, category) VALUES ($1, $2, $3, $4)",
			req.AddressID, req.Title, req.Description, req.Type)

		// Отправляем пуш жителю (для демо - берем всех с vk_id)
		rows, dbErr := storage.DB.Query("SELECT vk_id FROM users WHERE vk_id IS NOT NULL AND vk_id != ''")
		if dbErr == nil {
			var vkIDs []string
			for rows.Next() { var id string; rows.Scan(&id); vkIDs = append(vkIDs, id) }
			bot.SendPushNotification(vkIDs, "✅ Ваша заявка одобрена:\n" + req.Title, reqID)
			rows.Close()
		}
	} else {
		storage.DB.Exec("UPDATE requests SET status = 'approved' WHERE id = $1", reqID)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "approved"})
}

func RejectRequestHandler(w http.ResponseWriter, r *http.Request) {
	reqID := r.PathValue("id")
	storage.DB.Exec("UPDATE requests SET status = 'rejected' WHERE id = $1", reqID)
	
	// Отправляем пуш жителю (для демо - берем всех с vk_id)
	rows, err := storage.DB.Query("SELECT vk_id FROM users WHERE vk_id IS NOT NULL AND vk_id != ''")
	if err == nil {
		var vkIDs []string
		for rows.Next() { var id string; rows.Scan(&id); vkIDs = append(vkIDs, id) }
		var title string
		storage.DB.QueryRow("SELECT title FROM requests WHERE id = $1", reqID).Scan(&title)
		bot.SendPushNotification(vkIDs, "❌ Заявка отклонена УК:\n" + title, reqID)
		rows.Close()
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "rejected"})
}

func GetUKAnalyticsHandler(w http.ResponseWriter, r *http.Request) {
	var total, pending, approved, rejected int
	storage.DB.QueryRow("SELECT COUNT(*) FROM requests").Scan(&total)
	storage.DB.QueryRow("SELECT COUNT(*) FROM requests WHERE status = 'pending'").Scan(&pending)
	storage.DB.QueryRow("SELECT COUNT(*) FROM requests WHERE status = 'approved'").Scan(&approved)
	storage.DB.QueryRow("SELECT COUNT(*) FROM requests WHERE status = 'rejected'").Scan(&rejected)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{
		"total_requests": total,
		"pending":        pending,
		"approved":       approved,
		"rejected":       rejected,
	})
}

func BroadcastHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		SelectedIds []int  `json:"selectedIds"`
		Category    string `json:"category"`
		Text        string `json:"text"`
		TargetMaxID string `json:"target_max_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	pushResult := "not_sent"
	if req.TargetMaxID != "" {
		// Принудительно отправляем пуш тестеру
		bot.SendPushNotification([]string{req.TargetMaxID}, "🔔 ТЕСТ ОТ УК:\n\n" + req.Text, "broadcast_test")
		pushResult = "sent_to_tester"
	}

	for _, addrID := range req.SelectedIds {
		storage.DB.Exec("INSERT INTO feed_items (address_id, title, body, category) VALUES ($1, $2, $3, $4)",
			addrID, "Рассылка от УК", req.Text, req.Category)
	}

	// Собираем всех vk_id жителей выбранных домов
	var vkIDs []string
	if len(req.SelectedIds) > 0 {
		// ДЛЯ ДЕМО-ВЕРСИИ: Мы берем всех пользователей, у которых есть vk_id, 
		// чтобы гарантированно доставить пуш тестерам (игнорируя фильтр по адресам)
		rows, err := storage.DB.Query("SELECT vk_id FROM users WHERE vk_id IS NOT NULL AND vk_id != ''")
		if err == nil {
			for rows.Next() {
				var vkID string
				if err := rows.Scan(&vkID); err == nil {
					vkIDs = append(vkIDs, vkID)
				}
			}
			rows.Close()
		}
	}

	// Убираем дубликаты vk_id
	uniqueVKIDs := make([]string, 0)
	seen := make(map[string]bool)
	for _, id := range vkIDs {
		if !seen[id] {
			seen[id] = true
			uniqueVKIDs = append(uniqueVKIDs, id)
		}
	}

	// Отправляем реальные пуши всем найденным жителям
	if len(uniqueVKIDs) > 0 {
		bot.SendPushNotification(uniqueVKIDs, "🔔 ВАЖНОЕ СООБЩЕНИЕ ОТ УК:\n\n" + req.Text, "broadcast")
		pushResult = "sent_to_users"
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "ok", 
		"push_result": pushResult,
		"users_notified": len(uniqueVKIDs),
	})
}

func sendMaxPushNotificationSync(userID string, text string) string {
	token := os.Getenv("MAX_TOKEN")
	if token == "" {
		return "no_token"
	}
	if userID == "" {
		return "no_user_id"
	}
	
	url := "https://platform-api2.max.ru/messages?user_id=" + userID
	
	payload := map[string]interface{}{
		"text": "🔔 ВАЖНОЕ СООБЩЕНИЕ ОТ УК:\n\n" + text,
	}
	body, _ := json.Marshal(payload)
	
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
		return "error: " + err.Error()
	}
	defer resp.Body.Close()
	
	respBody, _ := io.ReadAll(resp.Body)
	return "status_" + strconv.Itoa(resp.StatusCode) + "_body_" + string(respBody)
}

func sendMaxPushNotification(userID string, text string) {
	sendMaxPushNotificationSync(userID, text)
}

func ImproveTextHandler(w http.ResponseWriter, r *http.Request) {
	var req struct{ Text string `json:"text"` }
	json.NewDecoder(r.Body).Decode(&req)
	
	improved, err := ai.ImproveText(req.Text)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"improved_text": improved})
}

func AIWeeklyAnalysisHandler(w http.ResponseWriter, r *http.Request) {
	var reqCount int
	var amount float64
	storage.DB.QueryRow("SELECT count(*) FROM requests").Scan(&reqCount)
	storage.DB.QueryRow("SELECT COALESCE(sum(amount), 0) FROM bills").Scan(&amount)

	analysis, err := ai.WeeklyAnalysis(reqCount, amount)
	if err != nil {
		analysis = "Не удалось сгенерировать аналитику"
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"analysis": analysis})
}

