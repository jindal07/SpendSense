import { neon } from '@neondatabase/serverless';

// Lazy singleton — connection is created once and reused
let sql;

/**
 * Returns the Neon SQL tagged-template function.
 * Usage: const rows = await sql`SELECT * FROM table`;
 */
export function getDb() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}
