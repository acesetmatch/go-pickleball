package main

import (
	"errors"
	"fmt"
	"strings"
)

// validatePaddleInput validates the PaddleInput struct
func validatePaddleInput(input *PaddleInput) error {
	// Validate Metadata
	if err := validateMetadata(&input.Metadata); err != nil {
		return fmt.Errorf("invalid metadata: %w", err)
	}

	// Validate Specs
	if err := validateSpecs(&input.Specs); err != nil {
		return fmt.Errorf("invalid specs: %w", err)
	}

	// Validate Performance
	if err := validatePerformance(&input.Performance); err != nil {
		return fmt.Errorf("invalid performance: %w", err)
	}

	return nil
}

// validateMetadata validates the Metadata struct
func validateMetadata(metadata *Metadata) error {
	if strings.TrimSpace(metadata.Brand) == "" {
		return errors.New("brand is required")
	}

	if strings.TrimSpace(metadata.Model) == "" {
		return errors.New("model is required")
	}

	// SerialCode is optional, so no validation needed
	return nil
}

// validateSpecs validates the Specs struct
func validateSpecs(specs *Specs) error {
	// Validate Shape
	validShapes := map[PaddleShape]bool{
		Elongated: true,
		Hybrid:    true,
		WideBody:  true,
	}

	if !validShapes[specs.Shape] {
		return fmt.Errorf("invalid shape: must be one of %v", []PaddleShape{Elongated, Hybrid, WideBody})
	}

	// Validate Surface
	if strings.TrimSpace(specs.Surface) == "" {
		return errors.New("surface is required")
	}

	// Validate numeric fields
	if specs.AverageWeight <= 0 {
		return errors.New("average weight must be greater than 0")
	}

	if specs.Core <= 0 {
		return errors.New("core must be greater than 0")
	}

	if specs.PaddleLength <= 0 {
		return errors.New("paddle length must be greater than 0")
	}

	if specs.PaddleWidth <= 0 {
		return errors.New("paddle width must be greater than 0")
	}

	if specs.GripLength <= 0 {
		return errors.New("grip length must be greater than 0")
	}

	if strings.TrimSpace(specs.GripType) == "" {
		return errors.New("grip type is required")
	}

	if specs.GripCircumference <= 0 {
		return errors.New("grip circumference must be greater than 0")
	}

	return nil
}

// validatePerformance validates the Performance struct
func validatePerformance(performance *Performance) error {
	// Validate Power (assuming it's on a scale of 0-100)
	if performance.Power < 0 || performance.Power > 100 {
		return errors.New("power must be between 0 and 100")
	}

	// Validate Pop (assuming it's on a scale of 0-100)
	if performance.Pop < 0 || performance.Pop > 100 {
		return errors.New("pop must be between 0 and 100")
	}

	// Validate Spin (assuming it's RPM and must be positive)
	if performance.Spin < 0 {
		return errors.New("spin must be non-negative")
	}

	// Validate weights (must be positive)
	if performance.TwistWeight <= 0 {
		return errors.New("twist weight must be greater than 0")
	}

	if performance.SwingWeight <= 0 {
		return errors.New("swing weight must be greater than 0")
	}

	// Validate balance point (must be positive)
	if performance.BalancePoint <= 0 {
		return errors.New("balance point must be greater than 0")
	}

	return nil
}

// validatePaddleID validates a paddle ID
func validatePaddleID(id string) error {
	if strings.TrimSpace(id) == "" {
		return errors.New("paddle ID is required")
	}
	return nil
}
