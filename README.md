# BusGo API

BusGo API is the backend service for an intercity bus ticketing and operations
platform. It provides REST endpoints for customer booking, driver workflows,
operator administration, dispatcher operations, support tooling, payments,
notifications, chat, file uploads, and internal scheduled jobs.

The service is built with Fastify 5, TypeScript, Zod, Kysely, and PostgreSQL.
Routes are registered automatically from the folder structure under `src/api`,
while business logic and data access are kept in separate layers.

## Contents

- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [API Design](#api-design)
- [Authentication and Authorization](#authentication-and-authorization)
- [Database Migrations](#database-migrations)
- [Scripts](#scripts)
- [Docker and Deployment](#docker-and-deployment)
- [Swagger](#swagger)
- [Operations Notes](#operations-notes)
- [Troubleshooting](#troubleshooting)

## Requirements

| Tool       | Version / Notes                                               |
| ---------- | ------------------------------------------------------------- |
| Node.js    | 22.x, aligned with `Dockerfile.prod`                          |
| Yarn       | 4.x via Corepack                                              |
| PostgreSQL | 15+                                                           |
| Docker     | Optional for local PostgreSQL and production-style deployment |

Enable Corepack before installing dependencies:

```bash
corepack enable
```

## Getting Started

Install dependencies:

```bash
yarn install
```

Start PostgreSQL using the production compose file:

```bash
docker compose -f docker-compose.prod.yml up -d db
```

Start PostgreSQL and Redis when testing cache or rate-limit behavior:

```bash
docker compose -f docker-compose.prod.yml up -d db redis
```

Create a `.env` file in the project root. A minimal local configuration looks
like this:

```env
APP_ENV=local
NODE_ENV=development
HOST=0.0.0.0
PORT=3000
DB_URL=postgres://busgo:<password>@localhost:5433/busgo
JWT_SECRET=<replace-with-a-strong-secret>
REDIS_URL=redis://:busgo_redis@localhost:6379/0
```

Run migrations:

```bash
yarn migrate
```

Start the development server:

```bash
yarn dev
```

Useful local URLs:

| Endpoint        | Purpose                                   |
| --------------- | ----------------------------------------- |
| `GET /health`   | Health check                              |
| `/swagger/docs` | Swagger UI in non-production environments |
| `/swagger/json` | OpenAPI JSON document                     |

## Configuration

The application loads environment variables from `.env` through `dotenv`.
Secrets should never be committed to the repository.

### Core

| Variable                 | Description                                                                     |
| ------------------------ | ------------------------------------------------------------------------------- |
| `APP_ENV`                | Use `local` to disable PostgreSQL SSL; use `production` for production behavior |
| `NODE_ENV`               | Runtime mode, usually `development` or `production`                             |
| `HOST`                   | Fastify bind host                                                               |
| `PORT`                   | Fastify bind port                                                               |
| `DB_URL`                 | PostgreSQL connection string used by Kysely                                     |
| `JWT_SECRET`             | Secret used to sign and verify JWT tokens                                       |
| `REDIS_URL`              | Optional Redis connection string for shared cache, rate limiting, and locks     |
| `CORS_ORIGIN`            | Optional comma-separated list of allowed origins; defaults to `*`               |
| `ENABLE_HTTP_DEBUG_LOGS` | Set to `true` to log lightweight request details outside production             |

### Integrations

| Area            | Variables                                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Stripe          | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_REDIRECT_URL`, `STRIPE_REFRESH_URL`, `STRIPE_CLIENT_RETURN_URL`, `SYSTEM_DOMAIN` |
| VNPay           | `VNPAY_TMN_CODE`, `VNPAY_SECRET`, `VNPAY_URL`, `VNPAY_RETURN_URL`, `VNPAY_CLIENT_RETURN_URL`                                           |
| Cloudinary      | `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_CLOUD_NAME`                                                                 |
| Firebase        | `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_PROJECT_ID`                                                                 |
| Email and SMS   | `RESEND_API_KEY`, `MAIL_FROM`, `INFOBIP_API_KEY`                                                                                       |
| Social login    | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`                                                   |
| Internal socket | `SOCKET_SERVER_URL`, `INTERNAL_SOCKET_TOKEN`                                                                                           |
| Scheduled jobs  | `CRON_SECRET`                                                                                                                          |
| Queue scaffold  | `AWS_REGION`, `AWS_ENDPOINT`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_LOCAL_ACCOUNT_ID`                                     |

`GOOGLE_CLIENT_ID` supports multiple client IDs separated by commas.

## Project Structure

| Path             | Responsibility                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| `src/app`        | Fastify bootstrap, plugins, JWT handling, cron secret verification                                    |
| `src/api`        | Route modules. Directory path maps to URL and filename maps to HTTP method                            |
| `src/business`   | Use cases and application orchestration                                                               |
| `src/database`   | Kysely commands, queries, repositories, and table definitions                                         |
| `src/datasource` | Kysely database instance, generated database types, and migrations                                    |
| `src/model`      | Zod schemas for request bodies, params, queries, and responses                                        |
| `src/service`    | Third-party service adapters such as Stripe, VNPay, Firebase, Cloudinary, email, and social providers |
| `src/utils`      | Shared utility functions                                                                              |
| `public`         | Static assets used outside production, including the local Swagger UI shell                           |

## API Design

Routes are discovered from files in `src/api`.

Examples:

| File                                       | Registered route                 |
| ------------------------------------------ | -------------------------------- |
| `src/api/health/get.ts`                    | `GET /health`                    |
| `src/api/customer/ticket/:id/get.ts`       | `GET /customer/ticket/:id`       |
| `src/api/auth/google/verify-token/post.ts` | `POST /auth/google/verify-token` |

Main route groups:

| Prefix                 | Scope                                                                             |
| ---------------------- | --------------------------------------------------------------------------------- |
| `/auth`                | Sign in, social login, OTP, password, device tokens, notifications                |
| `/customer`            | Customer profile, booking, tickets, coupons, trip schedules, payment methods      |
| `/driver`              | Driver trips, passengers, route details, check-in, driver statistics              |
| `/operator-admin`      | Company administration, staff, vehicles, seats, payments, Stripe Connect, revenue |
| `/operator-dispatcher` | Stations, routes, trip schedules, trip templates, vehicles, drivers               |
| `/operator-support`    | Support-facing coupons and tickets                                                |
| `/super-admin`         | Platform administration, users, companies, promotions, dashboards, balances       |
| `/payment`             | Payment method and VNPay IPN endpoints                                            |
| `/stripe`              | Stripe Connect and webhook endpoints                                              |
| `/chat`                | Chat boxes, messages, unread counters                                             |
| `/file`                | Presigned upload endpoints                                                        |
| `/public`              | Public company and promotion data                                                 |
| `/job`                 | Internal scheduled jobs protected by `x-cron-secret`                              |

## Authentication and Authorization

Authenticated routes expect a bearer token:

```http
Authorization: Bearer <token>
```

JWTs are signed with `JWT_SECRET` and expire after 30 days. Logout increments
the user's token version, which invalidates previously issued tokens.

User roles:

| Role          | Description               |
| ------------- | ------------------------- |
| `customer`    | Passenger-facing account  |
| `driver`      | Driver account            |
| `operator`    | Bus company staff account |
| `super_admin` | Platform administrator    |

Operator staff profile roles:

| Staff role      | Description                    |
| --------------- | ------------------------------ |
| `company_admin` | Company owner or administrator |
| `dispatcher`    | Operations dispatcher          |
| `support`       | Customer support operator      |

Some endpoints only check the main user role. Operator endpoints may also check
the staff profile role with `requireStaffProfileRole`.

## Database Migrations

Migrations live in `src/datasource/migrations` and are managed by
`kysely-ctl` through `kysely.config.ts`.

Apply all pending migrations:

```bash
yarn migrate
```

Create a migration:

```bash
yarn migration:create <migration-name>
```

Roll back one migration step:

```bash
yarn migration:down
```

Recommended workflow:

1. Add the migration and related TypeScript changes together.
2. Run the migration against a database that matches the target environment.
3. Verify affected API flows before deploying.
4. Back up production data before destructive migrations.

## Scripts

| Command                 | Description                              |
| ----------------------- | ---------------------------------------- |
| `yarn dev`              | Start the API with `nodemon` and `tsx`   |
| `yarn build`            | Clean and compile TypeScript into `dist` |
| `yarn start`            | Build, then start `dist/app/api.js`      |
| `yarn migrate`          | Apply latest Kysely migrations           |
| `yarn migration:create` | Create a new Kysely migration            |
| `yarn migration:down`   | Roll back one Kysely migration           |
| `yarn format`           | Format source files with Prettier        |
| `yarn format:check`     | Check source formatting                  |

## Docker and Deployment

Build the production image:

```bash
DOCKER_BUILDKIT=1 docker build -f Dockerfile.prod -t busgo-api:<tag> .
```

Run the compose stack:

```bash
IMAGE_TAG=<tag> docker compose -f docker-compose.prod.yml up -d
```

Set a Redis password when running the stack outside local development:

```bash
REDIS_PASSWORD=<strong-password> IMAGE_TAG=<tag> docker compose -f docker-compose.prod.yml up -d
```

The production compose file includes:

| Service   | Purpose                                  |
| --------- | ---------------------------------------- |
| `api1`    | BusGo API container                      |
| `api2`    | Second BusGo API container               |
| `db`      | PostgreSQL 15                            |
| `redis`   | Redis cache                              |
| `dozzle`  | Container log viewer                     |
| `netdata` | Host and container monitoring            |

The API services read `.env` through `env_file`. Keep the database credentials
in `DB_URL` aligned with the PostgreSQL service or the external database used
by the deployment. `docker-compose.prod.yml` injects `REDIS_URL` for `api1`
and `api2`, and stores Redis data in the `redis_data` volume.

`Jenkinsfile` contains a deployment pipeline that:

1. Checks out the `main` branch.
2. Creates `.env` from Jenkins credentials.
3. Builds the API image locally from `Dockerfile.prod`.
4. Pulls and starts supporting services, including Redis.
5. Waits for PostgreSQL and Redis.
6. Runs migrations with the newly built API image.
7. Recreates the API containers.
8. Checks `/health` on both API containers.
9. Cleans up Docker artifacts.

The old GitHub Actions build-and-trigger workflow is no longer required.
Configure the GitHub webhook to trigger the Jenkins job directly, and keep the
Jenkins agent on the Docker host that runs the production compose stack.

## Swagger

Swagger is registered through `@fastify/swagger` and Zod schema transforms.

| Environment            | Documentation URL                   |
| ---------------------- | ----------------------------------- |
| Local / non-production | `/swagger/docs` and `/swagger/json` |
| Production             | `/swagger/json`                     |

The Swagger UI shell is served from `public/swagger-dev.html` only outside
production. In production, expose API documentation only through a protected
network, staging environment, VPN, or authentication layer.

## Operations Notes

- Keep `JWT_SECRET`, payment provider secrets, cloud credentials, and webhook
  secrets in a managed secret store.
- Do not print `.env` contents in CI logs.
- Protect `/job/*` endpoints and send `x-cron-secret` from trusted schedulers
  only.
- Monitor 5xx rates, latency, database connection pressure, webhook failures,
  payment reconciliation, and unusual 401/403 patterns.
- Test Stripe and VNPay callbacks in staging before enabling production
  credentials.
- Back up PostgreSQL before large schema changes or destructive migrations.

## Troubleshooting

| Symptom                                                     | Check                                                                                                |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| API fails with `env PORT not found` or `env HOST not found` | Ensure `.env` includes `HOST` and `PORT`                                                             |
| Cannot connect to PostgreSQL                                | Verify `DB_URL`, database health, and the host port mapping `5433:5432` in `docker-compose.prod.yml` |
| Cannot connect to Redis                                     | Verify `REDIS_URL`, `REDIS_PASSWORD`, and the host port mapping `6379:6379` in `docker-compose.prod.yml` |
| PostgreSQL password errors                                  | Ensure the password in `DB_URL` matches the initialized PostgreSQL volume                            |
| Migrations fail                                             | Compare the migration with the current schema and inspect the Kysely error output                    |
| 401 or 403 responses                                        | Check JWT validity, token version, user role, and staff profile role requirements                    |
| Stripe webhook verification fails                           | Verify `STRIPE_WEBHOOK_SECRET` and ensure the raw JSON body reaches `/stripe/webhook` unchanged      |
| Swagger UI does not load locally                            | Confirm `APP_ENV` is not `production` and `public/swagger-dev.html` exists                           |
| Social login fails                                          | Verify provider credentials, token audience, and HTTPS requirements for browser-based flows          |
trigger
trigger Tue May 26 18:41:13 +07 2026
