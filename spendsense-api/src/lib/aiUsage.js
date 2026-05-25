import { getDb } from './db.js';

export async function logAiUsage({
  userId,
  feature,
  model,
  inputTokens = 0,
  outputTokens = 0,
  status,
  latencyMs,
}) {
  const sql = getDb();
  await sql`
    INSERT INTO ai_usage_log (user_id, feature, model, input_tokens, output_tokens, status, latency_ms)
    VALUES (${userId}, ${feature}, ${model}, ${inputTokens}, ${outputTokens}, ${status}, ${latencyMs})
  `;
}

export async function getUsageStats(userId) {
  const sql = getDb();
  const rows = await sql`
    SELECT
      COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now()))::int AS today_calls,
      COALESCE(SUM(input_tokens + output_tokens) FILTER (WHERE created_at >= date_trunc('day', now())), 0)::bigint AS today_tokens,
      COUNT(*) FILTER (WHERE created_at >= date_trunc('month', now()))::int AS month_calls,
      COALESCE(SUM(input_tokens + output_tokens) FILTER (WHERE created_at >= date_trunc('month', now())), 0)::bigint AS month_tokens
    FROM ai_usage_log
    WHERE user_id = ${userId} AND status = 'ok'
  `;
  return rows[0];
}
