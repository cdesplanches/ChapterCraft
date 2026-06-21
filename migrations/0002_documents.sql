CREATE TABLE IF NOT EXISTS documents (
  key TEXT PRIMARY KEY,
  body TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_key_prefix ON documents(key);
