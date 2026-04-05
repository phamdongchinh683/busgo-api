# Bus Ticketing System – Backend API

Backend for a **bus ticketing system**: multiple bus companies, routes, trip schedules, seat booking, online payments, and background cron jobs.

- **Multi-tenant**: Each bus company has its own admins, drivers, vehicles, and trips.
- **Roles**: Super admin, company admin (operator / support / accountant), driver, customer.
- **Stack**: Fastify, TypeScript, PostgreSQL (Kysely), Docker.

## What it does

- **Super admin**: Dashboard stats, manage bus companies, company admins, and users.
- **Company admin**: Manage drivers, staff, vehicles, profile; operators handle stations, trip schedules, and price templates; support handles tickets and coupons; accountants handle payments and revenue.
- **Drivers**: View trips, passengers, and perform check-in.
- **Customers**: Sign up, search trip schedules, book seats, manage tickets and coupons.
- **Payments**: Payment method creation, VNPay IPN webhook.
- **Background jobs**: Expire unpaid bookings via a separate cron runner process.


## 🚀 Features

- ⚡ **Fastify** – High-performance web framework
- 📝 **TypeScript** – Type-safe development
- 📚 **Swagger/OpenAPI** – Interactive API documentation
- 🔐 **JWT Authentication** – Role-based access (admin, driver, customer)
- ✅ **Zod Schema Validation** – Request/response validation
- 🗄️ **Kysely** – Type-safe SQL with PostgreSQL
- 🐳 **Docker** – Database and production deployment
- 🔄 **Migrations** – Version-controlled schema (Kysely)

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Yarn** (v4.11.0 or higher) - Managed via Corepack
- **Docker & Docker Compose** (for database and containerized deployment)
- **PostgreSQL** (via Docker or local installation)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd backend-fastify-setting
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DB_URL=postgres://app_user:app_password@localhost:5432/app_db

# Auth
JWT_SECRET=your-secret-key

# Server
PORT=3000
HOST=127.0.0.1

# App
APP_ENV=local
NODE_ENV=development

# VNPay (optional - for payment integration)
VNPAY_TMN_CODE=your-terminal-code
VNPAY_SECRET=your-secret-key
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://127.0.0.1:3000/payment/vnpay/ipn
```

### 4. Start the Database

Start the database using Docker Compose:

```bash
docker compose -f docker-compose.db.yml up -d
```

### 5. Run Database Migrations

```bash
yarn migrate
```

## 🏃 Running the Project

### Development Mode

Run the API server with hot-reload:

```bash
yarn dev
```

The server will start on `http://127.0.0.1:3000` (or the port specified in your `.env` file).

Run cron jobs in a separate terminal:

```bash
yarn cron-dev
```

### Production Mode

#### Local Production Build

```bash
# Build the project
yarn build

# Start API server
yarn start

# Start cron runner (separate process)
yarn cron-start
```

#### Docker Production

```bash
# Build the Docker image
docker build -t phamdongchinh683/backend-fastify:latest -f Dockerfile.prod .

# Run the container
docker run -p 3000:3000 \
  -e APP_ENV=production \
  -e DB_URL=postgres://app_user:app_password@localhost:5432/app_db \
  phamdongchinh683/backend-fastify:latest

# Or use docker-compose for production
docker compose -f docker-compose.prod.yml up -d
```

This starts 3 services:
- `api`: Fastify API server
- `job`: cron runner (`yarn cron-start`)
- `db`: PostgreSQL

## 📖 API Documentation

Once the server is running, access the Swagger UI documentation at:

```
http://localhost:3000/swagger/docs
```

The API documentation includes:
- Interactive endpoint testing
- Request/response schemas
- Bearer (JWT) authentication
- Tags by area: super-admin, company-admin, driver, customer, payment

## 🐳 Docker Setup

### Docker Compose Files

The project includes two Docker Compose files:

- **`docker-compose.db.yml`** - Database service for local development
  - PostgreSQL 15
  - Database: `app_db`
  - User: `app_user`
  - Password: `app_password`
  - Port: `5433`
  - Persistent volume: `pg_data`

- **`docker-compose.prod.yml`** - Production deployment
  - Uses `phamdongchinh683/backend-fastify:latest` for both API and cron services
  - Runs cron in a dedicated `job` container
  - Uses `.env` file for configuration
  - API port: `3000`
  - Database: `app`, User: `app`, Password: `secret` (configure via `DB_URL` in `.env`)

#### Docker Compose Commands

