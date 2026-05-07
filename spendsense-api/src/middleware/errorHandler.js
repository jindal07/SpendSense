/**
 * Centralized error-handling middleware.
 * Must have 4 params so Express recognises it as an error handler.
 */
export function errorHandler(err, _req, res, _next) {
  console.error('❌ Error:', err.message || err);

  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';

  res.status(status).json({
    error: err.name || 'Internal Server Error',
    message: isProd ? 'An internal error occurred' : (err.message || 'Unknown error'),
    ...(err.messages && { messages: err.messages }),
  });
}
