import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { createCategorySchema } from '../lib/validators.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const items = await prisma.category.findMany({
      orderBy: { createdAt: 'asc' },
    });
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
    try {
      const created = await prisma.category.create({ data: parsed.data });
      res.status(201).json(created);
    } catch (err) {
      if (err?.code === 'P2002') {
        return res.status(409).json({ error: 'Category already exists' });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

export default router;
