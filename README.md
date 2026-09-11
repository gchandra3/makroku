# MacroCast

Macroeconomic forecasting app for Indonesia, Hong Kong, and Singapore. Explore economic indicators, run OLS regressions, and generate forecasts — all in the browser.

## Structure

```
makroku/
├── apps/
│   ├── api/          Fastify REST API — data pipeline, Redis caching, SQLite
│   └── web/          TanStack Start frontend — React 19, shadcn/ui, Recharts
└── packages/
    └── contracts/    Shared Zod schemas (types for API ↔ frontend)
```

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Docker](https://www.docker.com/) (for Redis)
- npm (ships with Node.js)

## Quick start

```sh
# 1. Install dependencies (root workspace)
npm install

# 2. Build shared contracts
npm run build -w packages/contracts

# 3. Start Redis
docker compose up -d redis

# 4. Create the database and run migrations
npm run db:migrate -w apps/api

# 5. Seed real economic data from the World Bank API
npm run db:seed -w apps/api

# 6. Start the API (port 3000)
npm run dev -w apps/api

# 7. Start the frontend (port 5173)
npm run dev -w apps/web
```

Open **http://localhost:5173** in your browser.

## All scripts

### Root

| Command | Description |
|---|---|
| `npm install` | Install all workspace dependencies |

### API (`apps/api`)

| Command | Description |
|---|---|
| `npm run dev -w apps/api` | Start API dev server (hot reload) |
| `npm run build -w apps/api` | Compile TypeScript |
| `npm run typecheck -w apps/api` | Type-check without emitting |
| `npm run db:generate -w apps/api` | Generate Drizzle migration from schema |
| `npm run db:migrate -w apps/api` | Run SQLite migrations |
| `npm run db:seed -w apps/api` | Fetch and store World Bank data |
| `npm run db:studio -w apps/api` | Open Drizzle Studio (DB browser) |
| `npm run test -w apps/api` | Run API tests |

### Web (`apps/web`)

| Command | Description |
|---|---|
| `npm run dev -w apps/web` | Start Vite dev server |
| `npm run build -w apps/web` | Production build |
| `npm run preview -w apps/web` | Preview production build |
| `npm run lint -w apps/web` | Lint with ESLint |
| `npm run format -w apps/web` | Format with Prettier |

### Contracts (`packages/contracts`)

| Command | Description |
|---|---|
| `npm run build -w packages/contracts` | Compile shared type contracts |
| `npm run typecheck -w packages/contracts` | Type-check contracts |

## API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Service health |
| GET | `/health/cache` | Redis cache stats |
| GET | `/api/v1/indicators` | List indicators (`?country=&category=&q=`) |
| GET | `/api/v1/indicators/:id` | Single indicator with series |
| GET | `/api/v1/indicators/:id/series` | Time series only (`?from=&to=`) |
| POST | `/api/v1/indicators/seed` | Trigger World Bank ingestion |
| POST | `/api/v1/regression` | Run a regression |
| GET | `/api/v1/regression/:id` | Get regression result |

## Data

The data pipeline fetches 8 economic indicators per country (CPI, GDP, unemployment, exports, exchange rate, money supply, government spending, consumption) from the World Bank API. Annual data is interpolated to quarterly (2010 Q1 – 2025 Q4) using monotone cubic spline interpolation for frontend compatibility.

Redis caches indicator responses (1-hour TTL for individual indicators, 5-minute for list queries). SQLite persists the raw data via Drizzle ORM.

If the API is unreachable, the frontend falls back to deterministic mock data so the UI always works.

## Environment

Copy `.env.example` to a `.env` file for the API. Defaults work out of the box for local development — Redis on `localhost:6379`, SQLite at `./data/makroku.db`, World Bank API at the public endpoint.