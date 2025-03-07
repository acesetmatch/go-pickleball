package main

import (
	"encoding/json"
	"net/http"
)

// getPaddleStats handles the API request for fetching paddle statistics
func getPaddleStats(w http.ResponseWriter, r *http.Request) {
	// Only allow GET requests
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	stats := Paddle{
		Specs: Specs{
			Name:              "Ben Johns",
			Surface:           "Composite",
			AverageWeight:     220.0,
			Core:              15.0,
			PaddleLength:      16.5,
			PaddleWidth:       7.5,
			GripLength:        4.5,
			GripType:          "Comfort",
			GripCircumference: 4.0,
		},
		Performance: Performance{
			Power:        75.0,
			Pop:          70.0,
			Spin:         3000.0,
			TwistWeight:  200.0,
			SwingWeight:  220.0,
			BalancePoint: 30.0,
		},
	}

	// Encode the statistics to JSON and handle any potential errors
	if err := json.NewEncoder(w).Encode(stats); err != nil {
		// If there's an error, set the status code to 500 and write the error message
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

// uploadPaddleStats handles the API request for uploading paddle statistics
func uploadPaddleStats(w http.ResponseWriter, r *http.Request) {
	// Only allow POST requests
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse the JSON body
	var paddle Paddle
	if err := json.NewDecoder(r.Body).Decode(&paddle); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Here you would typically save the paddle data to a database
	// For now, we'll just return the received data as confirmation
	if err := json.NewEncoder(w).Encode(paddle); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Set success status code
	w.WriteHeader(http.StatusCreated)
}
