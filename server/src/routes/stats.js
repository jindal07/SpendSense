import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { statsSchema } from '../lib/validators.js';

const router = Router();

// Default range: current calendar month.
function defaultRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from, to };
}

router.get('/', async (req, res, next) => {
  try {
    const parsed = statsSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const defaults = defaultRange();
    const from = parsed.data.from ?? defaults.from;
    const to = parsed.data.to ?? defaults.to;

    const where = { date: { gte: from, lte: to } };

    const [totalAgg, byCategoryAgg, categories, dailyRaw, monthlyRaw] =
      await Promise.all([
        prisma.transaction.aggregate({ where, _sum: { amount: true } }),
        prisma.transaction.groupBy({
          by: ['category'],
          where,
          _sum: { amount: true },
        }),
        prisma.category.findMany(),
        // Daily trend for the requested range.
        prisma.$queryRaw`
          SELECT date_trunc('day', "date") AS day, SUM("amount")::float AS total
          FROM "Transaction"
          WHERE "date" >= ${from} AND "date" <= ${to}
          GROUP BY day
          ORDER BY day ASC
        `,
        // Monthly totals for the last 6 months (independent of the filter).
        prisma.$queryRaw`
          SELECT date_trunc('month', "date") AS month, SUM("amount")::float AS total
          FROM "Transaction"
          WHERE "date" >= (CURRENT_DATE - INTERVAL '6 months')
          GROUP BY month
          ORDER BY month ASC
        `,
      ]);

    const colorByName = new Map(categories.map((c) => [c.name, c.color]));
    const byCategory = byCategoryAgg
      .map((row) => ({
        category: row.category,
        total: row._sum.amount ?? 0,
        color: colorByName.get(row.category) ?? '#6366F1',
      }))
      .sort((a, b) => b.total - a.total);

    const dailyTrend = dailyRaw.map((r) => ({
      date: r.day,
      total: Number(r.total ?? 0),
    }));

    const monthlyTotals = monthlyRaw.map((r) => ({
      month: r.month,
      total: Number(r.total ?? 0),
    }));

    res.json({
      range: { from, to },
      total: totalAgg._sum.amount ?? 0,
      byCategory,
      dailyTrend,
      monthlyTotals,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
