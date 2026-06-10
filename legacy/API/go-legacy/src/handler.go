package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

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

// errorResponse represents a standardized error response
type errorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Code    int    `json:"code"`
}

// respondWithError sends a standardized error response
func respondWithError(w http.ResponseWriter, message string, code int) {
	response := errorResponse{
		Error:   http.StatusText(code),
		Message: message,
		Code:    code,
	}

	w.WriteHeader(code)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		// If encoding fails, fall back to a simple error
		log.Printf("Error encoding error response: %v", err)
		http.Error(w, message, code)
	}
}

// getPaddleStats handles the API request for fetching paddle statistics
func getPaddleStats(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	paddleId := vars["id"]

	if err := validatePaddleID(paddleId); err != nil {
		respondWithError(w, fmt.Sprintf("Invalid paddle ID: %v", err), http.StatusBadRequest)
		return
	}

	paddle, err := GetPaddleByID(paddleId)

	if err != nil {
		log.Printf("Error converting ID to integer: %v", err)
		http.Error(w, "Failed to retrieve paddle data", http.StatusNotFound)
	}

	// Encode the stats to JSON and handle any potential errors
	if err := json.NewEncoder(w).Encode(paddle); err != nil {
		// If there's an error, set the status code to 500 and write the error message
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func uploadPaddleStats(w http.ResponseWriter, r *http.Request) {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	// Parse the JSON body into PaddleInput
	var paddleInput PaddleInput
	if err := decoder.Decode(&paddleInput); err != nil {
		// This will catch any extra fields in the JSON
		respondWithError(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	// Validate the paddle input
	if err := validatePaddleInput(&paddleInput); err != nil {
		respondWithError(w, fmt.Sprintf("Validation error: %v", err), http.StatusBadRequest)
		return
	}

	// Convert PaddleInput to Paddle (this generates the ID)
	paddle := paddleInput.ToPaddle()

	log.Printf("paddle: %v", *paddle)

	// Save the paddle to the database
	paddleDBID, err := SavePaddle(paddle)
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
		Paddle:   paddle,
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

// getPaddlesList handles the API request for fetching basic paddle information for cards
func getPaddlesList(w http.ResponseWriter, r *http.Request) {
	paddles, err := GetAllPaddles()
	if err != nil {
		log.Printf("Error retrieving paddles: %v", err)
		respondWithError(w, "Failed to retrieve paddles data", http.StatusInternalServerError)
		return
	}

	// Create a simplified response with only the necessary fields for cards
	type SimplePaddle struct {
		ID       string `json:"id"`
		Metadata struct {
			Brand string `json:"brand"`
			Model string `json:"model"`
		} `json:"metadata"`
		Specs Specs `json:"specs"`
	}

	simplePaddles := make([]SimplePaddle, 0, len(paddles))
	for _, paddle := range paddles {
		simplePaddle := SimplePaddle{
			ID: paddle.ID,
			Metadata: struct {
				Brand string `json:"brand"`
				Model string `json:"model"`
			}{
				Brand: paddle.Metadata.Brand,
				Model: paddle.Metadata.Model,
			},
			Specs: paddle.Specs,
		}
		simplePaddles = append(simplePaddles, simplePaddle)
	}

	if err := json.NewEncoder(w).Encode(simplePaddles); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

// getPaddleDetails handles the API request for fetching complete paddle details
func getPaddleDetails(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	paddleId := vars["id"]

	// Validate the paddle ID
	if err := validatePaddleID(paddleId); err != nil {
		respondWithError(w, fmt.Sprintf("Invalid paddle ID: %v", err), http.StatusBadRequest)
		return
	}

	paddle, err := GetPaddleByID(paddleId)
	if err != nil {
		log.Printf("Error retrieving paddle: %v", err)
		respondWithError(w, "Paddle not found", http.StatusNotFound)
		return
	}

	// Return the complete paddle data (including specs and performance)
	if err := json.NewEncoder(w).Encode(paddle); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
