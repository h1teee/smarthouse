package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"backend/internal/storage"
)

type AddressItem struct {
	ID          int     `json:"id"`
	FullAddress string  `json:"full_address"`
	Lat         float64 `json:"lat"`
	Lng         float64 `json:"lng"`
}

func GetAddressesHandler(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	var rows *sql.Rows
	var err error
	if q != "" {
		rows, err = storage.DB.Query("SELECT id, full_address, lat, lng FROM addresses WHERE full_address ILIKE '%' || $1 || '%' ORDER BY full_address LIMIT 50", q)
	} else {
		rows, err = storage.DB.Query("SELECT id, full_address, lat, lng FROM addresses ORDER BY full_address LIMIT 200")
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var addresses []AddressItem
	for rows.Next() {
		var a AddressItem
		if err := rows.Scan(&a.ID, &a.FullAddress, &a.Lat, &a.Lng); err == nil {
			addresses = append(addresses, a)
		}
	}
	if addresses == nil {
		addresses = []AddressItem{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(addresses)
}

func GetNotificationsHandler(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)

	query := `
		SELECT f.id, f.title, f.body, f.category, f.created_at
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

	type Notification struct {
		ID        int    `json:"id"`
		Title     string `json:"title"`
		Body      string `json:"body"`
		Category  string `json:"category"`
		CreatedAt string `json:"created_at"`
	}

	var notifs []Notification
	for rows.Next() {
		var n Notification
		if err := rows.Scan(&n.ID, &n.Title, &n.Body, &n.Category, &n.CreatedAt); err == nil {
			notifs = append(notifs, n)
		}
	}
	if notifs == nil {
		notifs = []Notification{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notifs)
}