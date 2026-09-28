package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"backend/internal/ai"
	"backend/internal/bot"
	"backend/internal/models"
	"backend/internal/storage"
)

func GetUKRequestsHandler(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	if status == "" {
		status = "all"
	}

	var query string
	var rows *sql.Rows
	var err error

	if status == "all" {
		query = "SELECT id, type, title, description, start_date, end_date, status, address_id FROM requests ORDER BY created_at DESC"
		rows, err = storage.DB.Query(query)
	} else {
		query = "SELECT id, type, title, description, start_date, end_date, status, address_id FROM requests WHERE status = $1 ORDER BY created_at DESC"
		rows, err = storage.DB.Query(query, status)
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var requests []models.Request
	for rows.Next() {
		var req models.Request
		var sd, ed *string
		if err := rows.Scan(&req.ID, &req.Type, &req.Title, &req.Description, &sd, &ed, &req.Status, &req.AddressID); err == nil {
			if sd != nil { req.StartDate = *sd }
			if ed != nil { req.EndDate = *ed }
			requests = append(requests, req)
		}
	}
	if requests == nil { requests = []models.Request{} }

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(requests)
}

func ApproveRequestHandler(w http.ResponseWriter, r *http.Request) {
	requestID := r.PathValue("id")
	storage.DB.Exec("UPDATE requests SET status = 'approved' WHERE id = $1", requestID)

	rows, err := storage.DB.Query("SELECT u.vk_id FROM users u JOIN user_addresses ua ON u.id = ua.user_id WHERE ua.address_id = (SELECT address_id FROM requests WHERE id = $1 LIMIT 1)", requestID)
	if err == nil {
		defer rows.Close()
		var vkIDs []string
		for rows.Next() {
			var vkID string
			if err := rows.Scan(&vkID); err == nil { vkIDs = append(vkIDs, vkID) }
		}
		if len(vkIDs) > 0 {
			bot.SendPushNotification(vkIDs, "Заявка одобрена УК", requestID)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func RejectRequestHandler(w http.ResponseWriter, r *http.Request) {
	storage.DB.Exec("UPDATE requests SET status = 'rejected' WHERE id = $1", r.PathValue("id"))
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "rejected"})
}

func BroadcastHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		SelectedIds []int  `json:"selectedIds"`
		Category    string `json:"category"`
		Text        string `json:"text"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var allVkIDs []string
	for _, addrId := range req.SelectedIds {
		rows, err := storage.DB.Query("SELECT u.vk_id FROM users u JOIN user_addresses ua ON u.id = ua.user_id WHERE ua.address_id = $1", addrId)
		if err == nil {
			for rows.Next() {
				var vkID string
				if err := rows.Scan(&vkID); err == nil { allVkIDs = append(allVkIDs, vkID) }
			}
			rows.Close()
		}
		storage.DB.Exec("INSERT INTO feed_items (address_id, title, body, category) VALUES ($1, $2, $3, $4)",
			addrId, "Рассылка от УК", req.Text, req.Category)
	}

	if len(allVkIDs) > 0 {
		bot.SendPushNotification(allVkIDs, req.Text, "0")
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "broadcast_sent"})
}

func GetUKObjectsHandler(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT a.id, a.full_address, a.lat, a.lng,
			CASE 
				WHEN COUNT(req.id) FILTER (WHERE req.type = 'critical' AND req.status != 'resolved') > 0 THEN 'critical'
				WHEN COUNT(req.id) FILTER (WHERE req.status != 'resolved') > 0 THEN 'repair'
				ELSE 'ok'
			END as status
		FROM addresses a 
		LEFT JOIN requests req ON a.id = req.address_id 
		GROUP BY a.id, a.full_address, a.lat, a.lng
	`
	rows, err := storage.DB.Query(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var objects []models.MapObject
	for rows.Next() {
		var obj models.MapObject
		if err := rows.Scan(&obj.AddressID, &obj.FullAddress, &obj.Lat, &obj.Lng, &obj.Status); err == nil {
			objects = append(objects, obj)
		}
	}
	if objects == nil { objects = []models.MapObject{} }

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(objects)
}

func GetUKAnalyticsHandler(w http.ResponseWriter, r *http.Request) {
	var totalRequests, pending, approved, rejected int
	storage.DB.QueryRow("SELECT COUNT(*) FROM requests").Scan(&totalRequests)
	storage.DB.QueryRow("SELECT COUNT(*) FROM requests WHERE status = 'pending'").Scan(&pending)
	storage.DB.QueryRow("SELECT COUNT(*) FROM requests WHERE status = 'approved'").Scan(&approved)
	storage.DB.QueryRow("SELECT COUNT(*) FROM requests WHERE status = 'rejected'").Scan(&rejected)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"total_requests": totalRequests,
		"pending":        pending,
		"approved":       approved,
		"rejected":       rejected,
	})
}

func ImproveTextHandler(w http.ResponseWriter, r *http.Request) {
	var req struct { Text string `json:"text"` }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	improved, err := ai.ImproveText(req.Text)
	if err != nil {
		improved = req.Text
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"improved_text": improved})
}

func AIWeeklyAnalysisHandler(w http.ResponseWriter, r *http.Request) {
	analysis, err := ai.WeeklyAnalysis()
	if err != nil {
		analysis = "Анализ временно недоступен"
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"analysis": analysis})
}