package main

// Specs represents the specifications of a paddle
type Specs struct {
	Name              string  `json:"name"`
	Surface           string  `json:"surface"`
	AverageWeight     float64 `json:"average_weight"`
	Core              float64 `json:"core"`
	PaddleLength      float64 `json:"paddle_length"`
	PaddleWidth       float64 `json:"paddle_width"`
	GripLength        float64 `json:"grip_length"`
	GripType          string  `json:"grip_type"`
	GripCircumference float64 `json:"grip_circumference"`
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
	Specs       Specs       `json:"specs"`
	Performance Performance `json:"performance"`
}
