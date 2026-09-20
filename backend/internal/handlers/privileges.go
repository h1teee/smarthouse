package handlers

import (
	"backend/internal/models"
	"backend/internal/storage"
	"encoding/json"
	"net/http"
)

func GetPrivilegesHandler(w http.ResponseWriter, r *http.Request) {
	userID := 1

	hasDebt, err := storage.CheckUserDebt(userID)
	if err != nil {
		http.Error(w, "Error checking user debt", http.StatusInternalServerError)
		return
	}

	rows, err := storage.DB.Query(`SELECT o.id, p.name, o.badge_text, o.offer_text, o.icon_url, o.icon_bg_color, o.action_type, o.action_data, o.requires_zero_debt FROM offers o JOIN partners p ON o.partner_id = p.id WHERE o.is_active = true`)
	if err != nil {
		http.Error(w, "Database query error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var offers []models.Offer
	for rows.Next() {
		var o models.Offer
		var reqDebt bool
		rows.Scan(&o.ID, &o.PartnerName, &o.BadgeText, &o.OfferText, &o.IconURL, &o.IconBgColor, &o.ActionType, &o.ActionData, &reqDebt)
		o.IsLocked = reqDebt && hasDebt
		offers = append(offers, o)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Row iteration error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"data":   map[string]interface{}{"offers": offers},
	})
}
