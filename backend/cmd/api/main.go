package main
import (
	"log"
	"net/http"
	"os"
	"backend/internal/handlers"
	"backend/internal/storage"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()
	dbURL := os.Getenv("DB_URL")
	if dbURL == "" { dbURL = "postgres://admin:password@localhost:5432/smarthouse" }
	storage.InitDB(dbURL)

	mux := http.NewServeMux()
	
	mux.HandleFunc("POST /api/auth/send-code", handlers.SendCodeHandler)
	mux.HandleFunc("GET /api/map/houses", handlers.GetMapHousesHandler)
	mux.HandleFunc("GET /api/bills/{billId}/ai-analysis", handlers.BillAIAnalysisHandler)
	mux.HandleFunc("GET /api/v1/profile/privileges", handlers.GetPrivilegesHandler)
	mux.HandleFunc("POST /api/requests/ai-recognize", handlers.RecognizeHandler)
	mux.HandleFunc("PATCH /api/requests/{id}/status", handlers.UpdateStatusHandler)

	log.Println("Сервер запущен на :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}