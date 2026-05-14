# BusGo Backend API

REST API for the BusGo intercity bus ticketing platform (Fastify, TypeScript, PostgreSQL). Routes are registered from the **folder layout** under `src/api`; `business` and `database` layers separate use cases from data access.

## Table of contents

1. [Requirements](#requirements)
2. [Quick start (local)](#quick-start-local)
3. [Environment variables](#environment-variables)
4. [Project layout](#project-layout)
5. [Authorization (summary)](#authorization-summary)
6. [Scripts](#scripts)
7. [Database migrations](#database-migrations)
8. [Docker and deployment](#docker-and-deployment)
9. [API docs (Swagger)](#api-docs-swagger)
10. [Security and operations](#security-and-operations)
11. [Troubleshooting](#troubleshooting)

---

## Requirements

| Component | Notes |
|-----------|--------|
| Node.js | **22** (matches `Dockerfile.prod`) |
| Yarn | **4.x** — enable Corepack: `corepack enable` |
| PostgreSQL | 15+ (compose file in this repo uses `postgres:15`) |
| Docker (optional) | Local DB or production-style image builds |

---

## Quick start (local)

```bash
corepack enable
yarn install
```

**1. PostgreSQL (Docker)**

```bash
docker compose -f docker-compose.prod.yml up -d db
```

**2. `.env` file** in the project root (see [Environment variables](#environment-variables)). Minimum for local:

- `APP_ENV=local` — disables TLS to Postgres in `src/datasource/db.ts`.
- `DB_URL` — points at your Postgres instance (with the default compose file in this repo: user `busgo`, host port **5433**).

**3. Migrations**

```bash
yarn migrate
```

**4. Dev server**

```bash
yarn dev
```

- API: `http://localhost:<PORT>` (often `3000`).
- Health: `GET /health`
- Swagger UI: `/swagger/docs` (see [API docs (Swagger)](#api-docs-swagger)).

---

## Environment variables

Create `.env` in the repository root. **Do not commit secrets.**

### Application and HTTP

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | `development` or `production` |
| `APP_ENV` | `local` — DB TLS off; `production` — suppresses successful SQL query logging in Kysely (see `src/datasource/db.ts`) |
| `HOST`, `PORT` | Server bind address and port |
| `DB_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Sign and verify JWTs |
| `CORS_ORIGIN` | Allowed CORS origin |
| `ENABLE_HTTP_DEBUG_LOGS` | When `true` and not production, lightweight request logging (see `src/app/api.ts`) |

### Payments and platform

`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_REFRESH_URL`, `STRIPE_REDIRECT_URL`, `SYSTEM_DOMAIN`, `VNPAY_*`, and related keys.

### Messaging, uploads, and social login

`FIREBASE_*`, `INFOBIP_API_KEY`, `RESEND_*`, `CLOUDINARY_*`, `GOOGLE_CLIENT_ID`, `FACEBOOK_*`, `SOCKET_SERVER_URL`, `INTERNAL_SOCKET_TOKEN`, `CRON_SECRET`, and others as required by your deployment.

**Notes:**

- `GOOGLE_CLIENT_ID` may list multiple client IDs separated by commas.
- Facebook Login in the browser typically requires an HTTPS origin.

---

## Project layout

| Path | Role |
|------|------|
| `src/api` | Route definitions; filename drives HTTP method and URL |
| `src/business` | Use cases and orchestration |
| `src/database` | Kysely queries and commands by domain |
| `src/model` | Zod schemas for bodies, queries, params, and responses |
| `src/service` | Third-party integration adapters |
| `src/datasource` | `db` instance, typings, migrations |
| `src/app` | Fastify bootstrap, plugins, JWT |

**URL convention:** e.g. `src/api/customer/ticket/:id/get.ts` → `GET /customer/ticket/:id`.

---

## Authorization (summary)

**`auth.user.role`:** `operator`, `driver`, `customer`, `super_admin`

**`auth.staff_profile.role`:** `company_admin`, `dispatcher`, `support`

For social login flows, the effective role is determined by the **route**, not by picking an arbitrary role in the request body.

---

## Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Nodemon + `tsx`, watches `src` |
| `yarn build` | `yarn clean` + `tsc` → `dist/` |
| `yarn start` | `prestart` runs build, then `node dist/app/api.js` |
| `yarn migrate` | Apply latest migrations (Kysely) |
| `yarn migration:create` | Create a new migration file |
| `yarn migration:down` | Roll back one migration step |
| `yarn format` / `yarn format:check` | Prettier |

---

## Database migrations

- Folder: `src/datasource/migrations`
- Config: `kysely.config.ts` (imports `db` from `src/datasource/db.ts`)

**Suggested workflow:** add a migration → run `yarn migrate` on an environment representative of production → verify APIs → commit the migration with the schema-related code.

---

## Docker and deployment

- **Build image:** `docker build -f Dockerfile.prod -t <image:tag> .`  
  Enable BuildKit: `export DOCKER_BUILDKIT=1` (the sample `Jenkinsfile` in this repo sets this).
- **Production compose:** `docker-compose.prod.yml` — the `api` service uses a pre-built image; `db` is PostgreSQL.

Before `docker compose ... up`, provide a suitable `.env` (the compose file attaches `env_file: .env` to `api`). Keep **credentials in `DB_URL` aligned** with the Postgres instance the stack actually uses (avoid password drift between an old volume and new env values).

**Jenkins:** see `Jenkinsfile` for a sample pipeline (build, push image, migrate, `up -d`). Adjust registry, credentials, and hosts for your infrastructure.

---

## API docs (Swagger)

- UI: **`/swagger/docs`**
- OpenAPI JSON is exposed by `@fastify/swagger` on routes that depend on your Fastify version and config—verify on your environment.

**Recommendation:** on **production**, avoid exposing Swagger publicly (disable the plugin, use Basic Auth or IP allowlists, or enable only on staging) to reduce information disclosure for attackers.

---

## Security and operations

- Rotate `JWT_SECRET` and provider secrets (Stripe, VNPay, and others) on a regular schedule.
- Back up the database before destructive or large data migrations.
- Monitor 5xx rates, latency, and unusual 401/403 patterns.
- Do not print `.env` contents in CI logs (the sample `Jenkinsfile` avoids `cat .env`).

---

## Troubleshooting

| Symptom | What to check |
|---------|----------------|
| Cannot connect to the database | `DB_URL`, `db` container health, ports (host **5433** ↔ container **5432** in the default compose file). |
| `password authentication failed for user "busgo"` | Match the Postgres password to `DB_URL`; an existing volume may have been initialized with a different password—update the role in Postgres or recreate the volume (data loss unless you have a backup). |
| Migration errors | Read the stack trace; compare the migration with the live schema; avoid untested manual migrations on production. |
| 401 / 403 | `JWT_SECRET`, token expiry, and required roles for the route. |
| Swagger does not load | `HOST` / `PORT`, firewall, reverse proxy path for `/swagger/docs`. |
| Yarn or lockfile issues | Run `yarn install` again after changing `package.json` or renaming the package. |

---

## Social login (quick reference)

- `POST /customer/google/verify-token`, `POST /driver/google/verify-token` — request body uses `idToken`.
- `POST /customer/facebook/verify-token`, `POST /driver/facebook/verify-token` — `accessToken`; `idToken` may be empty for the access-token flow.

---

## Stack

Fastify 5, Zod with `fastify-type-provider-zod`, Kysely, PostgreSQL, `fast-jwt`, Stripe, VNPay, Firebase, and other services configured via the environment variables listed above.
