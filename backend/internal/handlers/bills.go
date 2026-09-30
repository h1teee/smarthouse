package handlers

import (
	"backend/internal/ai"
	"backend/internal/bot"
	"backend/internal/storage"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strconv"
	"time"
)

type Bill struct {
	ID            int     `json:"id"`
	UserID        int     `json:"user_id"`
	Month         string  `json:"month"`
	Amount        float64 `json:"amount"`
	IsPaid        bool    `json:"is_paid"`
	AccountNumber string  `json:"account_number,omitempty"`
}

type PayBillRequest struct {
	PaymentMethod string `json:"payment_method"`
	AccountNumber string `json:"account_number"`
}

type PayBillResponse struct {
	Status        string  `json:"status"`
	TransactionID string  `json:"transaction_id"`
	ReceiptNumber string  `json:"receipt_number"`
	AccountNumber string  `json:"account_number"`
	Recipient     string  `json:"recipient"`
	RecipientINN  string  `json:"recipient_inn"`
	Amount        float64 `json:"amount"`
	Month         string  `json:"month"`
	PaidAt        string  `json:"paid_at"`
	PaymentMethod string  `json:"payment_method"`
}

func GetBillsHandler(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)
	if userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var accNum string
	if storage.DB != nil {
		_ = storage.DB.QueryRow("SELECT account_number FROM user_addresses WHERE user_id = $1 LIMIT 1", userID).Scan(&accNum)
	}
	if accNum == "" {
		accNum = "61-0001-0015"
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
			b.UserID = userID
			b.AccountNumber = accNum
			bills = append(bills, b)
		}
	}
	if bills == nil {
		bills = []Bill{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bills)
}

func PayBillHandler(w http.ResponseWriter, r *http.Request) {
	billIDStr := r.PathValue("id")
	billID, _ := strconv.Atoi(billIDStr)
	userID := getUserID(r)

	var req PayBillRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	if req.PaymentMethod == "" {
		req.PaymentMethod = "СБП"
	}

	var amount float64
	var month string
	var currentIsPaid bool
	var billUserID int

	if storage.DB != nil && billID > 0 {
		_ = storage.DB.QueryRow("SELECT amount, month, is_paid, user_id FROM bills WHERE id = $1", billID).Scan(&amount, &month, &currentIsPaid, &billUserID)
	}

	if amount == 0 {
		amount = 5100.00
		month = "Ноябрь 2024"
	}

	// Fetch account number
	accNum := req.AccountNumber
	if accNum == "" && storage.DB != nil && userID > 0 {
		_ = storage.DB.QueryRow("SELECT account_number FROM user_addresses WHERE user_id = $1 LIMIT 1", userID).Scan(&accNum)
	}
	if accNum == "" {
		accNum = "61-0001-0015"
	}

	// Requisites of the management company
	recipientName := "ООО УК «Смарт Сити»"
	recipientINN := "6164123456"

	// Generate transaction ID and fiscal receipt number
	now := time.Now()
	txID := fmt.Sprintf("TX-SBP-%d-%d", now.Unix(), billID)
	receiptNum := fmt.Sprintf("FN-%d-%06d", now.Year(), rand.Intn(900000)+100000)
	paidAtStr := now.Format("02.01.2006 15:04")

	log.Printf("[PAYMENT] Processing bill payment #%d: Amount=%.2f, Account=%s, Recipient=%s (%s), Method=%s, Tx=%s\n",
		billID, amount, accNum, recipientName, recipientINN, req.PaymentMethod, txID)

	// Update bill status in DB
	if storage.DB != nil && billID > 0 {
		_, err := storage.DB.Exec("UPDATE bills SET is_paid = true WHERE id = $1", billID)
		if err != nil {
			log.Println("[PAYMENT] Error updating bill in DB:", err)
		}
	}

	// Send confirmation push notification to user's bot
	var vkID string
	targetUserID := userID
	if targetUserID == 0 {
		targetUserID = billUserID
	}
	if targetUserID == 0 {
		targetUserID = 1
	}

	if storage.DB != nil {
		_ = storage.DB.QueryRow("SELECT vk_id FROM users WHERE id = $1", targetUserID).Scan(&vkID)
	}

	if vkID != "" {
		pushMsg := fmt.Sprintf("💳 Квитанция успешно оплачена!\n\nПериод: %s\nСумма: %.2f ₽\nЛицевой счёт: %s\nПолучатель: %s\nЧек: %s\nСпособ: %s (без комиссии)\n\nСпасибо за своевременную оплату!",
			month, amount, accNum, recipientName, receiptNum, req.PaymentMethod)
		go func() {
			_ = bot.SendPushNotification([]string{vkID}, pushMsg, txID)
		}()
	}

	resp := PayBillResponse{
		Status:        "paid",
		TransactionID: txID,
		ReceiptNumber: receiptNum,
		AccountNumber: accNum,
		Recipient:     recipientName,
		RecipientINN:  recipientINN,
		Amount:        amount,
		Month:         month,
		PaidAt:        paidAtStr,
		PaymentMethod: req.PaymentMethod,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func ResetBillHandler(w http.ResponseWriter, r *http.Request) {
	billIDStr := r.PathValue("id")
	billID, _ := strconv.Atoi(billIDStr)
	if storage.DB != nil && billID > 0 {
		storage.DB.Exec("UPDATE bills SET is_paid = false WHERE id = $1", billID)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "unpaid"})
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

func BillAIChatHandler(w http.ResponseWriter, r *http.Request) {
	billIDStr := r.PathValue("id")
	billID, _ := strconv.Atoi(billIDStr)

	var req struct {
		Message string `json:"message"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	reply, err := ai.ChatAboutBill(billID, req.Message)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"reply": reply})
}