import { getDb } from './db.js';

/**
 * Google AI free-tier limits (slightly under official caps for safety margin).
 * @see https://ai.google.dev/gemini-api/docs/rate-limits
 */
export const GEMINI_FREE_TIER = {
  'gemini-2.5-flash-lite': { rpm: 60, tpm: 4_000_000, rpd: 14000 },
  'gemini-2.5-flash':      { rpm: 30, tpm: 4_000_000, rpd: 1500 },
  'gemini-2.5-pro':        { rpm: 10, tpm: 1_000_000, rpd: 50 },
  'gemini-2.0-flash-lite': { rpm: 60, tpm: 4_000_000, rpd: 14000 },
  'gemini-2.0-flash':      { rpm: 30, tpm: 4_000_000, rpd: 1500 },
};

const WINDOW_MS = 60_000;
const GEMINI_API_FEATURE = 'gemini_api';

/** @type {Map<string, { callTimes: number[], tokenEvents: { ts: number, tokens: number }[] }>} */
const minuteWindows = new Map();

function getLimits(model) {
  return GEMINI_FREE_TIER[model] ?? GEMINI_FREE_TIER['gemini-2.5-flash-lite'];
}

function windowKey(userId, model) {
  return `${userId}:${model}`;
}

function pruneCallTimes(times) {
  const cutoff = Date.now() - WINDOW_MS;
  return times.filter((t) => t > cutoff);
}

function pruneTokenEvents(events) {
  const cutoff = Date.now() - WINDOW_MS;
  return events.filter((e) => e.ts > cutoff);
}

function quotaError(message, code, retryAfter = null) {
  return Object.assign(new Error(message), {
    status: 429,
    code,
    retryAfter,
  });
}

/**
 * Call before every Gemini generateContent / generateContentStream.
 */
export async function assertGeminiQuota(userId, model) {
  const limits = getLimits(model);

  if (limits.rpd === 0) {
    throw Object.assign(
      new Error(`${model} is not available on the Gemini free tier.`),
      { status: 400, code: 'GEMINI_MODEL_UNAVAILABLE' }
    );
  }

  const key = windowKey(userId, model);
  let w = minuteWindows.get(key);
  if (!w) {
    w = { callTimes: [], tokenEvents: [] };
    minuteWindows.set(key, w);
  }

  w.callTimes = pruneCallTimes(w.callTimes);
  w.tokenEvents = pruneTokenEvents(w.tokenEvents);

  if (w.callTimes.length >= limits.rpm) {
    const oldest = w.callTimes[0];
    const retryAfter = Math.ceil((oldest + WINDOW_MS - Date.now()) / 1000);
    throw quotaError(
      `Too many ${model} requests per minute (max ${limits.rpm}). Try again in ~${retryAfter}s.`,
      'GEMINI_RPM',
      retryAfter
    );
  }

  const tpmUsed = w.tokenEvents.reduce((s, e) => s + e.tokens, 0);
  if (tpmUsed >= limits.tpm) {
    throw quotaError(
      `Token rate limit reached for ${model}. Wait a minute and try again.`,
      'GEMINI_TPM',
      60
    );
  }

  const sql = getDb();
  const rows = await sql`
    SELECT COUNT(*)::int AS n
    FROM ai_usage_log
    WHERE user_id = ${userId}
      AND model = ${model}
      AND feature = ${GEMINI_API_FEATURE}
      AND status = 'ok'
      AND created_at >= date_trunc('day', now())
  `;
  const usedToday = rows[0]?.n ?? 0;

  if (usedToday >= limits.rpd) {
    throw quotaError(
      `Daily limit for ${model} reached (${limits.rpd} requests/day on the free tier). Resets tomorrow.`,
      'GEMINI_RPD'
    );
  }
}

function trackMinuteUsage(userId, model, totalTokens) {
  const key = windowKey(userId, model);
  let w = minuteWindows.get(key);
  if (!w) {
    w = { callTimes: [], tokenEvents: [] };
    minuteWindows.set(key, w);
  }
  w.callTimes.push(Date.now());
  if (totalTokens > 0) {
    w.tokenEvents.push({ ts: Date.now(), tokens: totalTokens });
  }
  minuteWindows.set(key, w);
}

/**
 * Log each Gemini API call (used for per-model daily limits).
 */
export async function recordGeminiApiCall(
  userId,
  model,
  { inputTokens = 0, outputTokens = 0, status = 'ok', latencyMs = 0 } = {}
) {
  const sql = getDb();
  await sql`
    INSERT INTO ai_usage_log (user_id, feature, model, input_tokens, output_tokens, status, latency_ms)
    VALUES (${userId}, ${GEMINI_API_FEATURE}, ${model}, ${inputTokens}, ${outputTokens}, ${status}, ${latencyMs})
  `;
  if (status === 'ok') {
    trackMinuteUsage(userId, model, inputTokens + outputTokens);
  }
}

export function getQuotaSummary(model) {
  const limits = getLimits(model);
  return { model, ...limits };
}

/** Per-model usage today for Settings UI. */
export async function getModelQuotaStatus(userId, models) {
  const sql = getDb();
  const unique = [...new Set(models)];
  const status = {};

  for (const model of unique) {
    const limits = getLimits(model);
    const rows = await sql`
      SELECT COUNT(*)::int AS used_today
      FROM ai_usage_log
      WHERE user_id = ${userId}
        AND model = ${model}
        AND feature = ${GEMINI_API_FEATURE}
        AND status = 'ok'
        AND created_at >= date_trunc('day', now())
    `;
    status[model] = {
      usedToday: rows[0]?.used_today ?? 0,
      rpd: limits.rpd,
      rpm: limits.rpm,
      tpm: limits.tpm,
    };
  }

  return status;
}
