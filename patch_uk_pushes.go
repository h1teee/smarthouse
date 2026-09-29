--- backend/internal/handlers/uk.go
+++ backend/internal/handlers/uk.go
@@ -107,17 +107,26 @@
 func ApproveRequestHandler(w http.ResponseWriter, r *http.Request) {
 	reqID := r.PathValue("id")
 	
 	var req models.Request
 	err := storage.DB.QueryRow("SELECT address_id, type, title, description FROM requests WHERE id = $1", reqID).
 		Scan(&req.AddressID, &req.Type, &req.Title, &req.Description)
 	
 	if err == nil {
 		storage.DB.Exec("UPDATE requests SET status = 'approved' WHERE id = $1", reqID)
 		// Publish approved announcement to feed_items so all residents see it!
 		storage.DB.Exec("INSERT INTO feed_items (address_id, title, body, category) VALUES ($1, $2, $3, $4)",
 			req.AddressID, req.Title, req.Description, req.Type)
+			
+		// Отправляем пуш жителю (для демо - берем всех с vk_id)
+		rows, err := storage.DB.Query("SELECT vk_id FROM users WHERE vk_id IS NOT NULL AND vk_id != ''")
+		if err == nil {
+			var vkIDs []string
+			for rows.Next() { var id string; rows.Scan(&id); vkIDs = append(vkIDs, id) }
+			bot.SendPushNotification(vkIDs, "✅ Ваша заявка одобрена:\n" + req.Title, reqID)
+			rows.Close()
+		}
 	} else {
 		storage.DB.Exec("UPDATE requests SET status = 'approved' WHERE id = $1", reqID)
 	}
 
 	w.Header().Set("Content-Type", "application/json")
@@ -128,11 +137,23 @@
 func RejectRequestHandler(w http.ResponseWriter, r *http.Request) {
 	reqID := r.PathValue("id")
 	storage.DB.Exec("UPDATE requests SET status = 'rejected' WHERE id = $1", reqID)
 	
+	// Отправляем пуш жителю (для демо - берем всех с vk_id)
+	rows, err := storage.DB.Query("SELECT vk_id FROM users WHERE vk_id IS NOT NULL AND vk_id != ''")
+	if err == nil {
+		var vkIDs []string
+		for rows.Next() { var id string; rows.Scan(&id); vkIDs = append(vkIDs, id) }
+		var title string
+		storage.DB.QueryRow("SELECT title FROM requests WHERE id = $1", reqID).Scan(&title)
+		bot.SendPushNotification(vkIDs, "❌ Заявка отклонена УК:\n" + title, reqID)
+		rows.Close()
+	}
+
 	w.Header().Set("Content-Type", "application/json")
 	w.WriteHeader(http.StatusOK)
 	json.NewEncoder(w).Encode(map[string]string{"status": "rejected"})
 }
