import { Router } from 'express';
import { getDb } from '../lib/db.js';

const router = Router();

// GET /api/stats?from=&to=
router.get('/', async (req, res, next) => {
  try {
    const sql = getDb();
    const { from, to } = req.query;

    // Default to current month if not specified
    const now = new Date();
    const fromDate = from || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const toDate = to || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    // Run all queries in parallel to avoid serverless timeouts
    const [totalResult, byCategory, dailyTrend, monthlyTotals] = await Promise.all([
      // Total spending in range
      sql`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM transactions
        WHERE date >= ${fromDate} AND date <= ${toDate}
      `,
      // Spending by category
      sql`
        SELECT
          t.category,
          COALESCE(c.color, '#94a3b8') as color,
          SUM(t.amount) as total,
          COUNT(*)::int as count
        FROM transactions t
        LEFT JOIN categories c ON c.name = t.category
        WHERE t.date >= ${fromDate} AND t.date <= ${toDate}
        GROUP BY t.category, c.color
        ORDER BY total DESC
      `,
      // Daily trend
      sql`
        SELECT
          TO_CHAR(date, 'YYYY-MM-DD') as day,
          SUM(amount) as total
        FROM transactions
        WHERE date >= ${fromDate} AND date <= ${toDate}
        GROUP BY TO_CHAR(date, 'YYYY-MM-DD')
        ORDER BY day ASC
      `,
      // Monthly totals (last 6 months)
      sql`
        SELECT
          TO_CHAR(date, 'YYYY-MM') as month,
          SUM(amount) as total
        FROM transactions
        WHERE date >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(date, 'YYYY-MM')
        ORDER BY month ASC
      `,
    ]);

    res.json({
      total: Number(totalResult[0].total),
      byCategory,
      dailyTrend,
      monthlyTotals,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
