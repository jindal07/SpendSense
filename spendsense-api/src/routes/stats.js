import { Router } from 'express';
import { getDb, withTimeout } from '../lib/db.js';

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

    // Single query using CTEs — 1 round-trip instead of 4
    const rows = await withTimeout(sql`
      WITH
        filtered AS (
          SELECT amount, category, date
          FROM transactions
          WHERE date >= ${fromDate} AND date <= ${toDate}
        ),
        total_cte AS (
          SELECT COALESCE(SUM(amount), 0) AS total FROM filtered
        ),
        by_category_cte AS (
          SELECT
            json_agg(
              json_build_object(
                'category', sub.category,
                'color', sub.color,
                'total', sub.total,
                'count', sub.count
              ) ORDER BY sub.total DESC
            ) AS data
          FROM (
            SELECT
              f.category,
              COALESCE(c.color, '#94a3b8') AS color,
              SUM(f.amount) AS total,
              COUNT(*)::int AS count
            FROM filtered f
            LEFT JOIN categories c ON c.name = f.category
            GROUP BY f.category, c.color
          ) sub
        ),
        daily_cte AS (
          SELECT
            json_agg(
              json_build_object('day', sub.day, 'total', sub.total)
              ORDER BY sub.day ASC
            ) AS data
          FROM (
            SELECT TO_CHAR(date, 'YYYY-MM-DD') AS day, SUM(amount) AS total
            FROM filtered
            GROUP BY TO_CHAR(date, 'YYYY-MM-DD')
          ) sub
        ),
        monthly_cte AS (
          SELECT
            json_agg(
              json_build_object('month', sub.month, 'total', sub.total)
              ORDER BY sub.month ASC
            ) AS data
          FROM (
            SELECT TO_CHAR(date, 'YYYY-MM') AS month, SUM(amount) AS total
            FROM transactions
            WHERE date >= NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(date, 'YYYY-MM')
          ) sub
        )
      SELECT
        t.total,
        COALESCE(bc.data, '[]'::json) AS "byCategory",
        COALESCE(d.data,  '[]'::json) AS "dailyTrend",
        COALESCE(m.data,  '[]'::json) AS "monthlyTotals"
      FROM total_cte t, by_category_cte bc, daily_cte d, monthly_cte m
    `);

    const result = rows[0];
    res.json({
      total: Number(result.total),
      byCategory: result.byCategory,
      dailyTrend: result.dailyTrend,
      monthlyTotals: result.monthlyTotals,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
