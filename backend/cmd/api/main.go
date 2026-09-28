package main

import (
	"log"
	"net/http"
	"os"

	"backend/internal/handlers"
	"backend/internal/storage"

	"github.com/joho/godotenv"
)

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-ID")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	godotenv.Load("../../.env")

	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		log.Fatal("DB_URL environment variable is not set")
	}
	storage.InitDB(dbURL)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Auth
	mux.HandleFunc("POST /api/auth/login", handlers.LoginHandler)
	mux.HandleFunc("POST /api/auth/login-by-account", handlers.LoginByAccountHandler)
	mux.HandleFunc("POST /api/user/link-address", handlers.LinkAddressHandler)

	// Resident data
	mux.HandleFunc("GET /api/feed", handlers.GetFeedHandler)
	mux.HandleFunc("GET /api/bills", handlers.GetBillsHandler)
	mux.HandleFunc("POST /api/bills/{id}/pay", handlers.PayBillHandler)
	mux.HandleFunc("GET /api/meters", handlers.GetMetersHandler)
	mux.HandleFunc("POST /api/meters", handlers.PostMetersHandler)
	mux.HandleFunc("GET /api/notifications", handlers.GetNotificationsHandler)

	// AI endpoints
	mux.HandleFunc("GET /api/bills/{id}/ai-analysis", handlers.BillAIAnalysisHandler)
	mux.HandleFunc("POST /api/requests/ai-recognize", handlers.AnalyzePhotoHandler)
	mux.HandleFunc("POST /api/ai/improve-text", handlers.ImproveTextHandler)
	mux.HandleFunc("GET /api/uk/analytics/ai", handlers.AIWeeklyAnalysisHandler)

	// Privileges
	mux.HandleFunc("GET /api/v1/profile/privileges", handlers.GetPrivilegesHandler)

	// Requests
	mux.HandleFunc("POST /api/requests", handlers.CreateRequestHandler)
	mux.HandleFunc("PATCH /api/requests/{id}/status", handlers.UpdateRequestStatusHandler)

	// UK endpoints
	mux.HandleFunc("GET /api/uk/requests", handlers.GetUKRequestsHandler)
	mux.HandleFunc("POST /api/uk/requests/{id}/approve", handlers.ApproveRequestHandler)
	mux.HandleFunc("POST /api/uk/requests/{id}/reject", handlers.RejectRequestHandler)
	mux.HandleFunc("POST /api/uk/broadcast", handlers.BroadcastHandler)
	mux.HandleFunc("GET /api/uk/objects", handlers.GetUKObjectsHandler)
	mux.HandleFunc("GET /api/uk/analytics", handlers.GetUKAnalyticsHandler)

	// Addresses
	mux.HandleFunc("GET /api/addresses", handlers.GetAddressesHandler)

	// Map
	mux.HandleFunc("GET /api/map/houses", handlers.GetMapHousesHandler)

	// MAX bot webhook
	mux.HandleFunc("POST /api/max/webhook", handlers.MaxWebhookHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("Server running on :" + port)
	log.Fatal(http.ListenAndServe(":"+port, enableCORS(mux)))
}