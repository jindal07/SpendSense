const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const buckets = new Map();

function clientKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

function getBucket(req) {
  const key = clientKey(req);
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, bucket);
  }
  return bucket;
}

/** Returns true if the client is rate-limited. */
export function isLoginRateLimited(req) {
  return getBucket(req).count >= MAX_ATTEMPTS;
}

/** Record a failed login attempt (10 / 15 min / IP). */
export function recordLoginFailure(req) {
  getBucket(req).count += 1;
}

/** Middleware: block before handler if already over the limit. */
export function loginRateLimit(req, res, next) {
  if (isLoginRateLimited(req)) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many login attempts. Please try again later.',
    });
  }
  next();
}
