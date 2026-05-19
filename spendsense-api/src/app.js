import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import categoryRoutes from './routes/categories.js';
import transactionRoutes from './routes/transactions.js';
import statsRoutes from './routes/stats.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requireAuth, requireSameOrigin } from './middleware/auth.js';
import { getAllowedOrigins } from './lib/corsOrigins.js';
import { usesCrossSiteCookies } from './lib/session.js';

const app = express();

const allowedOrigins = getAllowedOrigins();

app.set('trust proxy', 1);

app.use(
  cors({
    origin: (origin, cb) => {
      // No Origin header (curl, same-origin) — reflect nothing special
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) {
        // Must return the exact origin string when credentials: true
        return cb(null, origin);
      }
      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  })
);

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    service: 'SpendSense API',
    status: 'running',
    docs: '/api/health',
  });
});

// Public routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

// Protected routes (session cookie required)
const protectedMiddleware = [requireAuth, requireSameOrigin];

app.use('/api/me', ...protectedMiddleware, meRoutes);
app.use('/api/categories', ...protectedMiddleware, categoryRoutes);
app.use('/api/transactions', ...protectedMiddleware, transactionRoutes);
app.use('/api/stats', ...protectedMiddleware, statsRoutes);

app.use(notFound);
app.use(errorHandler);

// Skip listen when bundled for Vercel serverless (api/index.js)
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 SpendSense API running on port ${PORT}`);
    if (process.env.NODE_ENV === 'production') {
      console.log(`   CORS origins: ${allowedOrigins.join(', ')}`);
      console.log(`   Cross-site cookies: ${usesCrossSiteCookies() ? 'enabled (SameSite=None)' : 'disabled (SameSite=Lax)'}`);
    }
  });
}

export default app;
