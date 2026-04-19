import { Router } from 'express';
import prisma from '../lib/prisma.js';
import {
  createTransactionSchema,
  listTransactionsSchema,
} from '../lib/validators.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const parsed = listTransactionsSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { from, to, category, limit, cursor } = parsed.data;

    const where = {};
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = from;
      if (to) where.date.lte = to;
    }
    if (category) where.category = category;

    const items = await prisma.transaction.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    let nextCursor = null;
    if (items.length > limit) {
      const next = items.pop();
      nextCursor = next.id;
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

    const txn = await prisma.transaction.create({
      data: {
        amount,
        category,
        date: date ?? new Date(),
        note: note ?? null,
      },
    });
    res.status(201).json(txn);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    try {
      await prisma.transaction.delete({ where: { id } });
    } catch (err) {
      // Prisma throws P2025 if the record doesn't exist.
      if (err?.code === 'P2025') {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      throw err;
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
