const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';

function timestamp() {
  return new Date().toISOString();
}

function formatErr(err) {
  if (!(err instanceof Error)) {
    return String(err);
  }
  let message = err.message || '';
  if (message.startsWith('{') && message.length > 300) {
    try {
      const parsed = JSON.parse(message);
      message = parsed?.error?.message ?? message.slice(0, 300) + '…';
    } catch {
      message = message.slice(0, 300) + '…';
    }
  }
  const lines = [
    `${RED}${err.name || 'Error'}${RESET}: ${message}`,
  ];
  if (err.status) lines.push(`${DIM}  status:${RESET} ${err.status}`);
  if (err.code) lines.push(`${DIM}  code:${RESET} ${err.code}`);
  if (err.stack) {
    lines.push(`${DIM}  stack:${RESET}`);
    lines.push(
      err.stack
        .split('\n')
        .slice(1)
        .map((line) => `    ${line}`)
        .join('\n')
    );
  }
  return lines.join('\n');
}

export function logError(label, err, context = {}) {
  const ctx = Object.entries(context)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');

  console.error(`\n${RED}━━━ ${label} ━━━${RESET} ${DIM}${timestamp()}${RESET}`);
  if (ctx) console.error(`${CYAN}  ${ctx}${RESET}`);
  console.error(formatErr(err));
  console.error('');
}

export function logWarn(message, context = {}) {
  const ctx = Object.entries(context)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');
  console.warn(`${YELLOW}⚠ ${message}${RESET}${ctx ? ` ${DIM}${ctx}${RESET}` : ''}`);
}

export function logRequestError(req, err, status) {
  logError('API ERROR', err, {
    method: req.method,
    path: req.originalUrl || req.url,
    status,
    userId: req.userId ?? '—',
  });
}
