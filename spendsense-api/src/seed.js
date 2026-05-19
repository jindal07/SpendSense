/**
 * @deprecated Categories are seeded per-user on signup (see routes/auth.js).
 * Use `npm run db:reset` to apply the multi-tenant schema, then sign up via the app.
 */
import 'dotenv/config';

console.log(
  'ℹ️  db:seed is no longer used — categories are created automatically when a user signs up.\n' +
    '   Run `npm run db:reset` to reset the schema, then create an account in the app.'
);
