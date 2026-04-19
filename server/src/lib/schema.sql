-- SpendSense schema (plain PostgreSQL, no ORM).
-- Table/column names mirror the previous Prisma layout so existing data
-- from a Prisma-managed database stays usable. Schema-healing migrations
-- (column types, defaults, etc.) are applied in JS by init-db.js.

CREATE TABLE IF NOT EXISTS "Category" (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name       TEXT NOT NULL UNIQUE,
  color      TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Transaction" (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  amount     DOUBLE PRECISION NOT NULL,
  category   TEXT NOT NULL,
  date       TIMESTAMPTZ NOT NULL,
  note       TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transaction_date_idx     ON "Transaction" (date);
CREATE INDEX IF NOT EXISTS transaction_category_idx ON "Transaction" (category);
