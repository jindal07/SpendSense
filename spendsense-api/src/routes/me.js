import { Router } from 'express';
import { getDb, withTimeout } from '../lib/db.js';

const router = Router();

// GET /api/me
router.get('/', async (req, res, next) => {
  try {
    const sql = getDb();
    const rows = await withTimeout(sql`
      SELECT id, email, name, created_at AS "createdAt"
      FROM users
      WHERE id = ${req.userId}
      LIMIT 1
    `);

    if (!rows.length) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
    }

    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
