CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  video_id TEXT UNIQUE NOT NULL,
  title TEXT,
  channel TEXT,
  url TEXT NOT NULL,
  duration_seconds INT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS captions (
  id BIGSERIAL PRIMARY KEY,
  video_id TEXT NOT NULL REFERENCES videos(video_id) ON DELETE CASCADE,
  start_ms INT NOT NULL,
  end_ms INT NOT NULL,
  text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chunks (
  id BIGSERIAL PRIMARY KEY,
  video_id TEXT NOT NULL REFERENCES videos(video_id) ON DELETE CASCADE,
  start_ms INT NOT NULL,
  end_ms INT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(384)
);
