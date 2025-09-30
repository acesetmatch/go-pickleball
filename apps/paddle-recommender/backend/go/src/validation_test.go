package main

import (
	"strings"
	"testing"
)

// TestValidatePaddleInput tests the validatePaddleInput function
func TestValidatePaddleInput(t *testing.T) {
	// Valid input
	validInput := &PaddleInput{
		Metadata: Metadata{
			Brand: "Engage",
			Model: "Pursuit MX 6.0",
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

	// Test valid input
	if err := validatePaddleInput(validInput); err != nil {
		t.Errorf("validatePaddleInput failed with valid input: %v", err)
	}

	// Test with invalid metadata
	invalidMetadataInput := *validInput
	invalidMetadataInput.Metadata.Brand = ""
	if err := validatePaddleInput(&invalidMetadataInput); err == nil {
		t.Error("validatePaddleInput should fail with empty brand")
	} else if !strings.Contains(err.Error(), "brand is required") {
		t.Errorf("Expected error about brand, got: %v", err)
	}

	// Test with invalid specs
	invalidSpecsInput := *validInput
	invalidSpecsInput.Specs.Shape = "InvalidShape"
	if err := validatePaddleInput(&invalidSpecsInput); err == nil {
		t.Error("validatePaddleInput should fail with invalid shape")
	} else if !strings.Contains(err.Error(), "invalid shape") {
		t.Errorf("Expected error about shape, got: %v", err)
	}

	// Test with invalid performance
	invalidPerfInput := *validInput
	invalidPerfInput.Performance.Power = 101
	if err := validatePaddleInput(&invalidPerfInput); err == nil {
		t.Error("validatePaddleInput should fail with power > 100")
	} else if !strings.Contains(err.Error(), "power must be between") {
		t.Errorf("Expected error about power, got: %v", err)
	}
}

// TestValidateMetadata tests the validateMetadata function
func TestValidateMetadata(t *testing.T) {
	tests := []struct {
		name     string
		metadata Metadata
		wantErr  bool
		errMsg   string
	}{
		{
			name: "Valid metadata",
			metadata: Metadata{
				Brand: "Engage",
				Model: "Pursuit MX 6.0",
			},
			wantErr: false,
		},
		{
			name: "Empty brand",
			metadata: Metadata{
				Brand: "",
				Model: "Pursuit MX 6.0",
			},
			wantErr: true,
			errMsg:  "brand is required",
		},
		{
			name: "Whitespace brand",
			metadata: Metadata{
				Brand: "   ",
				Model: "Pursuit MX 6.0",
			},
			wantErr: true,
			errMsg:  "brand is required",
		},
		{
			name: "Empty model",
			metadata: Metadata{
				Brand: "Engage",
				Model: "",
			},
			wantErr: true,
			errMsg:  "model is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateMetadata(&tt.metadata)
			if (err != nil) != tt.wantErr {
				t.Errorf("validateMetadata() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if tt.wantErr && !strings.Contains(err.Error(), tt.errMsg) {
				t.Errorf("validateMetadata() error = %v, expected to contain %v", err, tt.errMsg)
			}
		})
	}
}

// TestValidateSpecs tests the validateSpecs function
func TestValidateSpecs(t *testing.T) {
	validSpecs := Specs{
		Shape:             Hybrid,
		Surface:           "Composite",
		AverageWeight:     220.0,
		Core:              15.0,
		PaddleLength:      16.5,
		PaddleWidth:       7.5,
		GripLength:        4.5,
		GripType:          "Comfort",
		GripCircumference: 4.0,
	}

	tests := []struct {
		name     string
		specs    Specs
		wantErr  bool
		errMsg   string
		modifier func(*Specs)
	}{
		{
			name:    "Valid specs",
			specs:   validSpecs,
			wantErr: false,
		},
		{
			name:    "Invalid shape",
			specs:   validSpecs,
			wantErr: true,
			errMsg:  "invalid shape",
			modifier: func(s *Specs) {
				s.Shape = "InvalidShape"
			},
		},
		{
			name:    "Empty surface",
			specs:   validSpecs,
			wantErr: true,
			errMsg:  "surface is required",
			modifier: func(s *Specs) {
				s.Surface = ""
			},
		},
		{
			name:    "Zero average weight",
			specs:   validSpecs,
			wantErr: true,
			errMsg:  "average weight must be greater than 0",
			modifier: func(s *Specs) {
				s.AverageWeight = 0
			},
		},
		{
			name:    "Negative core",
			specs:   validSpecs,
			wantErr: true,
			errMsg:  "core must be greater than 0",
			modifier: func(s *Specs) {
				s.Core = -1
			},
		},
		{
			name:    "Zero paddle length",
			specs:   validSpecs,
			wantErr: true,
			errMsg:  "paddle length must be greater than 0",
			modifier: func(s *Specs) {
				s.PaddleLength = 0
			},
		},
		{
			name:    "Zero paddle width",
			specs:   validSpecs,
			wantErr: true,
			errMsg:  "paddle width must be greater than 0",
			modifier: func(s *Specs) {
				s.PaddleWidth = 0
			},
		},
		{
			name:    "Zero grip length",
			specs:   validSpecs,
			wantErr: true,
			errMsg:  "grip length must be greater than 0",
			modifier: func(s *Specs) {
				s.GripLength = 0
			},
		},
		{
			name:    "Empty grip type",
			specs:   validSpecs,
			wantErr: true,
			errMsg:  "grip type is required",
			modifier: func(s *Specs) {
				s.GripType = ""
			},
		},
		{
			name:    "Zero grip circumference",
			specs:   validSpecs,
			wantErr: true,
			errMsg:  "grip circumference must be greater than 0",
			modifier: func(s *Specs) {
				s.GripCircumference = 0
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			specs := tt.specs
			if tt.modifier != nil {
				tt.modifier(&specs)
			}

			err := validateSpecs(&specs)
			if (err != nil) != tt.wantErr {
				t.Errorf("validateSpecs() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if tt.wantErr && !strings.Contains(err.Error(), tt.errMsg) {
				t.Errorf("validateSpecs() error = %v, expected to contain %v", err, tt.errMsg)
			}
		})
	}
}

// TestValidatePerformance tests the validatePerformance function
func TestValidatePerformance(t *testing.T) {
	validPerformance := Performance{
		Power:        75.0,
		Pop:          70.0,
		Spin:         3000.0,
		TwistWeight:  200.0,
		SwingWeight:  220.0,
		BalancePoint: 30.0,
	}

	tests := []struct {
		name        string
		performance Performance
		wantErr     bool
		errMsg      string
		modifier    func(*Performance)
	}{
		{
			name:        "Valid performance",
			performance: validPerformance,
			wantErr:     false,
		},
		{
			name:        "Negative power",
			performance: validPerformance,
			wantErr:     true,
			errMsg:      "power must be between 0 and 100",
			modifier: func(p *Performance) {
				p.Power = -1
			},
		},
		{
			name:        "Power > 100",
			performance: validPerformance,
			wantErr:     true,
			errMsg:      "power must be between 0 and 100",
			modifier: func(p *Performance) {
				p.Power = 101
			},
		},
		{
			name:        "Negative pop",
			performance: validPerformance,
			wantErr:     true,
			errMsg:      "pop must be between 0 and 100",
			modifier: func(p *Performance) {
				p.Pop = -1
			},
		},
		{
			name:        "Pop > 100",
			performance: validPerformance,
			wantErr:     true,
			errMsg:      "pop must be between 0 and 100",
			modifier: func(p *Performance) {
				p.Pop = 101
			},
		},
		{
			name:        "Negative spin",
			performance: validPerformance,
			wantErr:     true,
			errMsg:      "spin must be non-negative",
			modifier: func(p *Performance) {
				p.Spin = -1
			},
		},
		{
			name:        "Zero twist weight",
			performance: validPerformance,
			wantErr:     true,
			errMsg:      "twist weight must be greater than 0",
			modifier: func(p *Performance) {
				p.TwistWeight = 0
			},
		},
		{
			name:        "Zero swing weight",
			performance: validPerformance,
			wantErr:     true,
			errMsg:      "swing weight must be greater than 0",
			modifier: func(p *Performance) {
				p.SwingWeight = 0
			},
		},
		{
			name:        "Zero balance point",
			performance: validPerformance,
			wantErr:     true,
			errMsg:      "balance point must be greater than 0",
			modifier: func(p *Performance) {
				p.BalancePoint = 0
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			performance := tt.performance
			if tt.modifier != nil {
				tt.modifier(&performance)
			}

			err := validatePerformance(&performance)
			if (err != nil) != tt.wantErr {
				t.Errorf("validatePerformance() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if tt.wantErr && !strings.Contains(err.Error(), tt.errMsg) {
				t.Errorf("validatePerformance() error = %v, expected to contain %v", err, tt.errMsg)
			}
		})
	}
}

// TestValidatePaddleID tests the validatePaddleID function
func TestValidatePaddleID(t *testing.T) {
	tests := []struct {
		name    string
		id      string
		wantErr bool
		errMsg  string
	}{
		{
			name:    "Valid ID",
			id:      "ENGAGE-PURSUIT-MX-6.0-2023-42069",
			wantErr: false,
		},
		{
			name:    "Empty ID",
			id:      "",
			wantErr: true,
			errMsg:  "paddle ID is required",
		},
		{
			name:    "Whitespace ID",
			id:      "   ",
			wantErr: true,
			errMsg:  "paddle ID is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validatePaddleID(tt.id)
			if (err != nil) != tt.wantErr {
				t.Errorf("validatePaddleID() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if tt.wantErr && !strings.Contains(err.Error(), tt.errMsg) {
				t.Errorf("validatePaddleID() error = %v, expected to contain %v", err, tt.errMsg)
			}
		})
	}
}

func stringPtr(s string) *string {
	return &s
}
