CREATE TABLE media (
  id TEXT PRIMARY KEY,
  public_id TEXT NOT NULL UNIQUE,
  secure_url TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  format TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);
