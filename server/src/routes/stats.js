import { Router } from 'express';
import { sql } from '../lib/db.js';
import { statsSchema } from '../lib/validators.js';

const router = Router();

function defaultRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
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

    const [totalRows, byCategoryRows, categoryRows, dailyRows, monthlyRows] =
      await Promise.all([
        sql`
          SELECT COALESCE(SUM(amount), 0)::float AS total
          FROM "Transaction"
          WHERE date >= ${from} AND date <= ${to}
        `,
        sql`
          SELECT category, COALESCE(SUM(amount), 0)::float AS total
          FROM "Transaction"
          WHERE date >= ${from} AND date <= ${to}
          GROUP BY category
        `,
        sql`SELECT name, color FROM "Category"`,
        sql`
          SELECT date_trunc('day', date) AS day,
                 COALESCE(SUM(amount), 0)::float AS total
          FROM "Transaction"
          WHERE date >= ${from} AND date <= ${to}
          GROUP BY day
          ORDER BY day ASC
        `,
        sql`
          SELECT date_trunc('month', date) AS month,
                 COALESCE(SUM(amount), 0)::float AS total
          FROM "Transaction"
          WHERE date >= (CURRENT_DATE - INTERVAL '6 months')
          GROUP BY month
          ORDER BY month ASC
        `,
      ]);

    const colorByName = new Map(categoryRows.map((c) => [c.name, c.color]));
    const byCategory = byCategoryRows
      .map((row) => ({
        category: row.category,
        total: Number(row.total ?? 0),
        color: colorByName.get(row.category) ?? '#6366F1',
      }))
      .sort((a, b) => b.total - a.total);

    const dailyTrend = dailyRows.map((r) => ({
      date: r.day,
      total: Number(r.total ?? 0),
    }));
    const monthlyTotals = monthlyRows.map((r) => ({
      month: r.month,
      total: Number(r.total ?? 0),
    }));

    res.json({
      range: { from, to },
      total: Number(totalRows[0]?.total ?? 0),
      byCategory,
      dailyTrend,
      monthlyTotals,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
