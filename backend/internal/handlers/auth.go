package handlers

import (
	"encoding/json"
	"net/http"
	"backend/internal/storage"
	"database/sql"
	"strconv"
)

// Helper to get user ID from headers (or default to 1 if not provided)
func getUserID(r *http.Request) int {
	idStr := r.Header.Get("X-User-ID")
	if idStr == "" {
		return 1 // Fallback for backward compatibility
	}
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return 1
	}
	return id
}

// Login by Account Number and Apartment (for the Hackathon case)
func LoginByAccountHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		AccountNumber string `json:"account_number"`
		Apartment     string `json:"apartment"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	var userID int
	err := storage.DB.QueryRow("SELECT ua.user_id FROM user_addresses ua JOIN addresses a ON ua.address_id = a.id WHERE ua.account_number = $1 AND a.full_address = $2 LIMIT 1", req.AccountNumber, req.Apartment).Scan(&userID)
	
	if err == sql.ErrNoRows {
		http.Error(w, "Account or apartment not found", http.StatusUnauthorized)
		return
	} else if err != nil {
		http.Error(w, "DB error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token": strconv.Itoa(userID), 
		"user_id": userID,
		"role": "resident",
	})
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var req struct{ VkID string `json:"user_id"` }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("[AUTH] LoginHandler called with user_id: %s\n", req.VkID)

	var userID int
	var role string
	err := storage.DB.QueryRow("SELECT id, role FROM users WHERE vk_id = $1", req.VkID).Scan(&userID, &role)
	
	if err == sql.ErrNoRows {
		err = storage.DB.QueryRow("INSERT INTO users (vk_id, role) VALUES ($1, 'resident') RETURNING id, role", req.VkID).Scan(&userID, &role)
		if err != nil {
			log.Println("[AUTH] DB error creating user:", err)
			http.Error(w, "DB error: "+err.Error(), http.StatusInternalServerError)
			return
		}
		log.Printf("[AUTH] Created new resident user in DB: ID=%d, vk_id=%s\n", userID, req.VkID)
		// Привязываем к первому адресу для демо
		storage.DB.Exec("INSERT INTO user_addresses (user_id, address_id, apartment, account_number) VALUES ($1, 1, '15', '61-0001-0015') ON CONFLICT (user_id, address_id) DO NOTHING", userID)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"token": req.VkID, "role": role, "user_id": userID})
}

func LinkAddressHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		AddressID     int    `json:"address_id"`
		Apartment     string `json:"apartment"`
		AccountNumber string `json:"account_number"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	
	userID := getUserID(r)
	
	_, err := storage.DB.Exec(`
		INSERT INTO user_addresses (user_id, address_id, apartment, account_number) 
		VALUES ($1, $2, $3, $4) 
		ON CONFLICT (user_id, address_id) DO NOTHING`,
		userID, req.AddressID, req.Apartment, req.AccountNumber)
		
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}