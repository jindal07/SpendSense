import { Router } from 'express';
import { getDb, withTimeout } from '../lib/db.js';
import { parsePaginationParams } from '../utils/pagination.js';

const router = Router();

function decodeCursor(cursor) {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const sep = decoded.lastIndexOf('|');
    if (sep === -1) return null;
    const createdAt = decoded.slice(0, sep);
    const id = decoded.slice(sep + 1);
    if (!createdAt || !id) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

function encodeCursor(row) {
  const createdAt =
    row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt;
  return Buffer.from(`${createdAt}|${row.id}`, 'utf8').toString('base64url');
}

// GET /api/transactions?limit=&cursor=
router.get('/', async (req, res, next) => {
  try {
    const { limit, cursor } = parsePaginationParams(req.query);
    const sql = getDb();
    const decoded = decodeCursor(cursor);
    const userId = req.userId;

    let rows;
    if (decoded) {
      rows = await withTimeout(sql`
        SELECT id, amount, category, date, note, "createdAt"
        FROM transactions
        WHERE user_id = ${userId}
          AND ("createdAt", id) < (${decoded.createdAt}::timestamptz, ${decoded.id})
        ORDER BY "createdAt" DESC, id DESC
        LIMIT ${limit + 1}
      `);
    } else {
      rows = await withTimeout(sql`
        SELECT id, amount, category, date, note, "createdAt"
        FROM transactions
        WHERE user_id = ${userId}
        ORDER BY "createdAt" DESC, id DESC
        LIMIT ${limit + 1}
      `);
    }

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? encodeCursor(items[items.length - 1]) : null;

    res.json({ items, nextCursor, hasMore });
  } catch (err) {
    next(err);
  }
});

// POST /api/transactions
router.post('/', async (req, res, next) => {
  try {
    const { amount, category, date, note } = req.body;

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
    const trimmed = category.trim();
    const userId = req.userId;

    const rows = await withTimeout(sql`
      WITH inserted AS (
        INSERT INTO transactions (user_id, amount, category, date, note)
        VALUES (${userId}, ${amount}, ${trimmed}, ${date}, ${note || null})
        RETURNING id, amount, category, date, note, "createdAt"
      )
      SELECT i.*, COALESCE(c.color, '#94a3b8') AS "categoryColor"
      FROM inserted i
      LEFT JOIN categories c
        ON c.name = i.category AND c.user_id = ${userId}
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
      DELETE FROM transactions
      WHERE id = ${id} AND user_id = ${req.userId}
      RETURNING id
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
