package handlers

import (
	"encoding/json"
	"net/http"
	"backend/internal/models"
	"backend/internal/storage"
)

func GetPrivilegesHandler(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	hasDebt, _ := storage.CheckUserDebt(userID)

	query := `SELECT o.id, p.name, o.badge_text, o.offer_text, o.icon_url, o.action_type, o.action_data, o.requires_zero_debt 
			  FROM offers o JOIN partners p ON o.partner_id = p.id WHERE o.is_active = true ORDER BY o.id ASC`
	rows, err := storage.DB.Query(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var offers []models.Offer
	for rows.Next() {
		var o models.Offer
		var reqDebt bool
		if err := rows.Scan(&o.ID, &o.PartnerName, &o.BadgeText, &o.OfferText, &o.IconURL, &o.ActionType, &o.ActionData, &reqDebt); err == nil {
			o.IsLocked = reqDebt && hasDebt
			offers = append(offers, o)
		}
	}
	if offers == nil {
		offers = []models.Offer{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(offers)
}