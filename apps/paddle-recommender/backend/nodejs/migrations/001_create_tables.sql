-- Create paddles table
CREATE TABLE IF NOT EXISTS paddles (
    id SERIAL PRIMARY KEY,
    paddle_id VARCHAR(100) UNIQUE NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    price DECIMAL(10,2),
    image_url TEXT,
    buy_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create paddle_specs table
CREATE TABLE IF NOT EXISTS paddle_specs (
    id SERIAL PRIMARY KEY,
    paddle_id INTEGER REFERENCES paddles(id),
    shape VARCHAR(50) NOT NULL,
    surface VARCHAR(50) NOT NULL,
    average_weight DOUBLE PRECISION NOT NULL,
    core DOUBLE PRECISION NOT NULL,
    paddle_length DOUBLE PRECISION NOT NULL,
    paddle_width DOUBLE PRECISION NOT NULL,
    grip_length DOUBLE PRECISION NOT NULL,
    grip_type VARCHAR(50) NOT NULL,
    grip_circumference DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create paddle_performance table
CREATE TABLE IF NOT EXISTS paddle_performance (
    id SERIAL PRIMARY KEY,
    paddle_spec_id INTEGER REFERENCES paddle_specs(id),
    power DOUBLE PRECISION NOT NULL,
    pop DOUBLE PRECISION NOT NULL,
    spin DOUBLE PRECISION NOT NULL,
    twist_weight DOUBLE PRECISION NOT NULL,
    swing_weight DOUBLE PRECISION NOT NULL,
    balance_point DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_paddles_paddle_id ON paddles(paddle_id);
CREATE INDEX IF NOT EXISTS idx_paddle_specs_paddle_id ON paddle_specs(paddle_id);
CREATE INDEX IF NOT EXISTS idx_paddle_performance_paddle_spec_id ON paddle_performance(paddle_spec_id);
