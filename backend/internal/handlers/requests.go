package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"time"
	
	"backend/internal/ai"
	"backend/internal/models"
	"backend/internal/storage"
)

// POST /api/requests/ai-recognize
func RecognizeHandler(w http.ResponseWriter, r *http.Request) {
	if os.Getenv("USE_MOCK_AI") == "true" {
		time.Sleep(2 * time.Second)
		json.NewEncoder(w).Encode(models.Request{
			Type: "water", 
			Title: "Отключение воды (Мок)", 
			StartDate: "15.10", 
			EndDate: "16.10",
			Description: "Текст сгенерирован локально без интернета.",
		})
		return
	}

	var req models.UploadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Ошибка чтения JSON", http.StatusBadRequest)
		return
	}
	
	// Вызываем наш новый модуль ai/openrouter.go
	result, err := ai.AnalyzeImage(req.ImageBase64)
	if err != nil {
		http.Error(w, "ИИ недоступен: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// PATCH /api/requests/{id}/status
func UpdateStatusHandler(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req models.StatusUpdate
	json.NewDecoder(r.Body).Decode(&req)
	
	storage.DB.Exec("UPDATE requests SET status = $1 WHERE id = $2", req.Status, id)
	
	json.NewEncoder(w).Encode(map[string]string{"message": "success"})
}