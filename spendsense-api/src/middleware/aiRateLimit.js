import { getDb } from '../lib/db.js';

const BURST_MAX = 10;
const BURST_WINDOW_MS = 60_000;
const MAX_CONCURRENT = 3;

const buckets = new Map();
const activeRequests = new Map();

function getBurstBucket(userId) {
  const now = Date.now();
  let b = buckets.get(userId);
  if (!b || now > b.resetAt) {
    b = { tokens: BURST_MAX, resetAt: now + BURST_WINDOW_MS };
    buckets.set(userId, b);
  }
  return b;
}

export function aiBurstLimit(req, res, next) {
  const b = getBurstBucket(req.userId);
  if (b.tokens <= 0) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'AI rate limit exceeded. Please wait a moment.',
      retryAfter: Math.ceil((b.resetAt - Date.now()) / 1000),
    });
  }

  const active = activeRequests.get(req.userId) ?? 0;
  if (active >= MAX_CONCURRENT) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Please wait for your current AI request to finish.',
    });
  }

  b.tokens -= 1;
  activeRequests.set(req.userId, active + 1);

  const cleanup = () => {
    const current = activeRequests.get(req.userId) ?? 1;
    if (current <= 1) activeRequests.delete(req.userId);
    else activeRequests.set(req.userId, current - 1);
  };
  res.on('close', cleanup);
  res.on('finish', cleanup);

  next();
}

export async function aiDailyLimit(req, res, next) {
  try {
    const sql = getDb();
    const [caps, dailyUsage, monthlyUsage] = await Promise.all([
      sql`
        SELECT daily_request_cap, monthly_token_cap
        FROM user_ai_keys
        WHERE user_id = ${req.userId}
        LIMIT 1
      `,
      sql`
        SELECT COUNT(*)::int AS today_calls
        FROM ai_usage_log
        WHERE user_id = ${req.userId}
          AND status = 'ok'
          AND created_at >= date_trunc('day', now())
      `,
      sql`
        SELECT COALESCE(SUM(input_tokens + output_tokens), 0)::bigint AS month_tokens
        FROM ai_usage_log
        WHERE user_id = ${req.userId}
          AND status = 'ok'
          AND created_at >= date_trunc('month', now())
      `,
    ]);

    if (!caps.length) {
      return res.status(412).json({
        error: 'Precondition Failed',
        message: 'Configure your Gemini API key in Settings first.',
      });
    }

    const cap = caps[0];
    const todayCalls = dailyUsage[0]?.today_calls ?? 0;
    const monthTokens = Number(monthlyUsage[0]?.month_tokens ?? 0);

    if (todayCalls >= cap.daily_request_cap) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Daily AI limit reached (${cap.daily_request_cap} requests). Try again tomorrow.`,
      });
    }

    if (monthTokens >= Number(cap.monthly_token_cap)) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Monthly AI token budget exhausted. Resets next month.',
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}
