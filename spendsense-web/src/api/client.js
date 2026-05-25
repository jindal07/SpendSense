const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Reusable fetch wrapper with centralised error handling.
 */
export async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const isFormData = options.body instanceof FormData;
  const res = await fetch(url, {
    credentials: 'include',
    headers: isFormData
      ? { ...options.headers }
      : { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (
    res.status === 401 &&
    !path.startsWith('/api/auth/') &&
    path !== '/api/me'
  ) {
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      body.message ||
      (Array.isArray(body.messages) ? body.messages.join(', ') : null) ||
      body.error ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return res.json();
}

// ——— Auth ———

export function fetchMe() {
  return request('/api/me');
}

export function signup(data) {
  return request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function login(data) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function logout() {
  return request('/api/auth/logout', { method: 'POST' });
}

export function logoutAll() {
  return request('/api/auth/logout-all', { method: 'POST' });
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
