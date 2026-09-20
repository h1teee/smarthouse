package handlers
import (
	"encoding/json"
	"net/http"
	"backend/internal/models"
	"backend/internal/storage"
)

func GetMapHousesHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := storage.DB.Query("SELECT id, latitude, longitude, water_status, electricity_status FROM houses")
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var houses []models.House
	for rows.Next() {
		var h models.House
		rows.Scan(&h.ID, &h.Lat, &h.Lng, &h.WaterStatus, &h.ElectricityStatus)
		houses = append(houses, h)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Row iteration error", http.StatusInternalServerError)
		return
	}

	if houses == nil {
		houses = []models.House{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(houses)
}