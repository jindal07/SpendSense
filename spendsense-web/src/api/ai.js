import { request } from './client';

export function fetchAiKey() {
  return request('/api/ai/key');
}

export function saveAiKey(key) {
  return request('/api/ai/key', { method: 'POST', body: JSON.stringify({ key }) });
}

export function deleteAiKey() {
  return request('/api/ai/key', { method: 'DELETE' });
}

export function fetchAiUsage() {
  return request('/api/ai/usage');
}

export function recordAiConsent() {
  return request('/api/ai/consent', { method: 'POST' });
}

export function suggestCategory({ note }) {
  return request('/api/ai/suggest-category', {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

export function parseExpense({ transcript }) {
  return request('/api/ai/parse-expense', {
    method: 'POST',
    body: JSON.stringify({ transcript }),
  });
}

export function parseExpenseAudio(file) {
  const form = new FormData();
  form.append('audio', file);
  return request('/api/ai/parse-expense-audio', { method: 'POST', body: form });
}

export function scanReceipt(file) {
  const form = new FormData();
  form.append('file', file);
  return request('/api/ai/scan-receipt', { method: 'POST', body: form });
}

export function fetchConversations() {
  return request('/api/ai/conversations');
}

export function patchSettings(data) {
  return request('/api/me/settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/** SSE chat stream */
export async function streamChat({ message, conversationId, onEvent, signal }) {
  const { fetchEventSource } = await import('@microsoft/fetch-event-source');

  await fetchEventSource(`${BASE}/api/ai/chat`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationId }),
    signal,
    async onopen(response) {
      if (response.ok) return;
      const body = await response.json().catch(() => ({}));
      const err = new Error(
        body.message ||
          (Array.isArray(body.messages) ? body.messages.join(', ') : null) ||
          `Chat failed (${response.status})`
      );
      err.status = response.status;
      err.body = body;
      throw err;
    },
    onmessage(ev) {
      if (!ev.data) return;
      try {
        const data = JSON.parse(ev.data);
        onEvent(ev.event || 'message', data);
      } catch {
        /* ignore */
      }
    },
    onerror(err) {
      throw err;
    },
  });
}
