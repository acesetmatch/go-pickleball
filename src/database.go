package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

// DB is the global database connection
var DB *sql.DB

// InitDB initializes the database connection
func InitDB() error {
	// Get database connection details from environment variables
	// or use defaults for development
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "postgres")
	dbname := getEnv("DB_NAME", "pickleball")

	// Connection string
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	// Open a connection to the database
	var err error
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		return fmt.Errorf("failed to open database connection: %w", err)
	}

	// Check the connection
	err = DB.Ping()
	if err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	// Create tables if they don't exist
	err = createTables()
	if err != nil {
		return fmt.Errorf("failed to create tables: %w", err)
	}

	log.Println("Database connection established successfully")
	return nil
}

// createTables creates the necessary tables if they don't exist
func createTables() error {
	// Create specs table
	_, err := DB.Exec(`
		CREATE TABLE IF NOT EXISTS paddle_specs (
			id SERIAL PRIMARY KEY,
			name VARCHAR(100) NOT NULL,
			surface VARCHAR(50) NOT NULL,
			average_weight FLOAT NOT NULL,
			core FLOAT NOT NULL,
			paddle_length FLOAT NOT NULL,
			paddle_width FLOAT NOT NULL,
			grip_length FLOAT NOT NULL,
			grip_type VARCHAR(50) NOT NULL,
			grip_circumference FLOAT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return err
	}

	// Create performance table
	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS paddle_performance (
			id SERIAL PRIMARY KEY,
			paddle_spec_id INTEGER REFERENCES paddle_specs(id),
			power FLOAT NOT NULL,
			pop FLOAT NOT NULL,
			spin FLOAT NOT NULL,
			twist_weight FLOAT NOT NULL,
			swing_weight FLOAT NOT NULL,
			balance_point FLOAT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return err
	}

	return nil
}

// GetPaddleByID retrieves a paddle with its specs and performance by ID
func GetPaddleByID(id int) (*Paddle, error) {
	paddle := &Paddle{}

	// Query for paddle specs and performance in a single query using JOIN
	row := DB.QueryRow(`
		SELECT 
			s.name, s.surface, s.average_weight, s.core, s.paddle_length, 
			s.paddle_width, s.grip_length, s.grip_type, s.grip_circumference,
			p.power, p.pop, p.spin, p.twist_weight, p.swing_weight, p.balance_point
		FROM 
			paddle_specs s
		JOIN 
			paddle_performance p ON s.id = p.paddle_spec_id
		WHERE 
			s.id = $1
	`, id)

	err := row.Scan(
		&paddle.Specs.Name, &paddle.Specs.Surface, &paddle.Specs.AverageWeight,
		&paddle.Specs.Core, &paddle.Specs.PaddleLength, &paddle.Specs.PaddleWidth,
		&paddle.Specs.GripLength, &paddle.Specs.GripType, &paddle.Specs.GripCircumference,
		&paddle.Performance.Power, &paddle.Performance.Pop, &paddle.Performance.Spin,
		&paddle.Performance.TwistWeight, &paddle.Performance.SwingWeight, &paddle.Performance.BalancePoint,
	)

	if err != nil {
		return nil, err
	}

	return paddle, nil
}

// SavePaddle saves a paddle's specs and performance to the database
func SavePaddle(paddle *Paddle) (int, error) {
	// Begin a transaction
	tx, err := DB.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	var specID int
	// Insert paddle specs
	err = tx.QueryRow(`
		INSERT INTO paddle_specs (
			name, surface, average_weight, core, paddle_length, 
			paddle_width, grip_length, grip_type, grip_circumference
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`,
		paddle.Specs.Name, paddle.Specs.Surface, paddle.Specs.AverageWeight,
		paddle.Specs.Core, paddle.Specs.PaddleLength, paddle.Specs.PaddleWidth,
		paddle.Specs.GripLength, paddle.Specs.GripType, paddle.Specs.GripCircumference,
	).Scan(&specID)

	if err != nil {
		return 0, err
	}

	// Insert paddle performance
	_, err = tx.Exec(`
		INSERT INTO paddle_performance (
			paddle_spec_id, power, pop, spin, twist_weight, swing_weight, balance_point
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
	`,
		specID, paddle.Performance.Power, paddle.Performance.Pop, paddle.Performance.Spin,
		paddle.Performance.TwistWeight, paddle.Performance.SwingWeight, paddle.Performance.BalancePoint,
	)

	if err != nil {
		return 0, err
	}

	// Commit the transaction
	if err = tx.Commit(); err != nil {
		return 0, err
	}

	return specID, nil
}

// GetAllPaddles retrieves all paddles with their specs and performance
func GetAllPaddles() ([]*Paddle, error) {
	rows, err := DB.Query(`
		SELECT 
			s.id, s.name, s.surface, s.average_weight, s.core, s.paddle_length, 
			s.paddle_width, s.grip_length, s.grip_type, s.grip_circumference,
			p.power, p.pop, p.spin, p.twist_weight, p.swing_weight, p.balance_point
		FROM 
			paddle_specs s
		JOIN 
			paddle_performance p ON s.id = p.paddle_spec_id
		ORDER BY 
			s.id
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var paddles []*Paddle
	for rows.Next() {
		paddle := &Paddle{}
		var id int
		err := rows.Scan(
			&id, &paddle.Specs.Name, &paddle.Specs.Surface, &paddle.Specs.AverageWeight,
			&paddle.Specs.Core, &paddle.Specs.PaddleLength, &paddle.Specs.PaddleWidth,
			&paddle.Specs.GripLength, &paddle.Specs.GripType, &paddle.Specs.GripCircumference,
			&paddle.Performance.Power, &paddle.Performance.Pop, &paddle.Performance.Spin,
			&paddle.Performance.TwistWeight, &paddle.Performance.SwingWeight, &paddle.Performance.BalancePoint,
		)
		if err != nil {
			return nil, err
		}
		paddles = append(paddles, paddle)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return paddles, nil
}

// Helper function to get env vars with defaults
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// CloseDB closes the database connection
func CloseDB() {
	if DB != nil {
		DB.Close()
	}
}
