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
	userID := getUserID(r)
	
	// 1. Get official feed items for user's address
	query := `
		SELECT f.id, f.address_id, f.title, f.body, f.category, f.created_at 
		FROM feed_items f
		JOIN user_addresses ua ON f.address_id = ua.address_id
		WHERE ua.user_id = $1
		ORDER BY f.created_at DESC LIMIT 30
	`
	rows, err := storage.DB.Query(query, userID)
	if err != nil {
		rows, err = storage.DB.Query("SELECT id, address_id, title, body, category, created_at FROM feed_items ORDER BY created_at DESC LIMIT 30")
	}
	if rows != nil {
		defer rows.Close()
	}

	var feed []models.FeedItem
	if err == nil && rows != nil {
		for rows.Next() {
			var item models.FeedItem
			var createdAt time.Time
			if err := rows.Scan(&item.ID, &item.AddressID, &item.Title, &item.Body, &item.Category, &createdAt); err == nil {
				item.CreatedAt = createdAt.Format(time.RFC3339)
				feed = append(feed, item)
			}
		}
	}
	
	// 2. Fetch requests submitted by this user (pending, approved, rejected)
	reqRows, reqErr := storage.DB.Query(`
		SELECT r.id, r.address_id, r.title, r.description, r.status, r.created_at 
		FROM requests r
		WHERE r.user_id = $1
		ORDER BY r.created_at DESC LIMIT 20
	`, userID)
	
	if reqErr == nil && reqRows != nil {
		defer reqRows.Close()
		for reqRows.Next() {
			var item models.FeedItem
			var status string
			var createdAt time.Time
			if err := reqRows.Scan(&item.ID, &item.AddressID, &item.Title, &item.Body, &status, &createdAt); err == nil {
				item.Category = "request_" + status
				item.CreatedAt = createdAt.Format(time.RFC3339)
				// Prepend to feed so personal requests appear at top
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
	var water, coldWater, electricity float64

	err := storage.DB.QueryRow("SELECT water, COALESCE(cold_water, 0), electricity FROM meters WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT 1", userID).
		Scan(&water, &coldWater, &electricity)
	if err != nil {
		water = 125.5
		coldWater = 210.0
		electricity = 450.0
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"water":       water,
		"cold_water":  coldWater,
		"electricity": electricity,
	})
}

func PostMetersHandler(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	var req struct {
		Water       *float64 `json:"water"`
		ColdWater   *float64 `json:"cold_water"`
		Electricity *float64 `json:"electricity"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var currentWater, currentColdWater, currentElectricity float64
	_ = storage.DB.QueryRow("SELECT water, COALESCE(cold_water, 0), electricity FROM meters WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT 1", userID).
		Scan(&currentWater, &currentColdWater, &currentElectricity)

	newWater := currentWater
	if req.Water != nil {
		newWater = *req.Water
	}
	newColdWater := currentColdWater
	if req.ColdWater != nil {
		newColdWater = *req.ColdWater
	}
	newElectricity := currentElectricity
	if req.Electricity != nil {
		newElectricity = *req.Electricity
	}

	_, err := storage.DB.Exec("INSERT INTO meters (user_id, water, cold_water, electricity) VALUES ($1, $2, $3, $4)",
		userID, newWater, newColdWater, newElectricity)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":      "success",
		"water":       newWater,
		"cold_water":  newColdWater,
		"electricity": newElectricity,
	})
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
		_ = storage.DB.QueryRow("SELECT id FROM addresses LIMIT 1").Scan(&addressID)
		if addressID == 0 {
			addressID = 1
		}
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
