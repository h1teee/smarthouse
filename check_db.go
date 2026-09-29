package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	godotenv.Load("backend/.env") // or just use the DB_URL the user gave
	dbURL := "postgresql://postgres.vrzadvmrrioaushndyjk:GZLRKQ1DrV74vNab@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal(err)
	}
	
	rows, err := db.Query("SELECT id, vk_id FROM users WHERE vk_id ~ '^[0-9]+$'")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	fmt.Println("Numeric vk_ids:")
	count := 0
	for rows.Next() {
		var id int
		var vkID string
		rows.Scan(&id, &vkID)
		fmt.Printf("id: %d, vk_id: %s\n", id, vkID)
		count++
	}
	fmt.Printf("Total numeric vk_ids: %d\n", count)
	
	// Also get all non-numeric ones just to see
	rows2, _ := db.Query("SELECT count(*) FROM users")
	var total int
	rows2.Next()
	rows2.Scan(&total)
	fmt.Printf("Total users in DB: %d\n", total)
}
