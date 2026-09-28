package handlers

import (
	"backend/internal/ai"
	"backend/internal/storage"
	"encoding/json"
	"net/http"
	"strconv"
)

type Bill struct {
	ID          int     `json:"id"`
	UserID      int     `json:"user_id"`
	Month       string  `json:"month"`
	Amount      float64 `json:"amount"`
	IsPaid      bool    `json:"is_paid"`
}

func GetBillsHandler(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	if userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	rows, err := storage.DB.Query("SELECT id, month, amount, is_paid FROM bills WHERE user_id = $1 ORDER BY id DESC", userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var bills []Bill
	for rows.Next() {
		var b Bill
		if err := rows.Scan(&b.ID, &b.Month, &b.Amount, &b.IsPaid); err == nil {
			bills = append(bills, b)
		}
	}
	if bills == nil {
		bills = []Bill{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bills)
}

func BillAIAnalysisHandler(w http.ResponseWriter, r *http.Request) {
	billIDStr := r.PathValue("id")
	billID, _ := strconv.Atoi(billIDStr)
	
	analysis, err := ai.AnalyzeBill(billID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"summary": analysis})
}