import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getDb } from './lib/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runSchema(sql) {
  const schema = readFileSync(join(__dirname, 'lib', 'schema.sql'), 'utf-8');
  const statements = schema
    .split(';')
    .map((s) =>
      s
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim()
    )
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await sql(statement);
    const preview = statement.replace(/\s+/g, ' ').substring(0, 70);
    console.log(`  ✅  ${preview}...`);
  }
}

async function resetDb() {
  console.log('🗑️  Resetting database (drop all tables)...\n');
  const sql = getDb();

  await sql`DROP TABLE IF EXISTS transactions CASCADE`;
  await sql`DROP TABLE IF EXISTS categories CASCADE`;
  await sql`DROP TABLE IF EXISTS sessions CASCADE`;
  await sql`DROP TABLE IF EXISTS users CASCADE`;
  console.log('  ✅  Dropped existing tables\n');

  console.log('🔧 Applying schema...\n');
  await runSchema(sql);
  console.log('\n✅ Database reset complete!');
}

resetDb().catch((err) => {
  console.error('❌ Failed to reset database:', err);
  process.exit(1);
});
