import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getDb } from './lib/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initDb() {
  console.log('🔧 Initializing database...\n');

  const sql = getDb();
  const schema = readFileSync(join(__dirname, 'lib', 'schema.sql'), 'utf-8');

  // Split by semicolons, strip comment-only lines, filter empty chunks
  const statements = schema
    .split(';')
    .map(s =>
      s
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim()
    )
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await sql(statement);
      const preview = statement.replace(/\s+/g, ' ').substring(0, 70);
      console.log(`  ✅  ${preview}...`);
    } catch (err) {
      // Idempotent — log and continue
      console.error(`  ⚠️  ${err.message}`);
    }
  }

  console.log('\n✅ Database initialization complete!');
}

initDb().catch((err) => {
  console.error('❌ Failed to initialize database:', err);
  process.exit(1);
});
