# BusGo API

Backend service for BusGo — an intercity bus ticketing and operations platform.

Provides REST APIs for customers, drivers, bus company operators, support staff, payments (Stripe + VNPay), real-time chat, file uploads, and scheduled jobs.

**Tech stack:** Fastify 5 + TypeScript + Zod + Kysely + PostgreSQL

---

## Quick Start (Get Running in 2 Minutes)

### 1. Prerequisites

| Tool       | Version          |
|------------|------------------|
| Node.js    | 22.x             |
| Yarn       | 4.x (via Corepack) |
| PostgreSQL | 15+              |
| Docker     | Recommended      |

Enable Yarn:

```bash
corepack enable
```

### 2. Install & Run

```bash
# Clone and install
yarn install

# Start local PostgreSQL (from the prod compose for convenience)
docker compose -f docker-compose.prod.yml up -d db

# Create .env file in the project root with at least these values:
```

**Minimal `.env` example:**

```env
APP_ENV=local
NODE_ENV=development
HOST=0.0.0.0
PORT=3000
DB_URL=postgres://busgo:your-strong-password@localhost:5433/busgo
JWT_SECRET=replace-with-a-long-random-string-at-least-32-chars
```

```bash
# Apply database migrations
yarn migrate

# Start development server with hot reload
yarn dev
```

Done! The API is now running at **http://localhost:3000**

### Useful Local Endpoints

- `GET /health` — Health check
- `GET /swagger/docs` — Interactive Swagger UI (local only)
- `GET /swagger/json` — OpenAPI spec

---

## Available Scripts

| Command                        | Description                              |
|--------------------------------|------------------------------------------|
| `yarn dev`                     | Development server with hot reload       |
| `yarn build`                   | Clean + compile TypeScript → `dist/`     |
| `yarn start`                   | Production start (builds first)          |
| `yarn migrate`                 | Apply all pending Kysely migrations      |
| `yarn migration:create <name>` | Create a new migration file              |
| `yarn migration:down`          | Roll back the last migration             |
| `yarn format`                  | Format all source files with Prettier    |
| `yarn format:check`            | Check formatting without writing         |

---

## Environment Variables

### Core (Required)

| Variable     | Description                                      |
|--------------|--------------------------------------------------|
| `DB_URL`     | PostgreSQL connection string (Kysely)            |
| `JWT_SECRET` | Secret used to sign JWT authentication tokens    |
| `HOST`       | Server bind address (usually `0.0.0.0`)          |
| `PORT`       | Server bind port (usually `3000`)                |

### Redis (via REDIS_URL only)

- `REDIS_URL` — **Required** to enable Redis features (cache, rate limiting, chat realtime). Must be a full connection string from your managed Redis provider.
  - Redis Cloud example: `rediss://default:your-password@your-host:6379`
  - The code only supports connecting via `REDIS_URL` (no more separate REDIS_HOST/PORT variables).

### Other Important Variables

- `APP_ENV=local` — Disables SSL for local Postgres, enables Swagger UI
- `CRON_SECRET` — Protects internal `/job/*` scheduled task endpoints

### Integrations (only needed when using the feature)

