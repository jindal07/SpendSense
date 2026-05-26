const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCredentials(body, opts = {}) {
  const requireName = Boolean(opts?.requireName);
  const errors = [];
  const email =
    typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const nameRaw = typeof body?.name === 'string' ? body.name.trim() : '';
  const name = nameRaw ? nameRaw : null;

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    errors.push('A valid email address is required');
  }
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (password.length > 200) {
    errors.push('Password must be at most 200 characters');
  }

  if (requireName) {
    if (!name) {
      errors.push('Name is required');
    } else if (name.length > 100) {
      errors.push('Name must be at most 100 characters');
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, email, password, name };
}
