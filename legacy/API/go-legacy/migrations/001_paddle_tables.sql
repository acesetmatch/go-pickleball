-- Create paddles table
CREATE TABLE IF NOT EXISTS paddles (
	id SERIAL PRIMARY KEY,
	paddle_id VARCHAR(100) UNIQUE NOT NULL,
	brand VARCHAR(100) NOT NULL,
	model VARCHAR(100) NOT NULL,
	image_url TEXT,
	buy_url TEXT,
	price DECIMAL(10,2),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create specs table
CREATE TABLE IF NOT EXISTS paddle_specs (
	id SERIAL PRIMARY KEY,
	paddle_id INTEGER REFERENCES paddles(id),
	shape VARCHAR(50) NOT NULL,
	surface VARCHAR(50) NOT NULL,
	average_weight FLOAT NOT NULL,
	core FLOAT NOT NULL,
	paddle_length FLOAT NOT NULL,
	paddle_width FLOAT NOT NULL,
	grip_length FLOAT NOT NULL,
	grip_type VARCHAR(50) NOT NULL,
	grip_circumference FLOAT NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create performance table
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
);
