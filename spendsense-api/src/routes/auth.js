import crypto from 'crypto';
import { Router } from 'express';
import { getDb, withTimeout } from '../lib/db.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import {
  createSessionToken,
  hashToken,
  setSessionCookie,
  clearSessionCookie,
  getSessionTokenFromRequest,
  SESSION_TTL_MS,
} from '../lib/session.js';
import { validateCredentials } from '../lib/validateCredentials.js';
import { requireAuth, requireSameOrigin } from '../middleware/auth.js';
import {
  loginRateLimit,
  recordLoginFailure,
} from '../middleware/loginRateLimit.js';

const router = Router();

function isUniqueViolation(err) {
  const msg = err?.message ?? '';
  return (
    err?.code === '23505' ||
    msg.includes('unique') ||
    msg.includes('duplicate')
  );
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return (
    req.ip ||
    (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null) ||
    null
  );
}

// POST /api/auth/signup
router.post('/signup', requireSameOrigin, async (req, res, next) => {
  try {
    const parsed = validateCredentials(req.body, { requireName: true });
    if (!parsed.ok) {
      return res.status(400).json({
        error: 'Validation Error',
        messages: parsed.errors,
      });
    }

    const { email, password, name } = parsed;
    const passwordHash = await hashPassword(password);
    const sql = getDb();

    const sessionToken = createSessionToken();
    const tokenHash = hashToken(sessionToken);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    const userAgent = req.headers['user-agent'] ?? null;
    const ip = clientIp(req);

    const rows = await withTimeout(sql`
      WITH new_user AS (
        INSERT INTO users (email, password_hash, name)
        VALUES (${email}, ${passwordHash}, ${name})
        RETURNING id, email, name, created_at
      ),
      inserted_cats AS (
        INSERT INTO categories (user_id, name, color)
        SELECT nu.id, v.name, v.color
        FROM new_user nu
        CROSS JOIN (
          VALUES
            ('Food', '#fb923c'),
            ('Travel', '#60a5fa'),
            ('Bills', '#f87171'),
            ('Shopping', '#c084fc'),
            ('Health', '#34d399'),
            ('Entertainment', '#fbbf24'),
            ('Other', '#94a3b8')
        ) AS v(name, color)
        RETURNING id
      ),
      new_session AS (
        INSERT INTO sessions (user_id, token_hash, expires_at, user_agent, ip)
        SELECT
          nu.id,
          ${tokenHash},
          ${expiresAt}::timestamptz,
          ${userAgent},
          ${ip}
        FROM new_user nu
        RETURNING id
      )
      SELECT
        id,
        email,
        name,
        created_at AS "createdAt"
      FROM new_user
    `);

    const user = rows[0];
    setSessionCookie(res, sessionToken);
    res.status(201).json({ user });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email already exists',
      });
    }
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', requireSameOrigin, loginRateLimit, async (req, res, next) => {
  try {
    const parsed = validateCredentials(req.body);
    if (!parsed.ok) {
      return res.status(400).json({
        error: 'Validation Error',
        messages: parsed.errors,
      });
    }

    const { email, password } = parsed;
    const sql = getDb();

    const users = await withTimeout(sql`
      SELECT id, email, name, password_hash, created_at
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `);

    const user = users[0];
    const valid = user
      ? await verifyPassword(password, user.password_hash)
      : await verifyPassword(password, null);

    if (!user || !valid) {
      recordLoginFailure(req);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    const sessionToken = createSessionToken();
    const tokenHash = hashToken(sessionToken);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    const userAgent = req.headers['user-agent'] ?? null;
    const ip = clientIp(req);

    await withTimeout(sql`
      INSERT INTO sessions (user_id, token_hash, expires_at, user_agent, ip)
      VALUES (
        ${user.id},
        ${tokenHash},
        ${expiresAt}::timestamptz,
        ${userAgent},
        ${ip}
      )
    `);

    await withTimeout(sql`
      UPDATE users SET last_login_at = now(), updated_at = now()
      WHERE id = ${user.id}
    `);

    setSessionCookie(res, sessionToken);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Please try again',
      });
    }
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', requireSameOrigin, async (req, res, next) => {
  try {
    const token = getSessionTokenFromRequest(req);
    if (token) {
      const sql = getDb();
      await withTimeout(sql`
        DELETE FROM sessions WHERE token_hash = ${hashToken(token)}
      `);
    }
    clearSessionCookie(res);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout-all
router.post('/logout-all', requireSameOrigin, requireAuth, async (req, res, next) => {
  try {
    const sql = getDb();
    await withTimeout(sql`
      DELETE FROM sessions WHERE user_id = ${req.userId}
    `);
    clearSessionCookie(res);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
