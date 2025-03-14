package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func main() {
	// Initialize database
	log.Println("Initializing database connection...")
	if err := InitDB(); err != nil {
		log.Fatalf("Error initializing database: %v", err)
	}
	log.Println("Database connection established successfully")
	defer CloseDB()

	// Create router
	router := mux.NewRouter()

	// Add a simple test route
	router.HandleFunc("/test", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Server is working!"))
	}).Methods("GET")

	// Add your API routes
	router.HandleFunc("/api/paddle", withCommonHeaders(uploadPaddleStats)).Methods("POST")
	router.HandleFunc("/api/paddle/{id}", withCommonHeaders(getPaddleStats)).Methods("GET")

	// Add logging middleware
	router.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			log.Printf("Received request: %s %s", r.Method, r.URL.Path)
			next.ServeHTTP(w, r)
		})
	})

	// Start the server - THIS LINE IS CRITICAL
	log.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", router))
}
