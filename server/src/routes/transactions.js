import { Router } from 'express';
import { sql } from '../lib/db.js';
import {
  createTransactionSchema,
  listTransactionsSchema,
} from '../lib/validators.js';

const router = Router();

/**
 * GET /api/transactions
 *
 * Keyset pagination: the client passes `cursor = lastRow.id`. We fetch the
 * cursor row's (date, createdAt, id) and return every row that sorts AFTER
 * it in (date DESC, createdAt DESC, id DESC) order.
 */
router.get('/', async (req, res, next) => {
  try {
    const parsed = listTransactionsSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { from, to, category, limit, cursor } = parsed.data;

    let cursorRow = null;
    if (cursor) {
      const rows = await sql`
        SELECT date, "createdAt", id
        FROM "Transaction"
        WHERE id = ${cursor}
        LIMIT 1
      `;
      cursorRow = rows[0] ?? null;
      if (!cursorRow) {
        return res.json({ items: [], nextCursor: null });
      }
    }

    const fromParam = from ?? null;
    const toParam = to ?? null;
    const categoryParam = category ?? null;
    const takeLimit = limit + 1;

    let items;
    if (cursorRow) {
      items = await sql`
        SELECT id, amount, category, date, note, "createdAt"
        FROM "Transaction"
        WHERE
          (${fromParam}::timestamptz IS NULL OR date >= ${fromParam}::timestamptz)
          AND (${toParam}::timestamptz IS NULL OR date <= ${toParam}::timestamptz)
          AND (${categoryParam}::text IS NULL OR category = ${categoryParam}::text)
          AND (date, "createdAt", id)
              < (${cursorRow.date}::timestamptz,
                 ${cursorRow.createdAt}::timestamptz,
                 ${cursorRow.id}::text)
        ORDER BY date DESC, "createdAt" DESC, id DESC
        LIMIT ${takeLimit}
      `;
    } else {
      items = await sql`
        SELECT id, amount, category, date, note, "createdAt"
        FROM "Transaction"
        WHERE
          (${fromParam}::timestamptz IS NULL OR date >= ${fromParam}::timestamptz)
          AND (${toParam}::timestamptz IS NULL OR date <= ${toParam}::timestamptz)
          AND (${categoryParam}::text IS NULL OR category = ${categoryParam}::text)
        ORDER BY date DESC, "createdAt" DESC, id DESC
        LIMIT ${takeLimit}
      `;
    }

    let nextCursor = null;
    if (items.length > limit) {
      items.pop(); // drop the peek-ahead row
      nextCursor = items[items.length - 1].id;
    }

    res.json({ items, nextCursor });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const parsed = createTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { amount, category, date, note } = parsed.data;
    const effectiveDate = date ?? new Date();

    const rows = await sql`
      INSERT INTO "Transaction" (amount, category, date, note)
      VALUES (${amount}, ${category}, ${effectiveDate}, ${note ?? null})
      RETURNING id, amount, category, date, note, "createdAt"
    `;
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const rows = await sql`
      DELETE FROM "Transaction" WHERE id = ${id} RETURNING id
    `;
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
