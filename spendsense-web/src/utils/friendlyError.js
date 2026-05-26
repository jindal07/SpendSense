const STATUS_MESSAGES = {
  400: 'Something was wrong with the request. Please check and try again.',
  401: 'Your session has expired. Please log in again.',
  403: 'You don\'t have permission for this action.',
  404: 'The requested resource was not found.',
  409: 'This conflicts with existing data.',
  412: 'Set up your Gemini API key in Settings to use AI features.',
  413: 'The file is too large. Please use a smaller file (under 5 MB).',
  422: 'AI couldn\'t process this. Try again with a clearer image or input.',
  429: 'Too many requests — you\'ve hit the AI usage limit. Please wait a moment.',
  500: 'Something went wrong on our end. Please try again.',
  502: 'The AI service had a hiccup. Please try again.',
  503: 'The AI model is busy right now. Please try again in a minute.',
  504: 'The AI request took too long. Please try again.',
};

const CODE_MESSAGES = {
  GEMINI_UNAVAILABLE: 'The AI model is experiencing high demand. Try again in a minute.',
  GEMINI_QUOTA_EXCEEDED: 'You\'ve hit the Gemini API limit. Wait a bit and try again.',
  GEMINI_AUTH: 'Your Gemini API key is invalid or expired. Update it in Settings.',
  GEMINI_BAD_REQUEST: 'Gemini couldn\'t handle this request. Try again or check your API key.',
  GEMINI_INTERNAL: 'Gemini ran into an internal error. Please try again.',
  GEMINI_MODEL_NOT_FOUND: 'This AI model isn\'t available with your API key.',
  AI_EMPTY_RESPONSE: 'AI returned an empty response. Try again with a clearer image.',
  AI_NON_JSON: 'Couldn\'t read data from the response. Try a clearer photo.',
  AI_BLOCKED: 'This content was blocked by the AI safety filter. Try a different image.',
  AI_MALFORMED_JSON: 'AI response was garbled. Please try again.',
};

const PATTERN_MESSAGES = [
  [/high demand|overloaded|unavailable/i, 'The AI model is busy right now. Try again in a minute.'],
  [/quota|rate.?limit|too many/i, 'AI usage limit reached. Please wait and try again.'],
  [/timed?\s*out|timeout/i, 'The request took too long. Please try again.'],
  [/api.?key|unauthorized|forbidden/i, 'There\'s an issue with your API key. Check Settings.'],
  [/network|fetch|ERR_CONNECTION|ECONNREFUSED/i, 'Network error — check your internet connection and try again.'],
  [/file.*large|payload.*large/i, 'File is too large. Use a smaller file (under 5 MB).'],
];

export function friendlyError(err) {
  if (!err) return 'Something went wrong. Please try again.';

  const code = err.body?.code || err.code;
  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code];

  const status = err.status;
  const raw = err.message || '';

  for (const [pattern, msg] of PATTERN_MESSAGES) {
    if (pattern.test(raw)) return msg;
  }

  if (status && STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];

  if (raw && raw.length < 120 && !/^\{/.test(raw)) return raw;

  return 'Something went wrong. Please try again.';
}
