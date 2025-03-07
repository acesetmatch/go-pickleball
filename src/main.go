package main

import (
	"log"
	"net/http"
)

func main() {
	if err := InitDB(); err != nil {
		log.Fatalf("Error initializing database: %v", err)
	}

	http.HandleFunc("/api/paddle/stats", withCommonHeaders(getPaddleStats))
	http.HandleFunc("/api/paddle/stats", withCommonHeaders(uploadPaddleStats))
	// You can add more endpoints here, wrapping them with the middleware
	http.ListenAndServe(":8080", nil)
}

// Middleware to set common headers and handle errors
func withCommonHeaders(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Set common headers
		w.Header().Set("Content-Type", "application/json")

		// Call the next handler
		next(w, r)
	}
}
