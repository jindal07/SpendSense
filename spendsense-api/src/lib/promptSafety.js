/**
 * Prompt injection guard — strips known injection patterns and enforces
 * length limits before user text enters any Gemini prompt.
 */

const MAX_NOTE_LENGTH = 200;
const MAX_TRANSCRIPT_LENGTH = 500;
const MAX_CHAT_MESSAGE_LENGTH = 1000;

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,
  /you\s+are\s+now\s+/gi,
  /system\s*:\s*/gi,
  /\bDAN\b/g,
  /pretend\s+you/gi,
  /act\s+as\s+(if\s+)?you/gi,
  /forget\s+(all\s+|everything\s+)?(previous|above|prior)/gi,
  /new\s+instructions?\s*:/gi,
  /override\s+(your\s+)?(system|instructions?)/gi,
  /\[INST\]/gi,
  /<<SYS>>/gi,
  /<\|im_start\|>/gi,
];

function stripInjection(text) {
  let cleaned = text;
  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  return cleaned.trim();
}

export function sanitizeNote(raw) {
  if (typeof raw !== 'string') return '';
  return stripInjection(raw.trim().slice(0, MAX_NOTE_LENGTH));
}

export function sanitizeTranscript(raw) {
  if (typeof raw !== 'string') return '';
  return stripInjection(raw.trim().slice(0, MAX_TRANSCRIPT_LENGTH));
}

export function sanitizeChatMessage(raw) {
  if (typeof raw !== 'string') return '';
  return stripInjection(raw.trim().slice(0, MAX_CHAT_MESSAGE_LENGTH));
}

export function escapeForPrompt(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}
