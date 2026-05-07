const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Reusable fetch wrapper with centralised error handling.
 */
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.message || body.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return res.json();
}

// ——— Categories ———

export function fetchCategories() {
  return request('/api/categories');
}

export function createCategory(data) {
  return request('/api/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ——— Transactions ———

export function fetchTransactions({ limit = 20, cursor } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  return request(`/api/transactions?${params}`);
}

export function createTransaction(data) {
  return request('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteTransaction(id) {
  return request(`/api/transactions/${id}`, { method: 'DELETE' });
}

// ——— Stats ———

export function fetchStats({ from, to } = {}) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return request(`/api/stats${qs ? `?${qs}` : ''}`);
}
