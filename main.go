package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	_ "github.com/mattn/go-sqlite3"
)

type Dict struct {
	Id          int    `json:"id"`
	Word        string `json:"word"`
	Sw          string `json:"sw"`
	Phonetic    string `json:"phonetic"`
	Definition  string `json:"definition"`
	Translation string `json:"translation"`
	Pos         string `json:"pos"`
	Collins     int    `json:"collins"`
	Oxford      int    `json:"xxford"`
	Tag         string `json:"tag"`
	Bnc         int    `json:"bnc"`
	Frq         int    `json:"frq"`
	Exchange    string `json:"exchange"`
	Detail      string `json:"detail"`
	Audio       string `json:"audio"`
}

var stmt *sql.Stmt

func handler(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	result := queryWord(q.Get("q"))
	fmt.Fprint(w, result)
}

func queryWord(q string) string {
	var dict Dict
	row := stmt.QueryRow(q)
	row.Scan(&dict.Id, &dict.Word, &dict.Sw, &dict.Phonetic, &dict.Definition,
		&dict.Translation, &dict.Pos, &dict.Collins, &dict.Oxford, &dict.Tag,
		&dict.Bnc, &dict.Frq, &dict.Exchange, &dict.Detail, &dict.Audio,
	)

	result, err := json.Marshal(&dict)

	if err != nil {
		log.Fatal("query fail", err)
	}
	return string(result)
}
func main() {
	// var err error
	db, err := sql.Open("sqlite3", "./ecdict.db")

	if err != nil {
		log.Fatal("unable to use data source name", err)
	}

	stmt, err = db.Prepare("SELECT * FROM stardict WHERE word = ?")

	if err != nil {
		log.Fatal(err)
	}

	defer stmt.Close()

	http.HandleFunc("/dict", handler)
	log.Println("Start listening on port 8080 of localhost")

	err = http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("run fail")
	}

}
