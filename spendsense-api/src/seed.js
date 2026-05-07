import 'dotenv/config';
import { getDb } from './lib/db.js';

const DEFAULT_CATEGORIES = [
  { name: 'Food',          color: '#fb923c' },
  { name: 'Travel',        color: '#60a5fa' },
  { name: 'Bills',         color: '#f87171' },
  { name: 'Shopping',      color: '#c084fc' },
  { name: 'Health',        color: '#34d399' },
  { name: 'Entertainment', color: '#fbbf24' },
  { name: 'Other',         color: '#94a3b8' },
];

async function seed() {
  console.log('🌱 Seeding categories...\n');

  const sql = getDb();

  for (const cat of DEFAULT_CATEGORIES) {
    await sql`
      INSERT INTO categories (name, color)
      VALUES (${cat.name}, ${cat.color})
      ON CONFLICT (name) DO UPDATE SET color = ${cat.color}
    `;
    console.log(`  ✅ ${cat.name}  ${cat.color}`);
  }

  console.log('\n✅ Seeding complete!');
}

seed().catch((err) => {
  console.error('❌ Failed to seed database:', err);
  process.exit(1);
});
