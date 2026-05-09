# Ticketing System API

Backend API for a multi-tenant bus ticketing platform, built with Fastify, TypeScript, PostgreSQL, and Kysely.

## What This Service Handles

- Authentication, authorization, and account lifecycle
- Company/staff management for operator organizations
- Route, station, trip schedule, and trip pricing operations
- Customer booking, ticketing, and payment flows
- Promotion/review modules and public listing endpoints
- Real-time/chat related APIs and notification support

## Tech Stack

- Runtime: `Node.js`, `TypeScript`, `Fastify`
- Validation & schemas: `zod`, `fastify-type-provider-zod`
- Database: `PostgreSQL`, `kysely`
- Auth: JWT (`fast-jwt`)
- Integrations: Stripe, VNPay, Firebase, Cloudinary, Infobip
- Tooling: ESLint, Prettier, Docker

## Architecture Overview

- `src/api`: HTTP route handlers (auto-discovered by file path)
- `src/business`: application use-cases and orchestration logic
- `src/database`: query/command DAL modules
- `src/model`: zod request/response/query/params schemas
- `src/service`: third-party integration adapters
- `src/datasource`: DB config, typed schema map, migrations
- `src/app`: bootstrap, plugins, auth guards, common app concerns

Route registration is convention-based:
- File path determines method and URL.
- Example: `src/api/customer/ticket/:id/get.ts` -> `GET /customer/ticket/:id`

## Authorization Model

### User roles (`auth.user.role`)

- `operator`
- `driver`
- `customer`
- `super_admin`

### Staff profile roles (`auth.staff_profile.role`)

- `company_admin`
- `dispatcher`
- `support`

## Prerequisites

- Node.js `>= 18` (Node 22 recommended)
- Yarn `4.x` (via Corepack)
- PostgreSQL `15+`
- Docker + Docker Compose (recommended for local DB)

## Environment Variables

Create `.env` in project root.

### Required

```env
NODE_ENV=development
APP_ENV=local
HOST=0.0.0.0
PORT=3000
DB_URL=postgres://bus-ticketing-system:your_password@localhost:5433/bus-ticketing-system
JWT_SECRET=replace-with-strong-secret
```

### Common Optional Integrations

```env
# CORS
CORS_ORIGIN=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_REFRESH_URL=
STRIPE_REDIRECT_URL=
SYSTEM_DOMAIN=

# VNPay
VNPAY_TMN_CODE=
VNPAY_SECRET=
VNPAY_URL=
VNPAY_RETURN_URL=

# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Messaging/Email/Upload
INFOBIP_API_KEY=
RESEND_API_KEY=
MAIL_FROM=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_CLOUD_NAME=
```

Notes:
- Database SSL behavior depends on `APP_ENV` in `src/datasource/db.ts`.
- Keep all secrets out of source control.

## Local Development

### 1) Install dependencies

```bash
yarn install
```

### 2) Start PostgreSQL (Docker)

```bash
docker compose -f docker-compose.prod.yml up -d db
```

### 3) Run migrations

```bash
yarn migrate
```

### 4) Start API

```bash
yarn dev
```

Swagger UI:
- [http://localhost:3000/swagger/docs](http://localhost:3000/swagger/docs)

## Available Scripts

- `yarn dev`: run API in development mode
- `yarn build`: compile TypeScript to `dist`
- `yarn start`: build + start production build
- `yarn format`: format source files
- `yarn format:check`: check formatting
- `yarn migrate`: apply pending migrations
- `yarn migration:create`: create a migration file
- `yarn migration:down`: rollback latest migration

## Database Migrations

- Migration files live in `src/datasource/migrations`.
- Always create migration for schema or enum changes.
- Recommended sequence:
  1. Generate/create migration.
  2. Apply via `yarn migrate`.
  3. Verify app boot and key endpoints.
  4. Commit migration with related code updates.

## Deployment Notes

### Docker image

```bash
docker build -t <registry>/ticketing-system-api:latest -f Dockerfile.prod .
```

### Compose deployment

```bash
docker compose -f docker-compose.prod.yml up -d
```

### Post-deploy checklist

- `GET /health` returns success
- `GET /swagger/docs/json` is reachable
- Migration status is up to date
- Logs show no startup/auth/database errors

## Security Recommendations

- Rotate `JWT_SECRET` and external provider keys regularly.
- Do not keep production credentials in `docker-compose` files.
- Restrict database network access and run backups before destructive migrations.
- Add centralized logs/metrics for API error and latency tracking.

## Troubleshooting

- **Cannot connect to DB**: verify `DB_URL`, DB container status, and mapped port.
- **Migration fails**: inspect latest migration file and schema drift.
- **401/403 errors**: validate JWT secret and role mapping.
- **Swagger missing**: confirm app started with valid `HOST` and `PORT`.

