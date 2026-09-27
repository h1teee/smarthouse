package handlers

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
)

// Update structure for MAX webhook
type MaxUpdate struct {
	Type   string          `json:"type"`
	Object json.RawMessage `json:"object"`
}

func MaxWebhookHandler(w http.ResponseWriter, r *http.Request) {
	// Check the secret
	secret := r.Header.Get("X-Max-Bot-Api-Secret")
	if secret != "smarthouse_hackathon_secret" {
		log.Println("Webhook unauthorized: wrong secret")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	log.Println("Received webhook from MAX:", string(body))

	// Always return 200 OK fast
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"success":true}`))
}