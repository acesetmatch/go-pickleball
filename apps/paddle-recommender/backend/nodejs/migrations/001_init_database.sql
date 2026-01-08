-- Initialize paddle recommendation database
-- This file runs automatically when the PostgreSQL container starts

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

-- Insert sample paddle data
INSERT INTO paddles (paddle_id, brand, model, price, image_url, buy_url) VALUES
('selkirk-amped-x5', 'Selkirk', 'AMPED X5 FiberFlex', 149.99, '/images/selkirk-amped-x5.jpg', 'https://selkirk.com/amped-x5'),
('paddletek-bantam-ex-l', 'Paddletek', 'Bantam EX-L', 179.99, '/images/paddletek-bantam-ex-l.jpg', 'https://paddletek.com/bantam-ex-l'),
('onix-z5-graphite', 'Onix', 'Z5 Graphite', 129.99, '/images/onix-z5-graphite.jpg', 'https://onixpickleball.com/z5-graphite'),
('head-radical-elite', 'HEAD', 'Radical Elite', 199.99, '/images/head-radical-elite.jpg', 'https://head.com/radical-elite'),
('wilson-energy-pro', 'Wilson', 'Energy Pro', 89.99, '/images/wilson-energy-pro.jpg', 'https://wilson.com/energy-pro');

-- Insert paddle specs
INSERT INTO paddle_specs (paddle_id, shape, surface, average_weight, core, paddle_length, paddle_width, grip_length, grip_type, grip_circumference) VALUES
(1, 'Standard', 'Composite', 8.2, 16, 15.75, 8.0, 5.25, 'Cushioned', 4.25),
(2, 'Elongated', 'Graphite', 7.8, 13, 16.5, 7.5, 5.0, 'Perforated', 4.125),
(3, 'Standard', 'Graphite', 8.0, 16, 15.75, 8.0, 5.25, 'Standard', 4.25),
(4, 'Standard', 'Carbon Fiber', 8.4, 16, 15.75, 8.0, 5.5, 'Cushioned', 4.375),
(5, 'Standard', 'Composite', 7.9, 16, 15.75, 8.0, 5.25, 'Standard', 4.25);

-- Insert paddle performance data
INSERT INTO paddle_performance (paddle_spec_id, power, pop, spin, twist_weight, swing_weight, balance_point) VALUES
(1, 85, 88, 2800, 6.2, 112, 7.8),
(2, 78, 82, 3200, 5.9, 108, 8.2),
(3, 80, 85, 3000, 6.0, 110, 8.0),
(4, 90, 92, 2600, 6.5, 115, 7.5),
(5, 75, 80, 2900, 5.8, 105, 8.3);
