import { GoogleGenAI } from '@google/genai';
import { getDb } from './db.js';
import { decryptKey } from './keyVault.js';
import { assertGeminiQuota, recordGeminiApiCall } from './geminiQuota.js';

const AI_CALL_TIMEOUT_MS = 30_000;

const keyCache = new Map();
const KEY_CACHE_TTL = 5 * 60_000;

export class AiKeyMissingError extends Error {
  constructor() {
    super('No Gemini API key configured');
    this.name = 'AiKeyMissingError';
    this.status = 412;
  }
}

function getCachedKey(userId) {
  const entry = keyCache.get(userId);
  if (entry && Date.now() < entry.expiresAt) return entry.apiKey;
  keyCache.delete(userId);
  return null;
}

export async function getGeminiForUser(userId) {
  let apiKey = getCachedKey(userId);

  if (!apiKey) {
    const sql = getDb();
    const rows = await sql`
      SELECT encrypted_key, iv, auth_tag
      FROM user_ai_keys
      WHERE user_id = ${userId}
      LIMIT 1
    `;
    if (!rows.length) throw new AiKeyMissingError();

    apiKey = decryptKey({
      ciphertext: rows[0].encrypted_key,
      iv: rows[0].iv,
      authTag: rows[0].auth_tag,
    });
    keyCache.set(userId, { apiKey, expiresAt: Date.now() + KEY_CACHE_TTL });
  }

  return new GoogleGenAI({ apiKey });
}

export function invalidateKeyCache(userId) {
  keyCache.delete(userId);
}

export async function validateGeminiKey(apiKey) {
  const ai = new GoogleGenAI({ apiKey });
  await withTimeout(ai.models.list({ pageSize: 1 }), 10_000);
  return true;
}

/** Pull text from Gemini SDK response (`.text` is not always populated for vision). */
export function extractModelText(result) {
  const direct = result?.text;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();

  const parts = result?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const joined = parts
      .map((p) => (typeof p?.text === 'string' ? p.text : ''))
      .join('')
      .trim();
    if (joined) return joined;
  }

  return '';
}

export function getFinishReason(result) {
  return result?.candidates?.[0]?.finishReason ?? result?.finishReason ?? null;
}

export function parseJsonResponse(text) {
  let trimmed = typeof text === 'string' ? text.trim() : '';
  if (!trimmed) {
    throw Object.assign(new Error('AI returned an empty response'), {
      status: 422,
      code: 'AI_EMPTY_RESPONSE',
    });
  }

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) trimmed = fence[1].trim();

  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw Object.assign(new Error('Could not read structured data from the receipt. Try a clearer photo.'), {
      status: 422,
      code: 'AI_NON_JSON',
      aiRawText: trimmed.slice(0, 300),
    });
  }
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    throw Object.assign(new Error('AI returned malformed JSON. Try again with a clearer image.'), {
      status: 422,
      code: 'AI_MALFORMED_JSON',
      aiRawText: jsonMatch[0].slice(0, 300),
    });
  }
}

/**
 * Vision / multimodal JSON (receipt scan, audio, etc.)
 */
export async function generateVisionJson(
  userId,
  { model, parts, schema, maxOutputTokens = 800, systemHint = '' }
) {
  const userParts = systemHint
    ? [{ text: systemHint }, ...parts]
    : parts;

  const { data, inputTokens, outputTokens } = await invokeGemini(userId, { model }, async (ai) => {
    const result = await withTimeout(
      ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: userParts }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          maxOutputTokens,
        },
      }),
      45_000
    );

    const finishReason = getFinishReason(result);
    if (finishReason === 'SAFETY' || finishReason === 'BLOCKLIST') {
      throw Object.assign(new Error('This image could not be processed. Try a different photo.'), {
        status: 422,
        code: 'AI_BLOCKED',
      });
    }

    const text = extractModelText(result);
    const usage = result.usageMetadata ?? {};
    return {
      data: parseJsonResponse(text),
      inputTokens: usage.promptTokenCount ?? 0,
      outputTokens: usage.candidatesTokenCount ?? 0,
    };
  });

  return { data, inputTokens, outputTokens };
}

