import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import transactionsRouter from './routes/transactions.js';
import categoriesRouter from './routes/categories.js';
import statsRouter from './routes/stats.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '100kb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
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
