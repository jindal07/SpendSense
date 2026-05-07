import { Router } from 'express';
import { getDb } from '../lib/db.js';

const router = Router();

// GET /api/health — basic health check
router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'spendsense-api',
  });
});

// GET /api/health/db — database connectivity check
router.get('/db', async (_req, res, next) => {
  try {
    const sql = getDb();
    const result = await sql`SELECT NOW() as time`;
    res.json({
      status: 'ok',
      database: 'connected',
      serverTime: result[0].time,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
