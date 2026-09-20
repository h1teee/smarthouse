package handlers
import (
	"encoding/json"
	"net/http"
	"time"
)

func BillAIAnalysisHandler(w http.ResponseWriter, r *http.Request) {
	time.Sleep(2 * time.Second)
	response := map[string]string{
		"ai_analysis_summary": "Счет вырос на 4% из-за горячей воды.",
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}