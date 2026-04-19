import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load .env from repo root regardless of where this is invoked from.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { default: prisma } = await import('./lib/prisma.js');

// SpendSense brand-palette-compatible category colors.
// Spread across lavender-blush / cotton-rose / lilac / deep-twilight families
// to stay harmonious in charts while remaining distinguishable.
const DEFAULT_CATEGORIES = [
  { name: 'Food', color: '#d12e49' },          // lavender-blush-500
  { name: 'Transport', color: '#4c35fd' },     // deep-twilight-400
  { name: 'Groceries', color: '#a857a7' },     // lilac-500
  { name: 'Shopping', color: '#da586d' },      // lavender-blush-400
  { name: 'Bills', color: '#7968fd' },         // deep-twilight-300
  { name: 'Health', color: '#b14e59' },        // cotton-rose-500
  { name: 'Entertainment', color: '#ba78b9' }, // lilac-400
  { name: 'Other', color: '#6a2f36' },         // cotton-rose-700
];

async function main() {
  console.log('Seeding default categories...');
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { color: cat.color },
      create: cat,
    });
    console.log(` - ${cat.name} (${cat.color})`);
  }
  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
