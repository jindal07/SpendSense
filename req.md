You are a senior full-stack engineer. Build **SpendSense**, a production-ready **Expense Tracker Web App (mobile-first PWA)** from scratch as **two separate projects** so I can deploy them **separately on Vercel**:

* **Frontend**: React + Vite, Tailwind CSS, shadcn/ui (Radix), Recharts, TanStack Query, React Hook Form + Zod, PWA (vite-plugin-pwa)
* **Backend**: Node.js (ESM) + Express, deployed as **Vercel Serverless Functions**, using **Neon Postgres** via `@neondatabase/serverless` (NO Prisma)
* **Currency**: INR (₹), locale `en-IN`
* **No auth** (single-user)

The app should feel:

* modern
* minimal
* fast
* smooth on mobile
* visually polished like modern fintech apps

Use:

* glassmorphism cards
* subtle gradients
* rounded corners
* soft shadows
* smooth transitions
* responsive charts
* elegant empty states
* loading skeletons
* toast notifications

---

# PRODUCT REQUIREMENTS

## Core Features

* Add expense
* Delete expense
* View recent expenses
* Category-based analytics
* Daily and monthly spending trends
* Category management
* Pagination support
* PWA installable support

---

# BACKEND PROJECT

Create a separate backend project named:

`spendsense-api`

---

## Backend Stack

* Node.js 18+
* Express.js
* ESM modules
* Neon Postgres
* @neondatabase/serverless
* serverless-http
* CORS
* dotenv

---

## Backend Folder Structure

```txt
spendsense-api/
│
├── api/
│   └── index.js
│
├── src/
│   ├── app.js
│   ├── init-db.js
│   ├── seed.js
│   │
│   ├── lib/
│   │   ├── db.js
│   │   └── schema.sql
│   │
│   ├── routes/
│   │   ├── health.js
│   │   ├── categories.js
│   │   ├── transactions.js
│   │   └── stats.js
│   │
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── notFound.js
│   │
│   └── utils/
│       └── pagination.js
│
├── package.json
├── vercel.json
├── .env.example
└── README.md
```

---

## Backend Requirements

### package.json

Must include scripts:

* dev
* start
* db:init
* db:seed

Use:

* nodemon
* dotenv
* express
* cors
* serverless-http
* @neondatabase/serverless

---

## Database Setup

### src/lib/db.js

Create lazy singleton Neon connection:

```js
import { neon } from '@neondatabase/serverless'
```

Use:

```env
DATABASE_URL
```

---

## schema.sql

Create tables:

### Category

```sql
id text primary key default gen_random_uuid()::text
name text unique not null
color text not null
createdAt timestamptz default now()
```

### Transaction

```sql
id text primary key default gen_random_uuid()::text
amount double precision not null
category text not null
date timestamptz not null
note text
createdAt timestamptz default now()
```

Add indexes:

* createdAt
* date
* category
* pagination optimization indexes

---

## Database Init Script

### src/init-db.js

Requirements:

* Read schema.sql
* Execute safely
* Idempotent
* Heal missing defaults/types if tables exist

---

## Seed Script

### src/seed.js

Insert default categories:

* Food
* Travel
* Bills
* Shopping
* Health
* Entertainment
* Other

Use:

```sql
ON CONFLICT (name) DO UPDATE
```

Each category should have modern subtle colors.

---

# API ROUTES

## Health

```http
GET /api/health
GET /api/health/db
```

---

## Categories

```http
GET /api/categories
POST /api/categories
```

Return:

```json
{
  "items": []
}
```

---

## Transactions

```http
GET /api/transactions?limit=&cursor=
POST /api/transactions
DELETE /api/transactions/:id
```

### Features

* Keyset pagination
* Sorting by latest
* Validation
* Clear error responses

---

## Stats

```http
GET /api/stats?from=&to=
```

Return:

* total
* byCategory
* dailyTrend
* monthlyTotals

---

## Error Handling

Implement:

* centralized error middleware
* JSON responses
* validation errors
* DB error handling

---

