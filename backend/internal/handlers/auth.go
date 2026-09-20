package handlers
import (
	"encoding/json"
	"net/http"
)

func SendCodeHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "SMS sent"})
}