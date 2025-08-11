package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
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
	// Get all paddles with basic info for cards
	router.HandleFunc("/api/paddles", withCommonHeaders(getPaddlesList)).Methods("GET")

	// Get complete details for a specific paddle
	router.HandleFunc("/api/paddles/{id}", withCommonHeaders(getPaddleDetails)).Methods("GET")

	// Upload paddle stats endpoint
	router.HandleFunc("/api/paddles", withCommonHeaders(uploadPaddleStats)).Methods("POST")

	// Add logging middleware
	router.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			log.Printf("Received request: %s %s", r.Method, r.URL.Path)
			next.ServeHTTP(w, r)
		})
	})

	// Enable CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"}, // Your frontend URL
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	// Use the CORS middleware
	handler := c.Handler(router)

	// Start the server with CORS enabled
	log.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}
