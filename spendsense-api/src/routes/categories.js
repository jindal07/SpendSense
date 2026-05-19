import { Router } from 'express';
import { getDb } from '../lib/db.js';

const router = Router();

// GET /api/categories
router.get('/', async (_req, res, next) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, name, color
      FROM categories
      ORDER BY name ASC
    `;
    // Categories change rarely — let the browser/CDN cache for 5 minutes
    // with a longer stale-while-revalidate window for smoother navigation.
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    res.json({ items: rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/categories
router.post('/', async (req, res, next) => {
  try {
    const { name, color } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Name is required and must be a non-empty string',
      });
    }
    if (!color || typeof color !== 'string') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Color is required',
      });
    }

    const sql = getDb();
    const rows = await sql`
      INSERT INTO categories (name, color)
      VALUES (${name.trim()}, ${color})
      RETURNING id, name, color
    `;

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A category with this name already exists',
      });
    }
    next(err);
  }
});

export default router;
