import { Router } from 'express';
import { getDb, withTimeout } from '../lib/db.js';

const router = Router();

// GET /api/stats?from=&to=
router.get('/', async (req, res, next) => {
  try {
    const sql = getDb();
    const { from, to } = req.query;
    const userId = req.userId;

    const now = new Date();
    const fromDate = from || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const toDate =
      to ||
      new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    const rows = await withTimeout(sql`
      WITH
        filtered AS (
          SELECT amount, category, date
          FROM transactions
          WHERE user_id = ${userId}
            AND date >= ${fromDate}::timestamptz
            AND date <= ${toDate}::timestamptz
        ),
        total_cte AS (
          SELECT
            COALESCE(SUM(amount), 0)::float8 AS total,
            COUNT(*)::int                    AS count
          FROM filtered
        ),
        by_category_cte AS (
          SELECT json_agg(row_to_json(sub) ORDER BY sub.total DESC) AS data
          FROM (
            SELECT
              f.category                       AS category,
              COALESCE(c.color, '#94a3b8')     AS color,
              SUM(f.amount)::float8            AS total,
              COUNT(*)::int                    AS count
            FROM filtered f
            LEFT JOIN categories c
              ON c.name = f.category AND c.user_id = ${userId}
            GROUP BY f.category, c.color
          ) sub
        ),
        daily_cte AS (
          SELECT json_agg(row_to_json(sub) ORDER BY sub.day ASC) AS data
          FROM (
            SELECT
              TO_CHAR(date_trunc('day', date), 'YYYY-MM-DD') AS day,
              SUM(amount)::float8                            AS total
            FROM filtered
            GROUP BY date_trunc('day', date)
          ) sub
        ),
        monthly_cte AS (
          SELECT json_agg(row_to_json(sub) ORDER BY sub.month ASC) AS data
          FROM (
            SELECT
              TO_CHAR(date_trunc('month', date), 'YYYY-MM') AS month,
              SUM(amount)::float8                           AS total
            FROM transactions
            WHERE user_id = ${userId}
              AND date >= NOW() - INTERVAL '6 months'
            GROUP BY date_trunc('month', date)
          ) sub
        )
      SELECT
        t.total,
        t.count,
        COALESCE(bc.data, '[]'::json) AS "byCategory",
        COALESCE(d.data,  '[]'::json) AS "dailyTrend",
        COALESCE(m.data,  '[]'::json) AS "monthlyTotals"
      FROM total_cte t, by_category_cte bc, daily_cte d, monthly_cte m
    `);

    const result = rows[0];
    res.json({
      total: Number(result.total),
      count: Number(result.count),
      byCategory: result.byCategory,
      dailyTrend: result.dailyTrend,
      monthlyTotals: result.monthlyTotals,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
