/**
 * Centralized error-handling middleware.
 * Must have 4 params so Express recognises it as an error handler.
 */
export function errorHandler(err, _req, res, _next) {
  console.error('❌ Error:', err.message || err);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'Payload Too Large',
      message: 'File must be under 5MB',
    });
  }

  if (err.status === 504) {
    return res.status(504).json({
      error: 'Gateway Timeout',
      message: 'AI request timed out. Please try again.',
    });
  }

  if (err.status === 422 && err.aiRawText) {
    return res.status(422).json({
      error: 'Unprocessable AI Response',
      message: 'AI returned an unexpected response. Please try again.',
    });
  }

  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';

  res.status(status).json({
    error: err.name || 'Internal Server Error',
    message: isProd ? 'An internal error occurred' : (err.message || 'Unknown error'),
    ...(err.messages && { messages: err.messages }),
  });
}
