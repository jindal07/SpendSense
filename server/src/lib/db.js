import { neon } from '@neondatabase/serverless';

/**
 * Lazily-initialized Neon SQL client.
 *
 * We defer reading DATABASE_URL until the first query so that local entry
 * points (dev-server.js, seed.js, init-db.js) have a chance to call
 * `dotenv.config()` before we construct the client.
 *
 * In Vercel the env var is injected into the process at boot, so the lazy
 * init runs exactly once per cold start.
 */
let _sql;

function getClient() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        'DATABASE_URL is not set. Add it to .env (local) or your Vercel project env vars.'
      );
    }
    _sql = neon(url);
  }
  return _sql;
}

/**
 * Tagged-template SQL executor backed by the Neon HTTP driver.
 *
 * Usage:
 *   const rows = await sql`SELECT * FROM "Category" WHERE name = ${name}`;
 *
 * For dynamic/parameterized queries that can't be expressed as a template,
 * use `sql.query(text, params)`.
 */
export const sql = (strings, ...values) => getClient()(strings, ...values);
sql.query = (text, params) => getClient().query(text, params);

export default sql;