```bash
# Start database for local development
docker compose -f docker-compose.db.yml up -d

# Stop database
docker compose -f docker-compose.db.yml down

# View database logs
docker compose -f docker-compose.db.yml logs -f

# Production deployment
docker compose -f docker-compose.prod.yml up -d

# Recreate production services
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### Dockerfile

The project includes `Dockerfile.prod` for production builds:

- **Builder stage**: Installs dependencies and builds TypeScript
- **Runner stage**: Minimal runtime image with compiled code

The Dockerfile:
- Uses Node.js 22 Alpine for smaller image size
- Enables Corepack for Yarn 4 support
- Includes compiled code from builder stage

## 🗄️ Database Setup

### Database Configuration

The default database setup uses:

- **Database Name**: `app_db`
- **Username**: `app_user`
- **Password**: `app_password`
- **Port**: `5432`

### Migrations

#### Run Migrations

```bash
# Run all pending migrations
yarn migrate
```

#### Create a New Migration

```bash
yarn migration:create migration_name
```

#### Rollback Migration

```bash
yarn migration:down
```

### Database Connection

The application uses Kysely for type-safe database queries. Connection configuration is in `src/datasource/db.ts`.

**Connection String Format:**
```
postgres://[user]:[password]@[host]:[port]/[database]
```

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `yarn dev` | Start development server with hot-reload |
| `yarn cron-dev` | Start cron runner in development (tsx) |
| `yarn build` | Build TypeScript to JavaScript |
| `yarn start` | Start production server (runs `build` first) |
| `yarn cron-start` | Start compiled cron runner (`dist/cron/index.js`) |
| `yarn format` | Format code using Prettier |
| `yarn format:check` | Check code formatting without changes |
| `yarn migrate` | Run database migrations |
| `yarn migration:create` | Create a new migration file |
| `yarn migration:down` | Rollback last migration |

## 🔧 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_URL` | PostgreSQL connection string | - | ✅ Yes |
| `JWT_SECRET` | Secret key for signing/verifying JWT | - | ✅ Yes |
| `PORT` | Server port | `3000` | No |
| `HOST` | Listen address | `127.0.0.1` (dev) / `0.0.0.0` (prod) | No |
| `APP_ENV` | Environment (`local`, `development`, `production`) | `local` | No |
| `NODE_ENV` | Node environment | `development` | No |
| `CORS_ORIGIN` | Allowed CORS origin | `*` | No |
| `VNPAY_TMN_CODE` | VNPay terminal code | - | No (payment) |
| `VNPAY_SECRET` | VNPay secret key | - | No (payment) |
| `VNPAY_URL` | VNPay payment URL | - | No (payment) |
| `VNPAY_RETURN_URL` | VNPay IPN callback URL | - | No (payment) |

### Environment-Specific Behavior

- **`APP_ENV=local`**: Disables SSL for database connections
- **`APP_ENV!=local`**: Enables SSL with `rejectUnauthorized: false`

## 📁 Project Structure

```
backend-fastify-setting/
├── src/
│   ├── api/                    # API route handlers (path = URL)
│   │   ├── auth/               # Sign-in, password
│   │   ├── super-admin/        # Dashboard, users, company-admins, bus-company
│   │   ├── company-admin/     # Profile, drivers, staff, vehicles
│   │   ├── company-admin-operator/    # Stations, trip-schedule, trip-price-template
│   │   ├── company-admin-support/     # Tickets, coupons
│   │   ├── company-admin-accountant/  # Payments, revenue
│   │   ├── driver/             # Trips, passengers, check-in
│   │   ├── customer/           # Sign-up, booking, tickets, trips, coupons
│   │   ├── payment/            # Method, VNPay IPN
│   │   └── public/             # Public endpoints
│   ├── app/                    # Fastify setup, JWT, errors, plugins
│   ├── business/               # Business logic (auth, booking, payment, organization, operation)
│   ├── cron/                   # Cron runner entry point
│   ├── database/               # Kysely queries/commands (auth, booking, payment, organization, operation)
│   ├── datasource/             # db.ts, migrations
│   ├── job/                    # Background jobs (expire-booking, etc.)
│   ├── model/                  # body/, query/, params/ (Zod schemas)
│   ├── service/                # External services (VNPay)
│   └── utils/                  # password, common helpers
├── Dockerfile.prod
├── docker-compose.db.yml       # PostgreSQL for local dev
├── docker-compose.prod.yml
├── kysely.config.ts
├── package.json
└── README.md
```

## 🚢 CI/CD

The project includes CI/CD pipelines for automated Docker builds and deployments:

**Setup:**
1. Create a repository on Docker Hub
2. Add GitHub Secrets: `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`
3. Push to `dev` branch to trigger the workflow

### Jenkins

Jenkins pipeline (`Jenkinsfile`) that:
- Loads production environment variables
- Installs dependencies and builds the project
- Runs database migrations
- Deploys to production using `docker-compose.prod.yml`

**Setup:**
1. Configure Jenkins credentials:
   - `env`: JSON file with environment variables
   - `dockerhub-creds`: Docker Hub username/password (if needed)
2. The pipeline will build and deploy automatically on trigger

## 🐛 Troubleshooting

### Database Connection Issues

**Error: `role "app_user" does not exist`**

- Ensure the database container is running: `docker ps`
- Verify you're connecting to the correct database instance
- Reset the database volume:
  ```bash
  docker compose -f docker-compose.db.yml down -v
  docker compose -f docker-compose.db.yml up -d
  ```

**Error: `getaddrinfo ENOTFOUND`**

- This occurs when the app can't resolve the database hostname
- Ensure the database container is running: `docker ps`
- Verify the database connection string in your `.env` file matches the database service

### Migration Issues

**Error: `No config file found`**

- Ensure `kysely.config.ts` exists in the project root
- Verify the file is copied into the Docker image

**Error: `Cannot find module './src/datasource/db'`**

- Ensure `src/` directory is copied into the Docker image
- Check that `kysely.config.ts` uses correct import paths

### Docker Build Issues

**Error: `/.yarn: not found`**

- The `.yarn` directory may not be committed to git
- The Dockerfile handles this by only copying `.yarnrc.yml`
- Ensure `.yarnrc.yml` exists in the project root

**Error: `docker: not found`**

- Docker is not installed or not in PATH on the Jenkins agent
- Install Docker on the Jenkins agent or use an agent with Docker pre-installed
- Ensure Docker socket is accessible if using Docker-in-Docker

## 🧪 Development

### Code Formatting

This project uses Prettier and ESLint for code quality:

```bash
# Format code
yarn format

# Check formatting
yarn format:check
```

### Type Checking

TypeScript is configured with strict mode. Check types:

```bash
yarn build
```

