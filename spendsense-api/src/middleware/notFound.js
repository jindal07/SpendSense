/**
 * 404 handler for unmatched routes.
 */
export function notFound(req, res) {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}
