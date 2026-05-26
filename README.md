# SpendSense Expense Tracker

A full-stack expense tracker with:
- Manual expense + category management
- AI-powered receipt + voice expense parsing (BYOK: users bring their own Gemini key)
- An “AI Coach” chat that analyzes your spending using your stored data

This repo contains two apps:
- `spendsense-api` (Express + Neon Postgres)
- `spendsense-web` (React PWA + Tailwind)

## Repo Layout
- `spendsense-api/` - backend API
- `spendsense-web/` - frontend web app

## Quick Links
- Backend README: [`spendsense-api/README.md`](./spendsense-api/README.md)
- Frontend README: [`spendsense-web/README.md`](./spendsense-web/README.md)

## Local Development (Recommended)

### 1) Backend
1. `cd spendsense-api`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment:
   ```bash
   cp .env.example .env
   ```
   Required variables:
   - `DATABASE_URL` (Neon Postgres)
   - `ENCRYPTION_KEY` (used to encrypt Gemini API keys)
   - `CORS_ORIGIN` (your frontend origin, e.g. `http://localhost:5173`)

4. Initialize DB:
   ```bash
   npm run db:init
   npm run db:seed
   ```
5. Start API:
   ```bash
   npm run dev
   ```

### 2) Frontend
1. `cd spendsense-web`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `VITE_API_BASE_URL` (create an `.env` file in `spendsense-web/`):
   ```env
   VITE_API_BASE_URL=http://localhost:3001
   ```
4. Start dev server:
   ```bash
   npm run dev
   ```

## Gemini / AI Setup (BYOK)
- The frontend and backend are designed for users to provide their own Gemini API key.
- Add/update/delete your Gemini key from the app’s **Settings** tab.
- AI usage is tracked per user server-side.

## Render + Neon Free-Tier “Keep Awake” (Optional)
On free tiers, services can sleep after inactivity.

The backend supports a keep-alive ping:
- In `spendsense-api/src/app.js`, the server periodically calls:
  - `GET /api/health/db`
- This wakes **both** the Render service (via HTTP) and Neon (via a DB query).

To enable it, set in the API service environment:
- `RENDER_EXTERNAL_URL=https://your-service.onrender.com`

The ping runs every ~4 minutes and is best-effort (failures are silent).

## Authentication
- Session-based auth using an encrypted session cookie.
- Session validity is controlled by `expires_at` in the `sessions` table.

## Notes
- If you deploy the web and API to different origins, ensure CORS and cookie settings match your setup.
- The existing folder-level READMEs contain more deployment details.

