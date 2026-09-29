--- backend/internal/bot/maxbot.go
+++ backend/internal/bot/maxbot.go
@@ -3,6 +3,7 @@
 import (
 	"bytes"
 	"crypto/tls"
 	"encoding/json"
 	"fmt"
+	"io"
 	"log"
@@ -40,7 +41,9 @@
 		}
-		resp.Body.Close()
 
 		if resp.StatusCode != 200 {
-			log.Printf("MAX API returned status %d for user %s\n", resp.StatusCode, vkID)
+			b, _ := io.ReadAll(resp.Body)
+			log.Printf("MAX API returned status %d for user %s. Body: %s\n", resp.StatusCode, vkID, string(b))
 		}
+		resp.Body.Close()
 	}
 	return nil