- **Stripe**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PAYMENT_CLIENT_RETURN_URL`, ...
- **VNPay**: `VNPAY_TMN_CODE`, `VNPAY_SECRET`, ...
- **Cloudinary** (file uploads): `CLOUDINARY_*`
- **Firebase** (push notifications): `FIREBASE_*`
- **Email/SMS**: `RESEND_API_KEY`, `INFOBIP_API_KEY`
- **Social Login**: `GOOGLE_CLIENT_ID`, `FACEBOOK_APP_ID`, ...

All variables are loaded via `dotenv` from `.env` at the project root.

---

## How Routes Work

Routes are **automatically discovered** from the file system under `src/api`.

Examples:

| File path                                      | Becomes route                     |
|------------------------------------------------|-----------------------------------|
| `src/api/health/get.ts`                        | `GET /health`                     |
| `src/api/customer/ticket/[id]/get.ts`          | `GET /customer/ticket/:id`        |
| `src/api/auth/google/verify-token/post.ts`     | `POST /auth/google/verify-token`  |

Main route groups:

- `/auth` — Login, social, OTP, password reset, devices
- `/customer` — Booking, tickets, profile, coupons, trips
- `/driver` — Driver trips and operations
- `/operator-admin` — Company management (vehicles, staff, revenue)
- `/operator-dispatcher` — Scheduling, routes, stations
- `/operator-support` — Support tools (tickets, coupons)
- `/super-admin` — Platform-wide admin
- `/payment`, `/stripe`, `/chat`, `/file`, `/public`, `/job`

---

## Project Structure

The codebase is organized as a layered backend. Route files stay thin, business modules own use cases, database modules own persistence, and service modules wrap third-party integrations.

```text
src/
├── api/                  # Auto-discovered HTTP routes, grouped by user-facing area
│   ├── auth/             # Login, OTP, password, profile lookup, device tokens
│   ├── customer/         # Customer booking, tickets, trip search, payment methods
│   ├── driver/           # Driver trips, passengers, check-in, trip status
│   ├── operator-admin/   # Company admin workflows: staff, vehicles, revenue
│   ├── operator-dispatcher/
│   │                       # Route, station, schedule, trip and stop management
│   ├── operator-support/ # Support workflows for tickets and coupons
│   ├── super-admin/      # Platform administration, dashboards, users, companies
│   ├── payment/          # Payment method and VNPay return routes
│   ├── stripe/           # Stripe Connect callback/status and webhook routes
│   ├── chat/             # Chat boxes, messages, unread counters
│   ├── file/             # Upload presign endpoints
│   ├── public/           # Public company and promotion data
│   └── job/              # Protected cron endpoints
│
├── business/             # Use-case layer; coordinates validation, DAL and services
│   ├── auth/             # Authentication, sessions, social login, OTP, devices
│   ├── booking/          # Booking, ticket, coupon, promotion workflows
│   ├── operation/        # Routes, stations, schedules, trips, trip stop templates
│   ├── organization/     # Companies, vehicles, seats, drivers, reviews
│   ├── payment/          # Payment orchestration, Stripe cache, payment records
│   ├── chat/             # Chat box/message business rules
│   └── cron/             # Expire booking, departure reminder, cleanup jobs
│
├── database/             # Kysely data access layer, grouped by database schema
│   ├── auth/             # auth.user, staff_profile, devices, notifications, OTP
│   ├── booking/          # booking.booking, ticket, coupon, seat_segment, promotion
│   ├── operation/        # operation.route, station, trip_schedule, trip, templates
│   ├── organization/     # company, vehicle, seat, driver stats, reviews
│   ├── payment/          # payment.payment, customer_payment_method
│   └── chat/             # chat.box, chat.message
│
├── datasource/           # PostgreSQL connection, Kysely types, migrations
│   ├── migrations/       # Ordered database migration files
│   ├── helpers/          # Shared database helper types
│   ├── db.ts             # Kysely instance, plugins, pool config
│   └── type.ts           # Global Database interface
│
├── model/                # Zod schemas and typed request/response contracts
│   ├── body/             # Request/response bodies
│   ├── params/           # Path parameter schemas
│   └── query/            # Query-string schemas and filters
│
├── service/              # External service adapters
│   ├── stripe/           # Stripe customer, Connect, webhook helpers
│   ├── vnpay/            # VNPay init/verify payment helpers
│   ├── firebase/         # Push notifications
│   ├── cloudinary/       # Upload presign helpers
│   ├── email/            # Email sender and templates
│   ├── infobip/          # SMS sender
│   ├── google/           # Google auth verification
│   ├── facebook/         # Facebook auth verification
│   └── excel/            # Export helpers
│
├── app/                  # Fastify app shell: plugins, JWT, errors, websocket
└── utils/                # Shared utilities: time, token, cache, password, common
```

### Request Flow

Most endpoints follow this shape:

```text
HTTP request
  -> src/api/... route handler
  -> JWT role check + Zod schema validation
  -> src/business/... use case
  -> src/database/... query/command modules
  -> PostgreSQL through Kysely
  -> typed response schema
```

External calls stay behind `src/service/*`, so business code can coordinate payments, notifications, file uploads, and social login without embedding provider-specific logic in route handlers.

### Module Conventions

| Layer        | Responsibility                                  | Typical files                         |
|--------------|--------------------------------------------------|---------------------------------------|
| `api`        | HTTP boundary, auth guard, schema wiring         | `get.ts`, `post.ts`, `put.ts`         |
| `business`   | Use cases, permissions, transaction orchestration | `ticket.ts`, `booking.ts`, `trip.ts`  |
| `database`   | Typed persistence operations                     | `query.ts`, `command.ts`, `table.ts`  |
| `model`      | Shared Zod contracts                             | `body/*`, `params/*`, `query/*`       |
| `service`    | Third-party integration wrappers                 | `stripe/*`, `vnpay/*`, `firebase/*`   |
| `datasource` | Database bootstrapping and migrations            | `db.ts`, `type.ts`, `migrations/*`    |

---

## Authentication

Protected routes expect:

```
Authorization: Bearer <your-jwt-token>
```

- Tokens are valid for 30 days
- Logout immediately invalidates previous tokens for that user

---

## Database Migrations

Migrations live in `src/datasource/migrations/`.

```bash
yarn migrate                  # Apply latest
yarn migration:create add-foo # Create new
yarn migration:down           # Roll back one step
```

Always run migrations after pulling changes that include new migration files.

## Development Tips

- Run `yarn format` before committing.
- Swagger UI is only served when `APP_ENV != production`.
- Most business logic lives in `src/business/`, data access in `src/database/`.
- Use `console.log` + `yarn dev` for fast local debugging.

---

## Production & Deployment

- Production image: `Dockerfile.prod`
- Full stack: `docker-compose.prod.yml` (includes 2 API replicas + Postgres + monitoring). **Redis container has been removed** — use a managed Redis service (see `REDIS_URL`).
- CI/CD: `Jenkinsfile` (builds image, runs migrations, deploys via compose)

**Required for production:** Set `REDIS_URL=rediss://...` using your Redis Cloud connection string. The app now **only** connects to Redis using `REDIS_URL`.

The legacy GitHub Actions workflow has been removed.

---

## Cleanup Performed

This repository was cleaned up (May 2026):

- Removed unused `src/service/queue/` (SQS-based queue, fully disabled)
- Removed ESLint and all related packages + config (never used — only Prettier is active)
- Removed legacy `.github/workflows/` (old GitHub deploy pipeline)
- Deleted local `dist/` build artifact
- Removed dead commented code
- Rewrote README for immediate usability

---

Happy coding! If you can run `yarn dev` after the steps above, everything is working.
