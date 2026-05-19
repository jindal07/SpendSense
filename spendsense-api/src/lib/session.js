import crypto from 'crypto';
import { serialize, parse } from 'cookie';

export const SESSION_COOKIE_NAME = 'session';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Cross-site credentialed fetches (e.g. web.vercel.app → api.vercel.app) require
 * SameSite=None; Secure. Local dev keeps Lax (same-site localhost).
 * Override with COOKIE_CROSS_SITE=true|false.
 */
export function usesCrossSiteCookies() {
  if (process.env.COOKIE_CROSS_SITE === 'true') return true;
  if (process.env.COOKIE_CROSS_SITE === 'false') return false;
  return process.env.NODE_ENV === 'production';
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return parse(cookieHeader);
}

export function cookieOptions() {
  const crossSite = usesCrossSiteCookies();
  return {
    httpOnly: true,
    secure: crossSite || process.env.NODE_ENV === 'production',
    sameSite: crossSite ? 'none' : 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  };
}

export function setSessionCookie(res, token) {
  res.setHeader(
    'Set-Cookie',
    serialize(SESSION_COOKIE_NAME, token, cookieOptions())
  );
}

export function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    serialize(SESSION_COOKIE_NAME, '', { ...cookieOptions(), maxAge: 0 })
  );
}

export function getSessionTokenFromRequest(req) {
  return parseCookies(req.headers.cookie)?.[SESSION_COOKIE_NAME];
}

export async function createSessionRow(sql, userId, req) {
  const token = createSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const userAgent = req.headers['user-agent'] ?? null;
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    req.ip ||
    (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null) ||
    null;

  await sql`
    INSERT INTO sessions (user_id, token_hash, expires_at, user_agent, ip)
    VALUES (
      ${userId},
      ${tokenHash},
      ${expiresAt}::timestamptz,
      ${userAgent},
      ${ip}
    )
  `;

  return token;
}
