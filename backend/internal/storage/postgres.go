package storage

import (
	"database/sql"
	"log"
	_ "github.com/jackc/pgx/v5/stdlib"
)

var DB *sql.DB

func InitDB(dsn string) {
	var err error
	DB, err = sql.Open("pgx", dsn)
	if err != nil {
		log.Fatalf("Ошибка БД: %v", err)
	}
	log.Println("PostgreSQL подключен")
}

func CheckUserDebt(userID int) (bool, error) {
	var totalDebt float64
	err := DB.QueryRow(`SELECT COALESCE(SUM(total_amount), 0) FROM bills WHERE account_number IN (SELECT account_number FROM utility_accounts WHERE user_id = $1) AND is_paid = false`, userID).Scan(&totalDebt)
	if err != nil {
		return false, err
	}
	return totalDebt > 0, nil
}