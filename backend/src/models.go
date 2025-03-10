package main

import (
	"fmt"
	"math/rand"
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

// Paddle represents a paddle with its specs and performance
type Paddle struct {
	ID          string      `json:"id"`
	Metadata    Metadata    `json:"metadata"`
	Specs       Specs       `json:"specs"`
	Performance Performance `json:"performance"`
}

func (pi *Paddle) GeneratePaddleID() string {
	// Format: BRAND-MODEL-RANDOM
	paddleID := fmt.Sprintf("%s-%s-%06d",
		formatIDComponent(pi.Metadata.Brand),
		formatIDComponent(pi.Metadata.Model),
		rand.Intn(1000000))
	return paddleID
}

// formatIDComponent formats a string to be used in a paddle ID
// by converting to uppercase and replacing spaces with hyphens
func formatIDComponent(s string) string {
	s = strings.ToUpper(s)
	s = strings.ReplaceAll(s, " ", "-")
	return s
}
