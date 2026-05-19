/** Comma-separated allowlist from CORS_ORIGIN (defaults to local Vite dev). */
export function getAllowedOrigins() {
  const raw =
    process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://127.0.0.1:5173';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((o) => o !== '*');
}
