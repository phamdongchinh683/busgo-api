# BusGo Backend API

Backend service for the BusGo multi-tenant bus ticketing platform. The API is built with Fastify and TypeScript, backed by PostgreSQL, and organized around convention-based routing, typed request validation, and a clear separation between transport, business logic, and data access.

## Capabilities

- Authentication, authorization, and account lifecycle management
- Operator organization, staff, and company administration
- Route, station, trip schedule, and pricing operations
- Customer booking, ticketing, and payment flows
- Promotions, reviews, and public listing endpoints
- Notifications, chat-related APIs, and third-party integrations

## Tech Stack

- Runtime: Node.js, TypeScript, Fastify
- Validation and OpenAPI schemas: Zod, `fastify-type-provider-zod`
- Database: PostgreSQL, Kysely
- Authentication: JWT via `fast-jwt`
- Integrations: Stripe, VNPay, Firebase, Cloudinary, Infobip, Google Login, Facebook Login
- Tooling: ESLint, Prettier, Docker, Yarn 4

## Project Layout

- `src/api`: HTTP route handlers, discovered automatically from the filesystem
- `src/business`: application use cases and orchestration
- `src/database`: query and command data-access modules
- `src/model`: Zod schemas for request, response, query, and route params
- `src/service`: third-party integration adapters
- `src/datasource`: database configuration, schema typing, and migrations
- `src/app`: application bootstrap, plugins, auth guards, and shared app concerns

Routes are derived from file paths. For example, `src/api/customer/ticket/:id/get.ts` maps to `GET /customer/ticket/:id`.

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

- Node.js 18 or newer (Node.js 22 recommended)
- Yarn 4.x through Corepack
- PostgreSQL 15 or newer
- Docker and Docker Compose for local database and production-style deployment

## Environment Variables

Create a `.env` file in the project root. Do not commit secrets.

### Core application

```env
NODE_ENV=development
APP_ENV=local
HOST=0.0.0.0
PORT=3000
DB_URL=postgres://busgo:your_password@localhost:5433/busgo
JWT_SECRET=replace-with-a-strong-secret
CORS_ORIGIN=http://localhost:3000
ENABLE_HTTP_DEBUG_LOGS=true
```

### Payments and platform services

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_REFRESH_URL=
STRIPE_REDIRECT_URL=
SYSTEM_DOMAIN=

VNPAY_TMN_CODE=
VNPAY_SECRET=
VNPAY_URL=
VNPAY_RETURN_URL=
```

### Messaging, uploads, and notifications

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

INFOBIP_API_KEY=
RESEND_API_KEY=
MAIL_FROM=

CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_CLOUD_NAME=
```

### Social login and internal services

```env
GOOGLE_CLIENT_ID=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

SOCKET_SERVER_URL=
INTERNAL_SOCKET_TOKEN=
CRON_SECRET=
```

Notes:

- Database SSL behavior is controlled by `APP_ENV` in `src/datasource/db.ts`.
- `GOOGLE_CLIENT_ID` supports multiple client IDs separated by commas.
- Social-login test pages require an HTTPS origin for Facebook Login.

## Local Development

### 1. Install dependencies

```bash
corepack enable
yarn install
```

If Yarn reports `Package for busgo-backend@workspace:. not found in the project`, run `yarn install` again so `yarn.lock` matches the package name in `package.json`.

### 2. Start PostgreSQL

```bash
docker compose -f docker-compose.prod.yml up -d db
```

### 3. Run migrations

```bash
yarn migrate
```

### 4. Start the API

```bash
yarn dev
```

Swagger UI:

- http://localhost:3000/swagger/docs

## Social Login Endpoints

Role is determined by the route, not by a request-body field.

- `POST /customer/google/verify-token`
- `POST /driver/google/verify-token`
- `POST /customer/facebook/verify-token`
- `POST /driver/facebook/verify-token`

Google requests send `idToken`. Facebook requests send `accessToken` and may send an empty `idToken` when using the access-token flow.

## Scripts

- `yarn dev`: start the API in development mode with file watching
- `yarn build`: compile TypeScript to `dist`
- `yarn start`: build and run the production bundle
- `yarn format`: format source files with Prettier
- `yarn format:check`: verify formatting
- `yarn migrate`: apply pending database migrations
- `yarn migration:create`: create a new migration file
- `yarn migration:down`: roll back the latest migration

## Database Migrations

- Migration files live in `src/datasource/migrations`.
- Create a migration for every schema or enum change.
- Recommended workflow:
  1. Generate the migration.
  2. Apply it with `yarn migrate`.
  3. Verify application startup and affected endpoints.
  4. Commit the migration with the related code changes.

## Deployment

### Build the production image

```bash
docker build -t <registry>/busgo-backend:latest -f Dockerfile.prod .
```

### Run with Docker Compose

```bash
docker compose -f docker-compose.prod.yml up -d
```

Keep production credentials in environment files or your secret manager. Do not hardcode secrets in compose files committed to source control.

### Post-deploy checks

- `GET /health` returns success
- `GET /swagger/docs/json` is reachable
- Database migrations are up to date
- Logs show no startup, authentication, or database errors

## Security Notes

- Rotate `JWT_SECRET` and provider credentials on a regular schedule.
- Restrict database network access and take backups before destructive migrations.
- Treat social-login tokens as short-lived credentials and verify them server-side before issuing application JWTs.
- Monitor API errors, latency, and authentication failures in production.

## Troubleshooting

- **Database connection errors**: verify `DB_URL`, container health, and the exposed PostgreSQL port.
- **Migration failures**: inspect the latest migration and compare it with the live schema.
- **401 or 403 responses**: confirm `JWT_SECRET`, token expiry, and role checks for the target route.
- **Swagger unavailable**: confirm the process is listening on the configured `HOST` and `PORT`.
- **Yarn workspace errors after renaming the package**: run `yarn install` to refresh `yarn.lock`.
