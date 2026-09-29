package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"backend/internal/ai"
	"backend/internal/models"
	"backend/internal/storage"
)

func GetFeedHandler(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r) // Заглушка, в проде берем из JWT
	
	query := `
		SELECT f.id, f.address_id, f.title, f.body, f.category, f.created_at 
		FROM feed_items f
		JOIN user_addresses ua ON f.address_id = ua.address_id
		WHERE ua.user_id = $1
		ORDER BY f.created_at DESC LIMIT 20
	`
	rows, err := storage.DB.Query(query, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var feed []models.FeedItem
	for rows.Next() {
		var item models.FeedItem
		var createdAt time.Time
		if err := rows.Scan(&item.ID, &item.AddressID, &item.Title, &item.Body, &item.Category, &createdAt); err == nil {
			item.CreatedAt = createdAt.Format(time.RFC3339)
			feed = append(feed, item)
		}
	}
	
	// Fetch pending requests for this user
	reqRows, reqErr := storage.DB.Query(`
		SELECT r.id, r.address_id, r.title, r.description, r.created_at 
		FROM requests r
		WHERE r.user_id = $1 AND r.status = 'pending'
		ORDER BY r.created_at DESC
	`, userID)
	
	if reqErr == nil {
		defer reqRows.Close()
		for reqRows.Next() {
			var item models.FeedItem
			var createdAt time.Time
			if err := reqRows.Scan(&item.ID, &item.AddressID, &item.Title, &item.Body, &createdAt); err == nil {
				item.Category = "pending_request"
				item.CreatedAt = createdAt.Format(time.RFC3339)
				// Prepend pending requests to the top of the feed
				feed = append([]models.FeedItem{item}, feed...)
			}
		}
	}

	if feed == nil {
		feed = []models.FeedItem{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(feed)
}

func GetMetersHandler(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	var water, electricity float64
	
	err := storage.DB.QueryRow("SELECT water, electricity FROM meters WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT 1", userID).Scan(&water, &electricity)
	if err != nil {
		// Если показаний нет, возвращаем нули
		water = 0
		electricity = 0
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"water": water, "electricity": electricity})
}

func PostMetersHandler(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	var req struct {
		Water       float64 `json:"water"`
		Electricity float64 `json:"electricity"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err := storage.DB.Exec("INSERT INTO meters (user_id, water, electricity) VALUES ($1, $2, $3)", userID, req.Water, req.Electricity)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func AnalyzePhotoHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ImageBase64 string `json:"image_base64"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	result, err := ai.ParseAnnouncement(req.ImageBase64)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func CreateRequestHandler(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	var req models.Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Находим адрес пользователя
	var addressID int
	err := storage.DB.QueryRow("SELECT address_id FROM user_addresses WHERE user_id = $1 LIMIT 1", userID).Scan(&addressID)
	if err != nil {
		http.Error(w, "User address not found: "+err.Error(), http.StatusBadRequest)
		return
	}

	_, err = storage.DB.Exec(`
		INSERT INTO requests (user_id, address_id, type, title, description, start_date, end_date, photo_url, status) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')`,
		userID, addressID, req.Type, req.Title, req.Description, req.StartDate, req.EndDate, req.PhotoURL)
		
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "created"})
}
