-- Users & auth
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wallets (
  user_id TEXT PRIMARY KEY NOT NULL,
  balance INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  at TEXT NOT NULL,
  delta INTEGER NOT NULL,
  item TEXT,
  bin TEXT,
  claim_id TEXT,
  reason TEXT NOT NULL DEFAULT 'machine_qr',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_claim_id ON ledger_entries(claim_id);

CREATE TABLE IF NOT EXISTS redeemed_claims (
  claim_id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  redeemed_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
