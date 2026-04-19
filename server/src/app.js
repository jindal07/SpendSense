import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import transactionsRouter from './routes/transactions.js';
import categoriesRouter from './routes/categories.js';
import statsRouter from './routes/stats.js';
import { sql } from './lib/db.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '100kb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    ts: new Date().toISOString(),
    region: process.env.VERCEL_REGION ?? null,
    hasDbUrl: Boolean(process.env.DATABASE_URL),
    dbHost: process.env.DATABASE_URL
      ? new URL(process.env.DATABASE_URL.replace('postgresql://', 'http://')).hostname
      : null,
  });
});

// Deep health: actually round-trips to Postgres so you can see whether the
// hang is Vercel→Neon connect or something else. Safe to leave in prod.
app.get('/api/health/db', async (_req, res) => {
  const started = Date.now();
  try {
    const rows = await sql`SELECT 1 AS ok`;
    res.json({ ok: rows?.[0]?.ok === 1, elapsedMs: Date.now() - started });
  } catch (err) {
    res.status(500).json({
      ok: false,
      elapsedMs: Date.now() - started,
      error: err?.message,
      code: err?.code ?? null,
    });
  }
});

app.use('/api/transactions', transactionsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/stats', statsRouter);

// Fallback 404 for unknown /api routes so the SPA rewrite can't swallow them.
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Centralized error handler.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[api error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
