import { getDb, withTimeout } from '../lib/db.js';
import {
  getSessionTokenFromRequest,
  hashToken,
  usesCrossSiteCookies,
} from '../lib/session.js';
import { getAllowedOrigins } from '../lib/corsOrigins.js';

export async function requireAuth(req, res, next) {
  try {
    const token = getSessionTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Not authenticated' });
    }

    const sql = getDb();
    const rows = await withTimeout(sql`
      SELECT user_id
      FROM sessions
      WHERE token_hash = ${hashToken(token)}
        AND expires_at > now()
      LIMIT 1
    `);

    if (!rows.length) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Not authenticated' });
    }

    req.userId = rows[0].user_id;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * CSRF guard for cross-site cookie deployments (SameSite=None).
 * Verifies Origin or Referer matches the CORS allowlist on state-changing requests.
 */
export function requireSameOrigin(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }
  if (!usesCrossSiteCookies()) {
    return next();
  }

  const allow = getAllowedOrigins();
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (origin && allow.includes(origin)) {
    return next();
  }

  if (referer) {
    const ok = allow.some((allowed) => referer.startsWith(allowed));
    if (ok) return next();
  }

  return res.status(403).json({
    error: 'Forbidden',
    message: 'Cross-site request blocked',
  });
}
