/**
 * Parse and clamp pagination query params for keyset pagination.
 */
export function parsePaginationParams(query) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const cursor = query.cursor || null;
  return { limit, cursor };
}
