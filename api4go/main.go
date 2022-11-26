package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/mattn/go-sqlite3"
)

type Dict struct {
	Id          int     `json:"id"`
	Word        string  `json:"word"`
	Sw          string  `json:"sw"`
	Phonetic    string  `json:"phonetic"`
	Definition  string  `json:"definition"`
	Translation string  `json:"translation"`
	Pos         string  `json:"pos"`
	Collins     *int    `json:"collins"`
	Oxford      *int    `json:"oxford"`
	Tag         string  `json:"tag"`
	Bnc         int     `json:"bnc"`
	Frq         int     `json:"frq"`
	Exchange    string  `json:"exchange"`
	Detail      *string `json:"detail"`
	Audio       string  `json:"audio"`
}

var stmt *sql.Stmt

func initDB(dbPath string) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatal("unable to use data source name", err)
	}
	stmt, err = db.Prepare("SELECT * FROM stardict WHERE word = ?")
	if err != nil {
		log.Fatal(err)
	}
}

func dictHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	q := query.Get("q")
	if q != "" {
		result, err := queryWord(q)
		if err == nil {
			json.NewEncoder(w).Encode(result)
		}
	}
}

func queryWord(q string) (dict Dict, err error) {
	row := stmt.QueryRow(q)
	err = row.Scan(&dict.Id, &dict.Word, &dict.Sw, &dict.Phonetic, &dict.Definition,
		&dict.Translation, &dict.Pos, &dict.Collins, &dict.Oxford, &dict.Tag,
		&dict.Bnc, &dict.Frq, &dict.Exchange, &dict.Detail, &dict.Audio,
	)

	return
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file", err)
	}

	port := os.Getenv("PORT")
	dbPath := os.Getenv("DB_URL")

	initDB(dbPath)
	defer stmt.Close()

	http.HandleFunc("/dict", dictHandler)
	fmt.Println("Listening on http://localhost:" + port)
	err = http.ListenAndServe(":"+port, nil)

	if err != nil {
		log.Fatal("run fail", err)
	}

}
