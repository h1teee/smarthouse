package handlers

import (
	"encoding/json"
	"net/http"
	"io"
	"strconv"
	"strings"
	"bytes"
	"os"
	"database/sql"

	"backend/internal/ai"
	"backend/internal/models"
	"backend/internal/storage"
)

func GetUKRequestsHandler(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	var rows *sql.Rows
	var err error

	if status != "" && status != "all" {
		rows, err = storage.DB.Query("SELECT id, user_id, type, title, description, status, created_at, address_id FROM requests WHERE status = $1 ORDER BY created_at DESC", status)
	} else {
		rows, err = storage.DB.Query("SELECT id, user_id, type, title, description, status, created_at, address_id FROM requests ORDER BY created_at DESC")
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var requests []models.Request
	for rows.Next() {
		var req models.Request
		if err := rows.Scan(&req.ID, &req.UserID, &req.Type, &req.Title, &req.Description, &req.Status, &req.CreatedAt, &req.AddressID); err == nil {
			requests = append(requests, req)
		}
	}
	if requests == nil {
		requests = []models.Request{}
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
	storage.DB.Exec("UPDATE requests SET status = 'approved' WHERE id = $1", reqID)
	w.WriteHeader(http.StatusOK)
}

func RejectRequestHandler(w http.ResponseWriter, r *http.Request) {
	reqID := r.PathValue("id")
	storage.DB.Exec("UPDATE requests SET status = 'rejected' WHERE id = $1", reqID)
	w.WriteHeader(http.StatusOK)
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
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	var callerVkID string
	storage.DB.QueryRow("SELECT vk_id FROM users WHERE id = $1", getUserID(r)).Scan(&callerVkID)
	
	pushResult := "not_sent"
	if callerVkID != "" && !strings.HasPrefix(callerVkID, "user_") {
		pushResult = sendMaxPushNotificationSync(callerVkID, req.Text)
	}

	for _, addrID := range req.SelectedIds {
		storage.DB.Exec("INSERT INTO feed_items (address_id, title, body, category) VALUES ($1, $2, $3, $4)",
			addrID, "Рассылка от УК", req.Text, req.Category)
			
		debugBody := "ID: " + callerVkID + " | Result: " + pushResult
		storage.DB.Exec("INSERT INTO feed_items (address_id, title, body, category) VALUES ($1, $2, $3, $4)",
			addrID, "DEBUG PUSH INFO", debugBody, "info")
			
		rows, err := storage.DB.Query("SELECT u.vk_id FROM users u JOIN user_addresses ua ON u.id = ua.user_id WHERE ua.address_id = $1", addrID)
		if err == nil {
			for rows.Next() {
				var vkID string
				if err := rows.Scan(&vkID); err == nil {
					go sendMaxPushNotification(vkID, req.Text)
				}
			}
			rows.Close()
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok", "push_result": pushResult, "vk_id": callerVkID})
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
	req.Header.Set("Authorization", "Bearer " + token)
	req.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{}
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

