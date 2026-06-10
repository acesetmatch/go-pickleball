-- Insert sample paddle data for testing snippet generation
INSERT INTO paddles (paddle_id, brand, model, image_url, buy_url, price) VALUES
('ENGAGE-PURSUIT-MX-6.0-2023', 'Engage', 'Pursuit MX 6.0', 'https://example.com/engage.jpg', 'https://example.com/buy', 199.99),
('SELKIRK-AMPED-S2-2023', 'Selkirk', 'AMPED S2', 'https://example.com/selkirk.jpg', 'https://example.com/buy', 149.99),
('JOOLA-BEN-JOHNS-HYPERION-2023', 'JOOLA', 'Ben Johns Hyperion', 'https://example.com/joola.jpg', 'https://example.com/buy', 249.99);

-- Insert specs for the paddles
INSERT INTO paddle_specs (paddle_id, shape, surface, average_weight, core, paddle_length, paddle_width, grip_length, grip_type, grip_circumference) VALUES
(1, 'Standard', 'Textured', 8.2, 16, 15.75, 8.0, 5.25, 'Cushioned', 4.25),
(2, 'Elongated', 'Smooth', 7.8, 13, 16.5, 7.375, 5.0, 'Standard', 4.0),
(3, 'Standard', 'Textured', 8.0, 14, 15.75, 8.125, 5.5, 'Perforated', 4.125);

-- Insert performance data for the paddles
INSERT INTO paddle_performance (paddle_spec_id, power, pop, spin, twist_weight, swing_weight, balance_point) VALUES
(1, 0.85, 0.78, 0.82, 6.2, 112.5, 7.25),
(2, 0.72, 0.88, 0.65, 5.8, 108.3, 6.75),
(3, 0.90, 0.85, 0.88, 6.8, 118.2, 7.5);
