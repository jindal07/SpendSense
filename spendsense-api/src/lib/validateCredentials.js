const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCredentials(body) {
  const errors = [];
  const email =
    typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const name =
    typeof body?.name === 'string' && body.name.trim()
      ? body.name.trim()
      : null;

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    errors.push('A valid email address is required');
  }
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (password.length > 200) {
    errors.push('Password must be at most 200 characters');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, email, password, name };
}
