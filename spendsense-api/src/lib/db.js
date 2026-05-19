import { neon } from '@neondatabase/serverless';

// Lazy singleton — connection is created once and reused
let sql;

/**
 * Returns the Neon SQL tagged-template function.
 * Uses fetchConnectionCache for faster warm invocations in serverless.
 * Usage: const rows = await sql`SELECT * FROM table`;
 */
export function getDb() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    sql = neon(process.env.DATABASE_URL, {
      fetchConnectionCache: true,
    });
  }
  return sql;
}

/**
 * Wraps a promise with a timeout to prevent serverless function hangs.
 * @param {Promise} promise - The promise to wrap
 * @param {number} ms - Timeout in milliseconds (default 8000)
 */
export function withTimeout(promise, ms = 8000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Database query timed out after ${ms}ms`)), ms)
    ),
  ]);
}
