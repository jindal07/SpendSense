import bcrypt from 'bcryptjs';

const COST = 12;
// Pre-computed hash used when the email is not found — keeps login timing constant.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', COST);

export function hashPassword(password) {
  return bcrypt.hash(password, COST);
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash ?? DUMMY_HASH);
}
