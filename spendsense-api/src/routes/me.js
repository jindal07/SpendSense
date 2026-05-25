import { Router } from 'express';
import { getDb, withTimeout } from '../lib/db.js';

const router = Router();

// GET /api/me
router.get('/', async (req, res, next) => {
  try {
    const sql = getDb();
    const rows = await withTimeout(sql`
      SELECT
        id,
        email,
        name,
        monthly_income AS "monthlyIncome",
        savings_goal_pct AS "savingsGoalPct",
        currency,
        ai_consent_at AS "aiConsentAt",
        created_at AS "createdAt"
      FROM users
      WHERE id = ${req.userId}
      LIMIT 1
    `);

    if (!rows.length) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
    }

    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/me/settings
router.patch('/settings', async (req, res, next) => {
  try {
    const { monthlyIncome, savingsGoalPct, currency } = req.body ?? {};
    const sql = getDb();

    const updates = [];
    if (monthlyIncome !== undefined) {
      const v = monthlyIncome === null ? null : Number(monthlyIncome);
      if (v !== null && (Number.isNaN(v) || v < 0)) {
        return res.status(400).json({ message: 'Invalid monthly income' });
      }
      await sql`UPDATE users SET monthly_income = ${v}, updated_at = now() WHERE id = ${req.userId}`;
    }
    if (savingsGoalPct !== undefined) {
      const v = savingsGoalPct === null ? null : Number(savingsGoalPct);
      if (v !== null && (Number.isNaN(v) || v < 0 || v > 100)) {
        return res.status(400).json({ message: 'Invalid savings goal' });
      }
      await sql`UPDATE users SET savings_goal_pct = ${v}, updated_at = now() WHERE id = ${req.userId}`;
    }
    if (currency !== undefined && typeof currency === 'string') {
      await sql`UPDATE users SET currency = ${currency.trim().toUpperCase()}, updated_at = now() WHERE id = ${req.userId}`;
    }

    const rows = await sql`
      SELECT
        id, email, name,
        monthly_income AS "monthlyIncome",
        savings_goal_pct AS "savingsGoalPct",
        currency,
        ai_consent_at AS "aiConsentAt",
        created_at AS "createdAt"
      FROM users WHERE id = ${req.userId}
    `;
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
