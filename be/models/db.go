package models

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

func InitDB() *sql.DB {
	dbinfo := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		os.Getenv("DB_HOST"), os.Getenv("DB_PORT"), os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_NAME"))
	// "localhost", "5432", "postgres", "postgres", "postgres")
	db, err := sql.Open("postgres", dbinfo)
	if err != nil {
		log.Fatalf("Error: The data source arguments are not valid: %s\n", err)
	}
	db.Ping()
	if err != nil {
		log.Fatalf("Error: Could not establish a connection with the database: %s\n", err)
	}

	return db
}
