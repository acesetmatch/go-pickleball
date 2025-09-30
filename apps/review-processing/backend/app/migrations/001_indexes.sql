CREATE INDEX IF NOT EXISTS idx_captions_video_time ON captions(video_id, start_ms);
CREATE INDEX IF NOT EXISTS idx_chunks_video_time ON chunks(video_id, start_ms);
