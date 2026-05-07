# SpendSense Web

Frontend for the SpendSense expense tracker — a modern, mobile-first PWA built with React.

## Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS v3, shadcn/ui components
- **Charts**: Recharts
- **State**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **PWA**: vite-plugin-pwa

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_BASE_URL=http://localhost:3001
```

### 3. Start dev server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Building for Production

```bash
npm run build
npm run preview   # preview the build locally
```

## Deploying to Vercel

1. Push the `spendsense-web` folder to a Git repository
2. Import the repo in [Vercel](https://vercel.com)
3. Set the environment variable:
   - `VITE_API_BASE_URL` — your backend deployment URL (e.g. `https://spendsense-api.vercel.app`)
4. Deploy — Vercel auto-detects Vite

## PWA Install

After deploying:

1. Open the app in Chrome (mobile or desktop)
2. You'll see an "Install" prompt or use the browser menu → "Add to Home Screen"
3. The app will run standalone like a native app

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | ✅ | Backend API URL (no trailing slash) |
