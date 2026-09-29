package main

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func main() {
	dsn := "postgresql://postgres.vrzadvmrrioaushndyjk:GZLRKQ1DrV74vNab@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&default_query_exec_mode=exec"
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer db.Close()
	rows, err := db.Query("SELECT column_name FROM information_schema.columns WHERE table_name = 'requests'")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	for rows.Next() {
		var name string
		rows.Scan(&name)
		fmt.Println(name)
	}
}
