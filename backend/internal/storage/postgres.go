package storage

import (
	"database/sql"
	"log"
	"strings"
	_ "github.com/jackc/pgx/v5/stdlib"
)

var DB *sql.DB

func InitDB(dsn string) {
	var err error
	
	// Add PgBouncer workaround for pgx v5 if not present
	if !strings.Contains(dsn, "default_query_exec_mode") {
		if strings.Contains(dsn, "?") {
			dsn += "&default_query_exec_mode=exec"
		} else {
			dsn += "?default_query_exec_mode=exec"
		}
	}

	DB, err = sql.Open("pgx", dsn)
	if err != nil {
		log.Fatalf("Ошибка DSN: %v", err)
	}

	if err := DB.Ping(); err != nil {
		log.Fatalf("Supabase ошибка: %v", err)
	}
	log.Println("Успешное подключение к базе данных!")
}

func CheckUserDebt(userID int) (bool, error) {
	var unpaidCount int
	err := DB.QueryRow("SELECT COUNT(id) FROM bills WHERE user_id = $1 AND is_paid = false", userID).Scan(&unpaidCount)
	if err != nil {
		return false, err
	}
	return unpaidCount > 0, nil
}