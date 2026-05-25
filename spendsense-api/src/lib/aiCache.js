import crypto from 'crypto';
import { getDb } from './db.js';

export function cacheHash(parts) {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

export async function getOrSet(cacheKey, feature, ttlSeconds, fn) {
  const sql = getDb();

  const existing = await sql`
    SELECT value, expires_at
    FROM ai_cache
    WHERE cache_key = ${cacheKey} AND expires_at > now()
    LIMIT 1
  `;

  if (existing.length) {
    await sql`UPDATE ai_cache SET hits = hits + 1 WHERE cache_key = ${cacheKey}`;
    return { value: existing[0].value, fromCache: true };
  }

  const value = await fn();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  await sql`
    INSERT INTO ai_cache (cache_key, feature, value, expires_at)
    VALUES (${cacheKey}, ${feature}, ${JSON.stringify(value)}::jsonb, ${expiresAt}::timestamptz)
    ON CONFLICT (cache_key) DO UPDATE SET
      value = EXCLUDED.value,
      expires_at = EXCLUDED.expires_at,
      hits = 0
  `;

  return { value, fromCache: false };
}

export async function purgeExpiredCache() {
  const sql = getDb();
  await sql`DELETE FROM ai_cache WHERE expires_at < now()`;
}
