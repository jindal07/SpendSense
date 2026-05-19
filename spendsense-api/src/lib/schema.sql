-- =========================================
-- SpendSense Database Schema
-- =========================================

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name       TEXT UNIQUE NOT NULL,
  color      TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  amount     DOUBLE PRECISION NOT NULL,
  category   TEXT NOT NULL,
  date       TIMESTAMPTZ NOT NULL,
  note       TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions ("createdAt");
CREATE INDEX IF NOT EXISTS idx_transactions_date       ON transactions (date);
CREATE INDEX IF NOT EXISTS idx_transactions_category   ON transactions (category);
CREATE INDEX IF NOT EXISTS idx_categories_name         ON categories (name);

-- Keyset pagination optimization (composite index for cursor-based queries)
CREATE INDEX IF NOT EXISTS idx_transactions_pagination ON transactions ("createdAt" DESC, id DESC);

-- Covering index for stats aggregations — enables index-only scans
-- on the date-filtered queries that group by category and sum amount
CREATE INDEX IF NOT EXISTS idx_transactions_stats ON transactions (date, category, amount);
