import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { sql } = await import('./lib/db.js');

/**
 * Apply each `;`-delimited DDL statement from schema.sql in order.
 * Line comments (`-- ...`) are stripped first so a `;` inside a comment
 * doesn't split a statement.
 */
async function applySchemaFile(file) {
  const raw = await fs.readFile(file, 'utf8');
  const statements = raw
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`Applying schema (${statements.length} statement(s))...`);
  for (const stmt of statements) {
    const preview = stmt.split('\n')[0].slice(0, 80);
    console.log(`  • ${preview}${preview.length === 80 ? '...' : ''}`);
    await sql.query(stmt);
  }
}

/**
 * Idempotent healing migrations for databases that were previously managed
 * by another ORM (notably Prisma, which uses `TIMESTAMP WITHOUT TIME ZONE`
 * by default and doesn't set DB-side defaults for id/createdAt).
 *
 * Each step checks the current column type / default before touching it, so
 * this is safe to run on every `npm run db:init`.
 */
async function heal() {
  console.log('Running healing migrations...');

  const changes = [
    { table: 'Transaction', column: 'date', type: 'timestamptz' },
    { table: 'Transaction', column: 'createdAt', type: 'timestamptz' },
    { table: 'Category', column: 'createdAt', type: 'timestamptz' },
  ];

  for (const { table, column, type } of changes) {
    const rows = await sql`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = ${table} AND column_name = ${column}
    `;
    const current = rows[0]?.data_type;
    if (!current) continue;
    if (current === 'timestamp without time zone' && type === 'timestamptz') {
      console.log(`  • ALTER "${table}"."${column}" TYPE ${type}`);
      // The old naive values were written under session TZ=UTC, so treating
      // them AT TIME ZONE 'UTC' recovers the correct absolute instants.
      await sql.query(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE TIMESTAMPTZ USING "${column}" AT TIME ZONE 'UTC'`
      );
    }
  }

  // Make sure id/createdAt have defaults even on tables created by a prior ORM
  // that generated those values client-side.
  const defaultPatches = [
    { table: 'Category', column: 'id', default: 'gen_random_uuid()::text' },
    { table: 'Transaction', column: 'id', default: 'gen_random_uuid()::text' },
    { table: 'Category', column: 'createdAt', default: 'NOW()' },
    { table: 'Transaction', column: 'createdAt', default: 'NOW()' },
  ];
  for (const { table, column, default: def } of defaultPatches) {
    const rows = await sql`
      SELECT column_default
      FROM information_schema.columns
      WHERE table_name = ${table} AND column_name = ${column}
    `;
    if (!rows[0]) continue;
    if (!rows[0].column_default) {
      console.log(`  • SET DEFAULT ${def} on "${table}"."${column}"`);
      await sql.query(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT ${def}`
      );
    }
  }
}

async function main() {
  const schemaPath = path.resolve(__dirname, 'lib/schema.sql');
  await applySchemaFile(schemaPath);
  await heal();
  console.log('Done.');
}

main().catch((err) => {
  console.error('[init-db] failed:', err);
  process.exit(1);
});
