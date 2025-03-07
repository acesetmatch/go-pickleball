package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func main() {
	if err := InitDB(); err != nil {
		log.Fatalf("Error initializing database: %v", err)
	}

	router := mux.NewRouter()

	router.HandleFunc("/api/paddle/stats/:id", withCommonHeaders(getPaddleStats)).Methods("GET")
	router.HandleFunc("/api/paddle/stats", withCommonHeaders(uploadPaddleStats)).Methods("POST")
	// You can add more endpoints here, wrapping them with the middleware
	http.ListenAndServe(":8080", router)
}
