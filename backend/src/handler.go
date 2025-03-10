package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

// e.g paddle tatus
// paddle := Paddle{
// 	ID: "ENGAGE-PURSUIT-MX-6.0-2023-42069",
// 	Specs: Specs{
// 		Name:              "Engage Pursuit MX",
// 		Surface:           "Composite",
// 		AverageWeight:     220.0,
// 		Core:              15.0,
// 		PaddleLength:      16.5,
// 		PaddleWidth:       7.5,
// 		GripLength:        4.5,
// 		GripType:          "Comfort",
// 		GripCircumference: 4.0,
// 	},
// 	Performance: Performance{
// 		Power:        75.0,
// 		Pop:          70.0,
// 		Spin:         3000.0,
// 		TwistWeight:  200.0,
// 		SwingWeight:  220.0,
// 		BalancePoint: 30.0,
// 	},
// }

// getPaddleStats handles the API request for fetching paddle statistics
func getPaddleStats(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	paddleId := vars["id"]

	id, err := strconv.Atoi(paddleId)

	if err != nil {
		// Log the error
		log.Printf("Error converting ID to integer: %v", err)
		http.Error(w, "Invalid paddle ID format", http.StatusBadRequest)
		return
	}

	paddle, err := GetPaddleByID(id)

	if err != nil {
		log.Printf("Error converting ID to integer: %v", err)
		http.Error(w, "Failed to retrieve paddle data", http.StatusNotFound)
	}

	// Encode the statistics to JSON and handle any potential errors
	if err := json.NewEncoder(w).Encode(paddle); err != nil {
		// If there's an error, set the status code to 500 and write the error message
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

// uploadPaddleStats handles the API request for uploading paddle statistics
func uploadPaddleStats(w http.ResponseWriter, r *http.Request) {
	// Parse the JSON body
	var paddle Paddle
	if err := json.NewDecoder(r.Body).Decode(&paddle); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	paddleDBID, err := SavePaddle(&paddle)
	if err != nil {
		log.Printf("Error saving paddle: %v", err)
		http.Error(w, "Failed to save paddle data", http.StatusInternalServerError)
		return
	}

	// Create a response that includes both the database ID and the paddle data
	response := struct {
		ID       int    `json:"id"`        // Database ID (primary key)
		PaddleID string `json:"paddle_id"` // Business identifier
		*Paddle         // Embed the full paddle data
	}{
		ID:       paddleDBID,
		PaddleID: paddle.ID,
		Paddle:   &paddle,
	}

	// Set status code BEFORE writing any data
	w.WriteHeader(http.StatusCreated)

	// Encode the response
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding response: %v", err)
		// Don't call http.Error() here as we've already written the header
		return
	}
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
