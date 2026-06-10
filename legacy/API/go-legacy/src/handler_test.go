package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gorilla/mux"
)

// setupTestRouter creates a router with the necessary routes for testing
func setupTestRouter() *mux.Router {
	router := mux.NewRouter()
	router.HandleFunc("/api/paddle", uploadPaddleStats).Methods("POST")
	router.HandleFunc("/api/paddle/{id}", getPaddleStats).Methods("GET")
	return router
}

// TestUploadPaddleStats tests the uploadPaddleStats handler
func TestUploadPaddleStats(t *testing.T) {
	// Initialize the database for testing
	if err := InitDB(); err != nil {
		t.Fatalf("Failed to initialize database: %v", err)
	}
	defer CloseDB()

	// Create a router with the handler
	router := setupTestRouter()

	// Add a timestamp to make the model unique for each test run
	uniqueModelSuffix := fmt.Sprintf("Test-%d", time.Now().UnixNano())

	// Test cases
	tests := []struct {
		name           string
		requestBody    map[string]interface{}
		expectedStatus int
		expectedBody   string
	}{
		{
			name: "Valid paddle data",
			requestBody: map[string]interface{}{
				"metadata": map[string]interface{}{
					"brand": "Engage",
					"model": "Pursuit MX 6.0 " + uniqueModelSuffix,
				},
				"specs": map[string]interface{}{
					"shape":              "Hybrid",
					"surface":            "Composite",
					"average_weight":     220.0,
					"core":               15.0,
					"paddle_length":      16.5,
					"paddle_width":       7.5,
					"grip_length":        4.5,
					"grip_type":          "Comfort",
					"grip_circumference": 4.0,
				},
				"performance": map[string]interface{}{
					"power":         75.0,
					"pop":           70.0,
					"spin":          3000.0,
					"twist_weight":  200.0,
					"swing_weight":  220.0,
					"balance_point": 30.0,
				},
			},
			expectedStatus: http.StatusCreated,
			// We don't check the exact response body since it contains dynamic IDs
		},
		{
			name: "Missing brand",
			requestBody: map[string]interface{}{
				"metadata": map[string]interface{}{
					"model": "Pursuit MX 6.0 " + uniqueModelSuffix,
				},
				"specs": map[string]interface{}{
					"shape":              "Hybrid",
					"surface":            "Composite",
					"average_weight":     220.0,
					"core":               15.0,
					"paddle_length":      16.5,
					"paddle_width":       7.5,
					"grip_length":        4.5,
					"grip_type":          "Comfort",
					"grip_circumference": 4.0,
				},
				"performance": map[string]interface{}{
					"power":         75.0,
					"pop":           70.0,
					"spin":          3000.0,
					"twist_weight":  200.0,
					"swing_weight":  220.0,
					"balance_point": 30.0,
				},
			},
			expectedStatus: http.StatusBadRequest,
			expectedBody:   "brand is required",
		},
		{
			name: "Invalid shape",
			requestBody: map[string]interface{}{
				"metadata": map[string]interface{}{
					"brand": "Engage",
					"model": "Pursuit MX 6.0 " + uniqueModelSuffix,
				},
				"specs": map[string]interface{}{
					"shape":              "InvalidShape",
					"surface":            "Composite",
					"average_weight":     220.0,
					"core":               15.0,
					"paddle_length":      16.5,
					"paddle_width":       7.5,
					"grip_length":        4.5,
					"grip_type":          "Comfort",
					"grip_circumference": 4.0,
				},
				"performance": map[string]interface{}{
					"power":         75.0,
					"pop":           70.0,
					"spin":          3000.0,
					"twist_weight":  200.0,
					"swing_weight":  220.0,
					"balance_point": 30.0,
				},
			},
			expectedStatus: http.StatusBadRequest,
			expectedBody:   "invalid shape",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Convert request body to JSON
			jsonBody, err := json.Marshal(tt.requestBody)
			if err != nil {
				t.Fatalf("Failed to marshal request body: %v", err)
			}

			// Create a request
			req, err := http.NewRequest("POST", "/api/paddle", bytes.NewBuffer(jsonBody))
			if err != nil {
				t.Fatalf("Failed to create request: %v", err)
			}
			req.Header.Set("Content-Type", "application/json")

			// Create a response recorder
			rr := httptest.NewRecorder()

			// Serve the request
			router.ServeHTTP(rr, req)

			// Check status code
			if status := rr.Code; status != tt.expectedStatus {
				t.Errorf("Handler returned wrong status code: got %v want %v", status, tt.expectedStatus)
			}

			// Check response body if expected
			if tt.expectedBody != "" && !bytes.Contains(rr.Body.Bytes(), []byte(tt.expectedBody)) {
				t.Errorf("Handler returned unexpected body: got %v, expected to contain %v", rr.Body.String(), tt.expectedBody)
			}
		})
	}
}

// TestGetPaddleStats tests the getPaddleStats handler
func TestGetPaddleStats(t *testing.T) {
	// Initialize the database for testing
	if err := InitDB(); err != nil {
		t.Fatalf("Failed to initialize database: %v", err)
	}
	defer CloseDB()

	// Create a router with the handler
	router := setupTestRouter()

	// Add a timestamp to make the model unique for each test run
	uniqueModelSuffix := fmt.Sprintf("Test-%d", time.Now().UnixNano())

	// First, create a paddle to retrieve
	paddleInput := &PaddleInput{
		Metadata: Metadata{
			Brand: "Engage",
			Model: "Pursuit MX 6.0 " + uniqueModelSuffix,
		},
		Specs: Specs{
			Shape:             Hybrid,
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

	paddle := paddleInput.ToPaddle()
	_, err := SavePaddle(paddle)
	if err != nil {
		t.Fatalf("Failed to save test paddle: %v", err)
	}

	// Test cases
	tests := []struct {
		name           string
		paddleID       string
		expectedStatus int
		expectedBody   string
	}{
		{
			name:           "Valid paddle ID",
			paddleID:       paddle.ID,
			expectedStatus: http.StatusOK,
			// We don't check the exact response body
		},
		{
			name:           "Non-existent paddle ID",
			paddleID:       "NONEXISTENT-ID",
			expectedStatus: http.StatusNotFound,
			expectedBody:   "Failed to retrieve paddle data",
		},
		{
			name:           "Empty paddle ID",
			paddleID:       "",
			expectedStatus: http.StatusBadRequest,
			expectedBody:   "paddle ID is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a request
			req, err := http.NewRequest("GET", "/api/paddle/"+tt.paddleID, nil)
			if err != nil {
				t.Fatalf("Failed to create request: %v", err)
			}

			// Create a response recorder
			rr := httptest.NewRecorder()

			// Need to set up the router with URL parameters
			router.ServeHTTP(rr, req)

			// Check status code
			if status := rr.Code; status != tt.expectedStatus {
				t.Errorf("Handler returned wrong status code: got %v want %v", status, tt.expectedStatus)
			}

			// Check response body if expected
			if tt.expectedBody != "" && !bytes.Contains(rr.Body.Bytes(), []byte(tt.expectedBody)) {
				t.Errorf("Handler returned unexpected body: got %v, expected to contain %v", rr.Body.String(), tt.expectedBody)
			}
		})
	}
}
