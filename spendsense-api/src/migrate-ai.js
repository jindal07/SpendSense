import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getDb } from './lib/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ALTERS = [
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_income NUMERIC(12,2)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS savings_goal_pct NUMERIC(5,2)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR'`,
  `UPDATE users SET currency = 'INR' WHERE currency IS NULL`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_consent_at TIMESTAMPTZ`,
  `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'`,
  `UPDATE transactions SET source = 'manual' WHERE source IS NULL`,
  `CREATE INDEX IF NOT EXISTS idx_ai_usage_user_model_day ON ai_usage_log (user_id, model, created_at DESC)`,
];

async function migrate() {
  console.log('Running AI migrations...\n');
  const sql = getDb();

  for (const stmt of ALTERS) {
    try {
      await sql(stmt);
      console.log(`  OK  ${stmt.slice(0, 70)}`);
    } catch (err) {
      console.warn(`  WARN  ${err.message}`);
    }
  }

  const fullSchema = readFileSync(join(__dirname, 'lib', 'schema.sql'), 'utf8');
  const aiStart = fullSchema.indexOf('-- ── AI: BYOK');
  if (aiStart === -1) {
    console.log('\nNo AI section in schema.sql — alters only.');
    return;
  }

  const aiSection = fullSchema.slice(aiStart);
  const statements = aiSection
    .split(';')
    .map((s) =>
      s
        .split('\n')
        .filter((l) => !l.trim().startsWith('--'))
        .join('\n')
        .trim()
    )
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      await sql(statement);
      console.log(`  OK  ${statement.replace(/\s+/g, ' ').slice(0, 70)}...`);
    } catch (err) {
      console.warn(`  WARN  ${err.message}`);
    }
  }

  console.log('\nMigration complete.');
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
