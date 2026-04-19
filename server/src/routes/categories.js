import { Router } from 'express';
import { sql } from '../lib/db.js';
import { createCategorySchema } from '../lib/validators.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const items = await sql`
      SELECT id, name, color, "createdAt"
      FROM "Category"
      ORDER BY "createdAt" ASC
    `;
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { name, color } = parsed.data;

    try {
      const rows = await sql`
        INSERT INTO "Category" (name, color)
        VALUES (${name}, ${color})
        RETURNING id, name, color, "createdAt"
      `;
      res.status(201).json(rows[0]);
    } catch (err) {
      // Postgres unique violation
      if (err?.code === '23505') {
        return res.status(409).json({ error: 'Category already exists' });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

export default router;