## CORS

Allow:

```env
CORS_ORIGIN
```

---

## vercel.json

Configure:

* maxDuration: 30
* route all `/api/*`
* serverless function deployment

---

## Backend README

Must include:

* setup
* local development
* deployment steps
* Neon setup
* env variables
* running db:init and db:seed

---

# FRONTEND PROJECT

Create separate frontend project:

`spendsense-web`

---

# Frontend Stack

* React + Vite
* Tailwind CSS
* shadcn/ui
* TanStack Query
* React Hook Form
* Zod
* Recharts
* Framer Motion
* vite-plugin-pwa
* Lucide React

---

# Frontend Folder Structure

```txt
spendsense-web/
│
├── public/
│   ├── icons/
│   ├── manifest.webmanifest
│   └── offline.html
│
├── src/
│   ├── api/
│   │   └── client.js
│   │
│   ├── components/
│   │   ├── charts/
│   │   ├── forms/
│   │   ├── layout/
│   │   ├── ui/
│   │   └── transactions/
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Stats.jsx
│   │   └── History.jsx
│   │
│   ├── hooks/
│   ├── lib/
│   ├── utils/
│   ├── styles/
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── routes.jsx
│
├── package.json
├── vite.config.js
├── tailwind.config.js
├── .env.example
└── README.md
```

---

# FRONTEND FEATURES

## Dashboard Page

Show:

* total monthly spend
* recent transactions
* category pie chart
* quick stats cards

---

## Add Expense Modal

Use:

* React Hook Form
* Zod validation

Fields:

* amount
* category
* date
* note

If category = Other:

* show custom category input
* save that string as category

---

## Stats Page

Charts:

* Pie Chart
* Bar Chart
* Line Chart

Requirements:

* responsive
* mobile-safe
* smooth animations
* no overflow/clipping
* proper tooltip contrast

---

## History Page

Features:

* list transactions
* infinite scroll or pagination
* filters
* sorting
* delete expense

---

# UI REQUIREMENTS

## Style

Use:

* glass cards
* blurred backgrounds
* subtle gradients
* modern spacing
* smooth transitions
* fintech-inspired UI

---

## Layout

Bottom navigation:

* Home
* Add Expense FAB
* Stats

History accessible from top header.

---

## Colors

Use subtle palette:

* slate/dark background
* indigo primary
* emerald accent
* soft red danger

Avoid overly bright colors.

---

# STATE MANAGEMENT

Use:

* TanStack Query for API state
* optimistic updates
* loading skeletons
* retry handling

---

# PWA REQUIREMENTS

Use:

* vite-plugin-pwa

Include:

* manifest.webmanifest
* installable app
* offline fallback

Workbox config:

```js
skipWaiting: true
clientsClaim: true
cleanupOutdatedCaches: true
```

---

# API SERVICE LAYER

Use:

```env
VITE_API_BASE_URL
```

Create reusable API helpers:

* fetch wrapper
* typed responses
* centralized error handling

---

# INR FORMAT

Use:

```js
new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
})
```

---

# FRONTEND README

Must include:

* setup
* environment variables
* Vercel deployment
* PWA install instructions

---

# DEPLOYMENT INSTRUCTIONS

Write deployment instructions for both projects.

## Backend Deployment

* Deploy to Vercel
* Add:

  * DATABASE_URL
  * CORS_ORIGIN
* Run:

  * npm run db:init
  * npm run db:seed

---

## Frontend Deployment

Add:

```env
VITE_API_BASE_URL
```

Deploy separately on Vercel.

---

# IMPORTANT

* DO NOT use Prisma
* Ensure all code is production-ready
* Ensure mobile responsiveness everywhere
* Ensure charts work on small screens
* Ensure clean architecture
* Ensure deployment works without manual fixes
* Generate ALL required files with FULL source code
* Include comments where necessary
* Use best practices
* Ensure accessibility and keyboard support
* Ensure beautiful empty states and polished loading UI

Start by generating the backend project completely, then generate the frontend project completely, then deployment instructions.
