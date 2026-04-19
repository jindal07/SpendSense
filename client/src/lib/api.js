const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const message =
      data?.error?.formErrors?.[0] ||
      data?.error?.fieldErrors?.[Object.keys(data?.error?.fieldErrors ?? {})[0]]?.[0] ||
      (typeof data?.error === 'string' ? data.error : null) ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const api = {
  getTransactions(params = {}) {
    const qs = buildQuery(params);
    return request(`/transactions${qs}`);
  },
  createTransaction(body) {
    return request('/transactions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  deleteTransaction(id) {
    return request(`/transactions/${id}`, { method: 'DELETE' });
  },
  getCategories() {
    return request('/categories');
  },
  createCategory(body) {
    return request('/categories', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  getStats(params = {}) {
    const qs = buildQuery(params);
    return request(`/stats${qs}`);
  },
};

function buildQuery(params) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (entries.length === 0) return '';
  const qs = new URLSearchParams();
  for (const [k, v] of entries) {
    qs.set(k, v instanceof Date ? v.toISOString() : String(v));
  }
  return `?${qs.toString()}`;
}
