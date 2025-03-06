package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	fmt.Println("pickleball project")

	http.HandleFunc("/api/player/stats", withCommonHeaders(getPaddleStats))
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

// getStatistics handles the API request for fetching paddle statistics
func getPaddleStats(w http.ResponseWriter, r *http.Request) {
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
