import { GoogleGenAI } from '@google/genai';
import { getDb } from './db.js';
import { decryptKey } from './keyVault.js';

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

export function parseJsonResponse(text) {
  const trimmed = text?.trim() ?? '';
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw Object.assign(
      new Error('AI returned non-JSON response'),
      { status: 422, aiRawText: trimmed.slice(0, 200) }
    );
  }
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (parseErr) {
    throw Object.assign(
      new Error('AI returned malformed JSON'),
      { status: 422, aiRawText: jsonMatch[0].slice(0, 200) }
    );
  }
}

export async function generateJson(ai, { model, prompt, schema, maxOutputTokens = 256 }) {
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
    data: parseJsonResponse(result.text),
    inputTokens: usage.promptTokenCount ?? 0,
    outputTokens: usage.candidatesTokenCount ?? 0,
  };
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(Object.assign(new Error('AI request timed out'), { status: 504 })),
      ms
    );
    promise
      .then((v) => { clearTimeout(timer); resolve(v); })
      .catch((e) => { clearTimeout(timer); reject(e); });
  });
}

export { withTimeout };
