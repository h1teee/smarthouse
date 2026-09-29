--- backend/internal/handlers/uk.go
+++ backend/internal/handlers/uk.go
@@ -194,22 +194,14 @@
 		// Для простоты, так как драйвер pq/pgx может требовать специальный тип, 
 		// можно использовать github.com/lib/pq, или просто сформировать запрос.
-		// Но проще в цикле получить, если адресов немного:
-		
-		for _, addrID := range req.SelectedIds {
-			rows, err := storage.DB.Query(`
-				SELECT u.vk_id 
-				FROM users u 
-				JOIN user_addresses ua ON u.id = ua.user_id 
-				WHERE ua.address_id = $1 AND u.vk_id IS NOT NULL AND u.vk_id != ''
-			`, addrID)
-			
-			if err == nil {
-				for rows.Next() {
-					var vkID string
-					if err := rows.Scan(&vkID); err == nil {
-						vkIDs = append(vkIDs, vkID)
-					}
-				}
-				rows.Close()
+		
+		// ДЛЯ ДЕМО-ВЕРСИИ: Мы берем всех пользователей, у которых есть vk_id, 
+		// чтобы гарантированно доставить пуш тестерам (игнорируя фильтр по адресам)
+		rows, err := storage.DB.Query("SELECT vk_id FROM users WHERE vk_id IS NOT NULL AND vk_id != ''")
+		if err == nil {
+			for rows.Next() {
+				var vkID string
+				if err := rows.Scan(&vkID); err == nil {
+					vkIDs = append(vkIDs, vkID)
+				}
 			}
+			rows.Close()
 		}
