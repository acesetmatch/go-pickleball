CREATE TABLE IF NOT EXISTS rag_snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paddle_id TEXT NOT NULL,
  source TEXT NOT NULL,   -- 'db:performance','lab:spinrig','review:creatorA'
  kind   TEXT NOT NULL,   -- 'metric','claim','warning','qa','spec'
  text   TEXT NOT NULL,   -- concise statement
  extra  JSONB,
  embedding VECTOR(384),  -- MiniLM dims
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rag_snippets_paddle_idx    ON rag_snippets (paddle_id);
CREATE INDEX IF NOT EXISTS rag_snippets_kind_idx      ON rag_snippets (kind);
CREATE INDEX IF NOT EXISTS rag_snippets_source_idx    ON rag_snippets (source);
CREATE INDEX IF NOT EXISTS rag_snippets_embedding_idx ON rag_snippets
USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
