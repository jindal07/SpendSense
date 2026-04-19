import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { sql } = await import('./lib/db.js');

// SpendSense brand-palette-compatible category colors.
const DEFAULT_CATEGORIES = [
  { name: 'Food', color: '#d12e49' },
  { name: 'Transport', color: '#4c35fd' },
  { name: 'Groceries', color: '#a857a7' },
  { name: 'Shopping', color: '#da586d' },
  { name: 'Bills', color: '#7968fd' },
  { name: 'Health', color: '#b14e59' },
  { name: 'Entertainment', color: '#ba78b9' },
  { name: 'Other', color: '#6a2f36' },
];

async function main() {
  console.log('Seeding default categories...');
  for (const cat of DEFAULT_CATEGORIES) {
    await sql`
      INSERT INTO "Category" (name, color)
      VALUES (${cat.name}, ${cat.color})
      ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color
    `;
    console.log(` - ${cat.name} (${cat.color})`);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
