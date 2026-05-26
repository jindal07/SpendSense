import { logRequestError } from '../lib/logger.js';

/**
 * Centralized error-handling middleware.
 * Must have 4 params so Express recognises it as an error handler.
 */
export function errorHandler(err, req, res, _next) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    logRequestError(req, err, 413);
    return res.status(413).json({
      error: 'Payload Too Large',
      message: 'File must be under 5MB',
    });
  }

  if (err.status === 504) {
    logRequestError(req, err, 504);
    return res.status(504).json({
      error: 'Gateway Timeout',
      message: 'AI request timed out. Please try again.',
    });
  }

  if (err.status === 429 || err.code === 'GEMINI_QUOTA_EXCEEDED') {
    logRequestError(req, err, 429);
    return res.status(429).json({
      error: 'Too Many Requests',
      code: 'GEMINI_QUOTA_EXCEEDED',
      message: err.message || 'Gemini API quota exceeded. Try again later.',
      ...(err.retryAfter != null && { retryAfter: err.retryAfter }),
    });
  }

  if (err.status === 422) {
    logRequestError(req, err, 422);
    return res.status(422).json({
      error: 'Unprocessable',
      message: err.message || 'AI returned an unexpected response. Please try again.',
      ...(err.code && { code: err.code }),
    });
  }

  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';

  logRequestError(req, err, status);

  res.status(status).json({
    error: err.name || 'Internal Server Error',
    message: isProd && status >= 500
      ? 'An internal error occurred'
      : (err.message || 'Unknown error'),
    ...(err.messages && { messages: err.messages }),
  });
}
