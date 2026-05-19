import { Router } from 'express';
import { getDb } from '../lib/db.js';

const router = Router();

// GET /api/categories
router.get('/', async (req, res, next) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, name, color
      FROM categories
      WHERE user_id = ${req.userId}
      ORDER BY name ASC
    `;
    res.set('Cache-Control', 'private, no-cache');
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
      INSERT INTO categories (user_id, name, color)
      VALUES (${req.userId}, ${name.trim()}, ${color})
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
