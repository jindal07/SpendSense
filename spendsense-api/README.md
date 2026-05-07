# SpendSense API

Backend API for the SpendSense expense tracker — built with Node.js, Express, and Neon Postgres.

## Tech Stack

- **Runtime**: Node.js 18+ (ESM)
- **Framework**: Express.js
- **Database**: Neon Postgres (`@neondatabase/serverless`)
- **Deployment**: Vercel Serverless Functions

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your **Neon Postgres** connection string:

```env
DATABASE_URL=postgresql://user:password@your-host.neon.tech/neondb?sslmode=require
CORS_ORIGIN=http://localhost:5173
PORT=3001
```

### 3. Set up Neon Postgres

1. Go to [neon.tech](https://neon.tech) and create a free project
2. Copy the connection string from the dashboard
3. Paste it as `DATABASE_URL` in your `.env`

### 4. Initialize the database

```bash
npm run db:init
```

### 5. Seed default categories

```bash
npm run db:seed
```

### 6. Start the dev server

```bash
npm run dev
```

The API will be available at `http://localhost:3001`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/health/db` | Database connectivity check |
| GET | `/api/categories` | List all categories |
| POST | `/api/categories` | Create a category |
| GET | `/api/transactions?limit=&cursor=` | List transactions (paginated) |
| POST | `/api/transactions` | Create a transaction |
| DELETE | `/api/transactions/:id` | Delete a transaction |
| GET | `/api/stats?from=&to=` | Get spending statistics |

## Deploying to Vercel

1. Push the `spendsense-api` folder to a Git repository
2. Import the repo in [Vercel](https://vercel.com)
3. Set environment variables:
   - `DATABASE_URL` — your Neon connection string
   - `CORS_ORIGIN` — your frontend deployment URL
4. Deploy — Vercel will use `vercel.json` to route all `/api/*` requests

### Post-deploy

Run these commands locally (with `DATABASE_URL` set) to initialize the production database:

```bash
npm run db:init
npm run db:seed
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Neon Postgres connection string |
| `CORS_ORIGIN` | ❌ | Allowed origin for CORS (defaults to `*`) |
| `PORT` | ❌ | Local dev server port (defaults to `3001`) |
