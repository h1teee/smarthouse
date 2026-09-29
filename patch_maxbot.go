--- backend/internal/bot/maxbot.go
+++ backend/internal/bot/maxbot.go
@@ -28,8 +28,9 @@
 	body, _ := json.Marshal(payload)
 
 	for _, vkID := range vkIDs {
-		url := fmt.Sprintf("https://platform-api2.max.ru/messages?user_id=%s&access_token=%s", vkID, token)
+		url := fmt.Sprintf("https://platform-api2.max.ru/messages?user_id=%s", vkID)
 		req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
+		req.Header.Set("Authorization", token)
 		req.Header.Set("Content-Type", "application/json")
 
 		client := &http.Client{
