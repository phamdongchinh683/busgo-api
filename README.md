# Ticketing System API

Production-focused backend API for a multi-tenant bus ticketing platform.

## Overview

This service provides:

- Authentication and role-based authorization (`super_admin`, `admin`, `driver`, `customer`)
- Company and staff management for bus operators
- Route, station, trip schedule, and price template management
- Customer booking and ticket lifecycle
- Payment integration (VNPay) and payment tracking
- Notification and device token handling (FCM-ready)
- Background jobs (cron) for asynchronous system tasks

Core stack:

- `Fastify` + `TypeScript`
- `PostgreSQL` + `Kysely`
- `Zod` validation
- `JWT` authentication
- Dockerized production runtime

## Folder Structure (Explained)

### Root

- `README.md`: Project documentation
- `package.json`: Scripts and dependencies
- `kysely.config.ts`: Migration CLI configuration
- `Dockerfile.prod`: Multi-stage production image build
- `docker-compose.prod.yml`: Production-like container orchestration (`api`, `job`, `db`)
- `tsconfig.json`, `.eslintrc.json`, `.prettierrc.json`: TypeScript and quality tooling

### `src/`

- `src/api/`: HTTP endpoints grouped by domain and role
  - `auth/`: sign-in, logout, password, notifications, device token
  - `super-admin/`: top-level administration and dashboards
  - `company-admin*`: company-level operations (operator, support, accountant)
  - `driver/`: driver trip and passenger actions
  - `customer/`: booking/ticket/coupon/customer flows
  - `payment/`: payment APIs and callbacks
- `src/app/`: Fastify bootstrap, route loading, JWT guard, shared errors/plugins
- `src/business/`: business use-cases and application orchestration
- `src/database/`: database access layer (query/command modules per bounded context)
- `src/datasource/`:
  - `db.ts`: Kysely + PostgreSQL connection setup
  - `migrations/`: schema evolution history
  - `type.ts`: typed database map for Kysely
- `src/model/`: Zod models for request body, query, params, and shared response shapes
- `src/service/`: third-party integrations (email, cloudinary, VNPay, firebase)
- `src/job/` and `src/cron/`: scheduled/background execution entry points
- `src/utils/`: common helpers (time, password, random, etc.)

## Prerequisites

- Node.js `>= 18` (Node 22 recommended to match Dockerfile)
- Yarn `4.x` (Corepack-enabled)
- PostgreSQL `15+` (local or containerized)
- Docker + Docker Compose (recommended)

## Environment Configuration

Create `.env` in project root:

```env
# Runtime
NODE_ENV=development
APP_ENV=local
HOST=0.0.0.0
PORT=3000

# Security
JWT_SECRET=replace-with-strong-secret

# Database
DB_URL=postgres://bus-ticketing-system:your_password@localhost:5433/bus-ticketing-system

# Optional integrations
VNPAY_TMN_CODE=
VNPAY_SECRET=
VNPAY_URL=
VNPAY_RETURN_URL=
```

Notes:

- `src/datasource/db.ts` disables SSL only when `APP_ENV=local`.
- For non-local environments, SSL is enabled with `rejectUnauthorized: false`.

## Database Setup

### Option A: Use Existing `docker-compose.prod.yml` (quick local bootstrap)

```bash
docker compose -f docker-compose.prod.yml up -d db
```

Then run migrations:

```bash
yarn migrate
```

### Option B: Use External PostgreSQL

1. Create database + user manually.
2. Set `DB_URL`.
3. Run:

```bash
yarn migrate
```

### Migration Commands

- `yarn migrate`: apply pending migrations
- `yarn migration:create <name>`: create migration file
- `yarn migration:down`: rollback last migration

## Run the Project

### Development

Terminal 1:

```bash
yarn dev
```

Terminal 2 (background jobs):

```bash
yarn cron-dev
```

Swagger docs:

- [http://localhost:3000/swagger/docs](http://localhost:3000/swagger/docs)

### Production (without Docker)

```bash
yarn build
yarn start
```

Run cron worker in separate process:

```bash
yarn cron-start
```

## Deployment

## 1) Build Image

```bash
docker build -t <your-registry>/ticketing-system-api:latest -f Dockerfile.prod .
```

## 2) Configure Runtime Secrets

- Create `.env` on target host
- Ensure `JWT_SECRET` and `DB_URL` point to production values
- Do not commit credentials into source control

## 3) Deploy with Compose

```bash
docker compose -f docker-compose.prod.yml up -d
```

This starts:

- `api`: HTTP API service
- `job`: cron/background worker
- `db`: PostgreSQL 15

## 4) Post-deploy Checks

- `GET /swagger/docs/json` returns OpenAPI spec
- Health-check critical endpoints
- Verify migration state and background job logs

## Scripts

- `yarn dev`: run API in dev mode
- `yarn cron-dev`: run cron worker in dev mode
- `yarn build`: compile TypeScript
- `yarn start`: start compiled API
- `yarn cron-start`: start compiled cron worker
- `yarn format`: format source
- `yarn format:check`: validate formatting
- `yarn migrate`: run migrations
- `yarn migration:create`: create migration
- `yarn migration:down`: rollback migration

## Professional Operational Notes

- Keep `api` and `job` as separate processes/containers in production.
- Use strong secrets and external secret management for production.
- Restrict DB exposure; do not publicly expose `5432/5433` unless necessary.
- Add centralized logging/monitoring for Fastify + cron tasks.
- Back up PostgreSQL regularly before running destructive migrations.

## Troubleshooting

- **DB connection fails**: verify `DB_URL`, DB container status, and exposed port.
- **Migration errors**: ensure `kysely.config.ts` and `src/datasource/migrations` are present.
- **Auth failures**: verify JWT secret parity across all runtime services (`api`, `job`).
- **Swagger not loading**: check app startup logs and `PORT`/`HOST` configuration.

