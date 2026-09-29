--- backend/internal/handlers/uk.go
+++ backend/internal/handlers/uk.go
@@ -217,13 +217,14 @@
 		return "no_user_id"
 	}
 	
-	url := "https://platform-api2.max.ru/messages?user_id=" + userID + "&access_token=" + token
+	url := "https://platform-api2.max.ru/messages?user_id=" + userID
 	
 	payload := map[string]interface{}{
 		"text": "🔔 ВАЖНОЕ СООБЩЕНИЕ ОТ УК:\n\n" + text,
 	}
 	body, _ := json.Marshal(payload)
 	
 	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
+	req.Header.Set("Authorization", token)
 	req.Header.Set("Content-Type", "application/json")
 	
 	client := &http.Client{
