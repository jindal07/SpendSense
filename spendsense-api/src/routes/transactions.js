import { Router } from 'express';
import { getDb, withTimeout } from '../lib/db.js';
import { parsePaginationParams } from '../utils/pagination.js';

const router = Router();

// GET /api/transactions?limit=&cursor=
router.get('/', async (req, res, next) => {
  try {
    const { limit, cursor } = parsePaginationParams(req.query);
    const sql = getDb();

    let rows;
    if (cursor) {
      // Keyset pagination using a lateral subquery for the cursor row.
      // This lets Postgres resolve the cursor values once and use the
      // composite (createdAt DESC, id DESC) index directly.
      rows = await withTimeout(sql`
        SELECT t.* FROM transactions t
        WHERE (t."createdAt", t.id) < (
          SELECT "createdAt", id FROM transactions WHERE id = ${cursor}
        )
        ORDER BY t."createdAt" DESC, t.id DESC
        LIMIT ${limit + 1}
      `);
    } else {
      rows = await withTimeout(sql`
        SELECT * FROM transactions
        ORDER BY "createdAt" DESC, id DESC
        LIMIT ${limit + 1}
      `);
    }

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    res.json({ items, nextCursor, hasMore });
  } catch (err) {
    next(err);
  }
});

// POST /api/transactions
router.post('/', async (req, res, next) => {
  try {
    const { amount, category, date, note } = req.body;

    // Validation
    const errors = [];
    if (amount === undefined || amount === null || typeof amount !== 'number' || amount <= 0) {
      errors.push('Amount must be a positive number');
    }
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      errors.push('Category is required');
    }
    if (!date) {
      errors.push('Date is required');
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation Error', messages: errors });
    }

    const sql = getDb();
    const rows = await withTimeout(sql`
      INSERT INTO transactions (amount, category, date, note)
      VALUES (${amount}, ${category.trim()}, ${date}, ${note || null})
      RETURNING *
    `);

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = getDb();

    const rows = await withTimeout(sql`
      DELETE FROM transactions WHERE id = ${id} RETURNING id
    `);

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Transaction not found',
      });
    }

    res.json({ deleted: true, id });
  } catch (err) {
    next(err);
  }
});

export default router;
