package main

import (
	"fmt"
	"strings"
)

// PaddleIdentifier represents the identifying information of a paddle
type Metadata struct {
	Brand      string  `json:"brand"`
	Model      string  `json:"model"`
	SerialCode *string `json:"serial_code,omitempty"`
}

// PaddleShape represents the shape of a paddle
type PaddleShape string

const (
	Elongated PaddleShape = "Elongated"
	Hybrid    PaddleShape = "Hybrid"
	WideBody  PaddleShape = "Wide-body"
)

// Specs represents the specifications of a paddle
type Specs struct {
	Shape             PaddleShape `json:"shape"`
	Surface           string      `json:"surface"`
	AverageWeight     float64     `json:"average_weight"`
	Core              float64     `json:"core"`
	PaddleLength      float64     `json:"paddle_length"`
	PaddleWidth       float64     `json:"paddle_width"`
	GripLength        float64     `json:"grip_length"`
	GripType          string      `json:"grip_type"`
	GripCircumference float64     `json:"grip_circumference"`
}

// Performance represents the performance metrics of a paddle
type Performance struct {
	Power        float64 `json:"power"`
	Pop          float64 `json:"pop"`
	Spin         float64 `json:"spin"`
	TwistWeight  float64 `json:"twist_weight"`
	SwingWeight  float64 `json:"swing_weight"`
	BalancePoint float64 `json:"balance_point"`
}

// PaddleInput represents the input data for creating a paddle
type PaddleInput struct {
	Metadata    Metadata    `json:"metadata"`
	Specs       Specs       `json:"specs"`
	Performance Performance `json:"performance"`
}

// Paddle represents a paddle with its specs and performance
type Paddle struct {
	ID          string      `json:"id"`
	Metadata    Metadata    `json:"metadata"`
	Specs       Specs       `json:"specs"`
	Performance Performance `json:"performance"`
}

// ToPaddle converts a PaddleInput to a Paddle by generating an ID
func (input *PaddleInput) ToPaddle() *Paddle {
	paddle := &Paddle{
		Metadata:    input.Metadata,
		Specs:       input.Specs,
		Performance: input.Performance,
	}

	// Generate ID based on metadata
	paddle.ID = generatePaddleID(paddle.Metadata.Brand, paddle.Metadata.Model)
	return paddle
}

// generatePaddleID creates a paddle ID from brand and model
func generatePaddleID(brand, model string) string {
	// Format: BRAND-MODEL
	paddleID := fmt.Sprintf("%s-%s",
		formatIDComponent(brand),
		formatIDComponent(model),
	)
	return paddleID
}

// formatIDComponent formats a string to be used in a paddle ID
// by converting to uppercase and replacing spaces with hyphens
func formatIDComponent(s string) string {
	s = strings.ToLower(s)
	s = strings.ReplaceAll(s, " ", "-")
	return s
}