/**
 * Wrap every Gemini API call: quota check → call → per-call usage log.
 * @param {string} userId
 * @param {{ model: string }} opts
 * @param {(ai: import('@google/genai').GoogleGenAI) => Promise<{ inputTokens?: number, outputTokens?: number, [key: string]: unknown }>} fn
 */
export async function invokeGemini(userId, { model }, fn) {
  await assertGeminiQuota(userId, model);
  const ai = await getGeminiForUser(userId);
  const start = Date.now();
  try {
    const result = await fn(ai);
    const inputTokens = result.inputTokens ?? 0;
    const outputTokens = result.outputTokens ?? 0;
    await recordGeminiApiCall(userId, model, {
      inputTokens,
      outputTokens,
      status: 'ok',
      latencyMs: Date.now() - start,
    });
    return result;
  } catch (err) {
    await recordGeminiApiCall(userId, model, {
      status: 'error',
      latencyMs: Date.now() - start,
    }).catch(() => {});
    throw normalizeGeminiError(err);
  }
}

export async function generateJson(userId, { model, prompt, schema, maxOutputTokens = 256 }) {
  const { data, inputTokens, outputTokens } = await invokeGemini(userId, { model }, async (ai) => {
    const result = await withTimeout(
      ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          maxOutputTokens,
        },
      }),
      AI_CALL_TIMEOUT_MS
    );
    const usage = result.usageMetadata ?? {};
    return {
      data: parseJsonResponse(extractModelText(result)),
      inputTokens: usage.promptTokenCount ?? 0,
      outputTokens: usage.candidatesTokenCount ?? 0,
    };
  });
  return { data, inputTokens, outputTokens };
}

export function normalizeGeminiError(err) {
  if (!err) return err;

  const status = err.status ?? err.error?.code;
  const raw =
    typeof err.message === 'string'
      ? err.message
      : JSON.stringify(err.error?.message ?? err.message ?? '');

  if (
    status === 429 ||
    raw.includes('RESOURCE_EXHAUSTED') ||
    raw.includes('quota') ||
    err.code === 'GEMINI_RPM' ||
    err.code === 'GEMINI_TPM' ||
    err.code === 'GEMINI_RPD'
  ) {
    const retryMatch = raw.match(/retry in ([\d.]+)s/i);
    const retryAfter = err.retryAfter ?? (retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : null);
    const modelMatch = raw.match(/model:\s*([^\s\\n]+)/i);

    const message =
      err.code === 'GEMINI_RPD' || err.code === 'GEMINI_RPM' || err.code === 'GEMINI_TPM'
        ? err.message
        : retryAfter
          ? `Gemini quota exceeded${modelMatch ? ` for ${modelMatch[1]}` : ''}. Try again in ~${retryAfter}s.`
          : `Gemini quota exceeded${modelMatch ? ` for ${modelMatch[1]}` : ''}. Check https://aistudio.google.com/apikey`;

    return Object.assign(new Error(message), {
      status: 429,
      code: err.code ?? 'GEMINI_QUOTA_EXCEEDED',
      retryAfter,
    });
  }

  if (status === 401 || status === 403) {
    return Object.assign(new Error('Invalid or unauthorized Gemini API key'), {
      status: 400,
      code: 'GEMINI_AUTH',
    });
  }

  if (status === 400) {
    return Object.assign(
      new Error('Gemini rejected this request. Check your API key and model access.'),
      { status: 400, code: 'GEMINI_BAD_REQUEST' }
    );
  }

  return err;
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(Object.assign(new Error('AI request timed out'), { status: 504 })),
      ms
    );
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(normalizeGeminiError(e));
      });
  });
}

export { withTimeout };
