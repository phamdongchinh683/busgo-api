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
  - Upstash / Redis Cloud example: `rediss://default:your-password@your-host:6379`
  - The code only supports connecting via `REDIS_URL` (no more separate REDIS_HOST/PORT variables).

### Other Important Variables

- `APP_ENV=local` — Disables SSL for local Postgres, enables Swagger UI
- `CRON_SECRET` — Protects internal `/job/*` scheduled task endpoints

### Integrations (only needed when using the feature)

- **Stripe**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, ...
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

---

## Database Diagram

The database is PostgreSQL, split by business schema: `auth`, `organization`, `operation`, `booking`, `payment`, and `chat`.

```mermaid
erDiagram
    AUTH_USER ||--o| AUTH_STAFF_PROFILE : has_profile
    AUTH_USER ||--o{ AUTH_USER_DEVICE : owns_devices
    AUTH_USER ||--o{ AUTH_NOTIFICATION : receives
    AUTH_USER ||--o{ AUTH_USER_OTP : verifies_contact
    AUTH_USER ||--o{ BOOKING_BOOKING : creates_bookings
    AUTH_USER ||--o{ ORGANIZATION_COMPANY_DRIVER : works_for
    AUTH_USER ||--o{ ORGANIZATION_DRIVER_MONTHLY_STAT : has_stats
    AUTH_USER ||--o{ ORGANIZATION_BUS_COMPANY_REVIEW : writes_reviews
    AUTH_USER ||--o{ BOOKING_PROMOTION_NEW : creates_promotions
    AUTH_USER ||--o{ PAYMENT_CUSTOMER_PAYMENT_METHOD : owns_payment_methods
    AUTH_USER ||--o{ CHAT_BOX : starts_or_receives
    AUTH_USER ||--o{ CHAT_MESSAGE : sends_messages

    ORGANIZATION_BUS_COMPANY ||--o{ AUTH_STAFF_PROFILE : employs_staff
    ORGANIZATION_BUS_COMPANY ||--o{ ORGANIZATION_VEHICLE : owns_vehicles
    ORGANIZATION_BUS_COMPANY ||--o{ ORGANIZATION_COMPANY_DRIVER : assigns_drivers
    ORGANIZATION_BUS_COMPANY ||--o{ ORGANIZATION_BUS_COMPANY_REVIEW : receives_reviews
    ORGANIZATION_BUS_COMPANY ||--o{ OPERATION_STATION : manages_stations
    ORGANIZATION_BUS_COMPANY ||--o{ OPERATION_TRIP_SCHEDULE : publishes_schedules
    ORGANIZATION_BUS_COMPANY ||--o{ OPERATION_TRIP_STOP_TEMPLATE : defines_stops
    ORGANIZATION_BUS_COMPANY ||--o{ OPERATION_TRIP_PRICE_TEMPLATE : defines_prices
    ORGANIZATION_BUS_COMPANY ||--o{ BOOKING_COUPON : owns_coupons

    ORGANIZATION_VEHICLE ||--o{ ORGANIZATION_SEAT : contains_seats
    ORGANIZATION_VEHICLE ||--o{ OPERATION_TRIP : assigned_to_trips
    ORGANIZATION_SEAT ||--o{ BOOKING_TICKET : reserved_on_tickets
    ORGANIZATION_SEAT ||--o{ BOOKING_SEAT_SEGMENT : blocks_segments

    OPERATION_ROUTE ||--o{ OPERATION_TRIP_SCHEDULE : schedules
    OPERATION_ROUTE ||--o{ OPERATION_TRIP : used_by_trips
    OPERATION_ROUTE ||--o{ OPERATION_TRIP_STOP_TEMPLATE : defines_stop_order
    OPERATION_ROUTE ||--o{ OPERATION_TRIP_PRICE_TEMPLATE : prices_segments
    OPERATION_TRIP_SCHEDULE ||--o{ OPERATION_TRIP : creates_trip_instances
    OPERATION_TRIP_SCHEDULE ||--o{ OPERATION_TRIP_STOP_TEMPLATE : has_stop_templates
    OPERATION_STATION ||--o{ OPERATION_TRIP_STOP_TEMPLATE : appears_in_stops
    OPERATION_STATION ||--o{ OPERATION_TRIP_PRICE_TEMPLATE : price_endpoint
    OPERATION_STATION ||--o{ BOOKING_TICKET : pickup_or_dropoff
    OPERATION_STATION ||--o{ BOOKING_SEAT_SEGMENT : segment_endpoint
    OPERATION_TRIP ||--o{ BOOKING_TICKET : has_tickets
    OPERATION_TRIP ||--o{ BOOKING_SEAT_SEGMENT : blocks_seats

    BOOKING_COUPON ||--o{ BOOKING_BOOKING : applied_to
    BOOKING_BOOKING ||--o{ BOOKING_TICKET : contains_tickets
    BOOKING_BOOKING ||--o| PAYMENT_PAYMENT : paid_by
    BOOKING_TICKET ||--o{ BOOKING_SEAT_SEGMENT : reserves_segments
    BOOKING_TICKET ||--o| ORGANIZATION_BUS_COMPANY_REVIEW : can_be_reviewed

    CHAT_BOX ||--o{ CHAT_MESSAGE : contains_messages

    AUTH_USER {
        int id PK
        string password
        string full_name
        string email UK
        string phone UK
        string role
        string status
        int token_version
        string account_stripe_id
        boolean is_phone_verified
        datetime last_change_contact
        datetime created_at
        datetime updated_at
    }

    AUTH_STAFF_PROFILE {
        int id PK
        int user_id FK
        string role
        int company_id FK
        string staff_code
        string position
        string department
        string identity_number
        datetime hire_date
        string status
        datetime created_at
        datetime updated_at
    }

    AUTH_USER_DEVICE {
        int id PK
        int user_id FK
        string fcm_token UK
        datetime created_at
        datetime updated_at
    }

    AUTH_NOTIFICATION {
        int id PK
        int user_id FK
        string title
        string body
        boolean is_read
        string data
        datetime created_at
        datetime updated_at
    }

    AUTH_USER_OTP {
        int id PK
        string email UK
        string phone UK
        string otp
        datetime expires_at
        datetime created_at
    }

    ORGANIZATION_BUS_COMPANY {
        int id PK
        string name
        string hotline
        string logo_url
        string address
        decimal latitude
        decimal longitude
        int review_count
        decimal review_avg_stars
        datetime created_at
        datetime updated_at
    }

    ORGANIZATION_VEHICLE {
        int id PK
        string plate_number UK
        string type
        int company_id FK
        int total_seats
        string status
        datetime created_at
        datetime updated_at
    }

    ORGANIZATION_SEAT {
        int id PK
        int vehicle_id FK
        string seat_number
        int type
        datetime created_at
        datetime updated_at
    }

    ORGANIZATION_COMPANY_DRIVER {
        int id PK
        int user_id FK
        int company_id FK
        datetime created_at
        datetime updated_at
    }

    ORGANIZATION_DRIVER_MONTHLY_STAT {
        int id PK
        int driver_id FK
        int year
        int month
        int completed_trip_count
        int cancelled_trip_count
        datetime created_at
        datetime updated_at
    }

    ORGANIZATION_BUS_COMPANY_REVIEW {
        int id PK
        int company_id FK
        int user_id FK
        int ticket_id FK
        int rating
        string comment
        datetime created_at
        datetime updated_at
    }

    OPERATION_ROUTE {
        int id PK
        string from_location
        string to_location
        decimal distance_km
        int duration_minutes
        datetime created_at
        datetime updated_at
    }

    OPERATION_STATION {
        int id PK
        string address
        string city
        int company_id FK
        datetime created_at
        datetime updated_at
    }

    OPERATION_TRIP_SCHEDULE {
        int id PK
        int company_id FK
        int route_id FK
        time departure_time
        date start_date
        date end_date
        boolean status
        datetime created_at
        datetime updated_at
    }

    OPERATION_TRIP {
        int id PK
        int route_id FK
        int vehicle_id FK
        int schedule_id FK
        int driver_id FK
        date departure_date
        string status
        datetime created_at
        datetime updated_at
    }

    OPERATION_TRIP_STOP_TEMPLATE {
        int id PK
        int schedule_id FK
        int station_id FK
        int company_id FK
        int route_id FK
        int stop_order
        boolean allow_pickup
        boolean allow_dropoff
        datetime created_at
        datetime updated_at
    }

    OPERATION_TRIP_PRICE_TEMPLATE {
        int id PK
        int company_id FK
        int route_id FK
        int from_station_id FK
        int to_station_id FK
        decimal price
        boolean status
        datetime created_at
        datetime updated_at
    }

    BOOKING_COUPON {
        int id PK
        string code UK
        string discount_type
        decimal discount_value
        decimal min_order_amount
        decimal max_discount_amount
        int total_quantity
        int used_quantity
        datetime start_date
        datetime end_date
        boolean is_active
        int company_id FK
        datetime created_at
        datetime updated_at
    }

    BOOKING_BOOKING {
        int id PK
        int user_id FK
        int coupon_id FK
        string code UK
        string booking_type
        decimal original_amount
        decimal discount_amount
        decimal total_amount
        string status
        datetime expired_at
        datetime created_at
        datetime updated_at
    }

    BOOKING_TICKET {
        int id PK
        int booking_id FK
        int trip_id FK
        int seat_id FK
        int from_station_id FK
        int to_station_id FK
        string status
        datetime created_at
        datetime updated_at
    }

    BOOKING_SEAT_SEGMENT {
        int id PK
        int trip_id FK
        int seat_id FK
        int from_station_id FK
        int to_station_id FK
        int ticket_id FK
        datetime created_at
        datetime updated_at
    }

    BOOKING_PROMOTION_NEW {
        int id PK
        string title
        string content
        string image_url
        boolean is_active
        string start_date
        string end_date
        int created_by FK
        datetime created_at
        datetime updated_at
    }

    PAYMENT_PAYMENT {
        int id PK
        int booking_id FK
        decimal amount
        string method
        string status
        string transaction_code
        datetime paid_at
        string pay_date
        string transaction_no
        datetime created_at
        datetime updated_at
    }

    PAYMENT_CUSTOMER_PAYMENT_METHOD {
        int id PK
        int user_id FK
        string stripe_customer_id
        string stripe_payment_method_id UK
        string brand
        string last4
        int exp_month
        int exp_year
        boolean is_default
        datetime created_at
        datetime updated_at
    }

    CHAT_BOX {
        int id PK
        int sender_id FK
        int receiver_id FK
        string last_message
        int created_by FK
        int sender_message_count
        int receiver_message_count
        int unread_receiver_count
        int unread_sender_count
        int last_message_sender_id FK
        datetime created_at
        datetime updated_at
    }

    CHAT_MESSAGE {
        int id PK
        int box_id FK
        int sender_id FK
        string body
        datetime created_at
        datetime updated_at
    }
```

---

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

**Required for production:** Set `REDIS_URL=rediss://...` (from Upstash or similar managed Redis). The app now **only** connects to Redis using `REDIS_URL`.

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
