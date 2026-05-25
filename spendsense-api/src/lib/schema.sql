-- =========================================
-- SpendSense Database Schema (multi-tenant)
-- =========================================

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── users ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email            CITEXT UNIQUE NOT NULL,
  password_hash    TEXT NOT NULL,
  name             TEXT,
  monthly_income   NUMERIC(12,2),
  savings_goal_pct NUMERIC(5,2),
  currency         TEXT NOT NULL DEFAULT 'INR',
  ai_consent_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at    TIMESTAMPTZ
);

-- ── sessions (opaque, server-side) ───────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent  TEXT,
  ip          INET
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id    ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);

-- ── categories (per-user) ────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories (user_id);

-- ── transactions (per-user) ──────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount      DOUBLE PRECISION NOT NULL,
  category    TEXT NOT NULL,
  date        TIMESTAMPTZ NOT NULL,
  note        TEXT,
  source      TEXT NOT NULL DEFAULT 'manual',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── AI: BYOK keys ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_ai_keys (
  user_id           TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL DEFAULT 'gemini',
  encrypted_key     BYTEA NOT NULL,
  iv                BYTEA NOT NULL,
  auth_tag          BYTEA NOT NULL,
  key_fingerprint   TEXT NOT NULL,
  daily_request_cap INT NOT NULL DEFAULT 200,
  monthly_token_cap BIGINT NOT NULL DEFAULT 5000000,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id            BIGSERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature       TEXT NOT NULL,
  model         TEXT NOT NULL,
  input_tokens  INT,
  output_tokens INT,
  status        TEXT NOT NULL,
  latency_ms    INT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_day
  ON ai_usage_log (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_cache (
  cache_key   TEXT PRIMARY KEY,
  feature     TEXT NOT NULL,
  value       JSONB NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  hits        INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expiry ON ai_cache (expires_at);

-- ── AI: chat ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_conversations (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT,
  summary    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_convo_user ON ai_conversations (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS ai_messages (
  id              BIGSERIAL PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,
  content         JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_msg_convo ON ai_messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tx_user_created ON transactions (user_id, "createdAt" DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_tx_user_date    ON transactions (user_id, date);
CREATE INDEX IF NOT EXISTS idx_tx_user_stats   ON transactions (user_id, date, category, amount);
