/** Comma-separated allowlist from CORS_ORIGIN and optional FRONTEND_URL. */
export function getAllowedOrigins() {
  const parts = [
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  const raw =
    parts.length > 0
      ? parts.join(',')
      : 'http://localhost:5173,http://127.0.0.1:5173';

  return [...new Set(
    raw
      .split(',')
      .map((s) => s.trim().replace(/\/$/, ''))
      .filter(Boolean)
      .filter((o) => o !== '*')
  )];
}
