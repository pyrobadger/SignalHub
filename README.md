# PrimeTrade SignalHub 📈🔐

PrimeTrade SignalHub is a production-grade, highly available cryptocurrency signal management platform. Built to demonstrate enterprise-level backend engineering, security, external API resilience, logging, testing, and system scalability, this project features a robust Express layered backend and a premium glassmorphic React terminal frontend.

---

## Architecture & System Design

We implement a strict **Layered Architecture (N-Tier)**. Business logic, routing, input verification, database communication, and external API calls are completely isolated to ensure maintainability, testing isolation, and horizontal scalability.

```
                  ┌────────────────────────────────────────┐
                  │          Client React Web App          │
                  └───────────────────┬────────────────────┘
                                      │ (HTTPS / REST)
                                      ▼
                  ┌────────────────────────────────────────┐
                  │             Express Router             │
                  │   - Security Headers (Helmet)          │
                  │   - CORS Verification                  │
                  │   - Request Rate Limiting              │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │       Middleware & Guard Layer         │
                  │   - Correlation ID injector            │
                  │   - Winston Request Logger             │
                  │   - Zod Request Validator              │
                  │   - JWT Authenticator                  │
                  │   - Role-Based Access Control (RBAC)   │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │              Controllers               │
                  │   - Extracts request inputs            │
                  │   - Coordinates service actions        │
                  │   - Structures standardized responses  │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │                Services                │
                  │   - Encapsulates business logic        │
                  │   - Integrates external APIs           │
                  │   - Manages token rotation lifecycle   │
                  │   - Triggers persistent Audit Logs     │
                  └───────────┬────────────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
┌───────────────────────┐           ┌───────────────────────┐
│     Repositories      │           │    Resilient HTTP     │
│   - Isolates Queries  │           │      Price Client     │
│   - Prisma ORM        │           │  - 5000ms Timeout     │
└───────────┬───────────┘           │  - Exponential Backoff│
            │                       │  - Providers Failover │
            ▼                       └───────────────────────┘
┌───────────────────────┐
│ PostgreSQL / Supabase │
└───────────────────────┘
```

### Database Schema (Prisma Models)

Our database is structured into four primary models with relations:

*   **`User`**: Manages access details, password hashing, and user roles (`USER` or `ADMIN`).
*   **`Signal`**: Stores trading directions, target prices, entry thresholds, active statuses, and links to the creator (`User`).
*   **`RefreshToken`**: Holds cryptographically secure refresh session keys linked to the `User`.
*   **`AuditLog`**: Registers database changes for audit tracking (`USER_REGISTERED`, `USER_LOGIN`, `SIGNAL_CREATED`, `SIGNAL_UPDATED`, `SIGNAL_DELETED`).

---

## Advanced Production Implementations

### 1. Resilient External Market Price Integration (`httpClient.js`)
External cryptocurrency price retrieval uses a custom client engineered for network resiliency:
*   **Timeout Guard**: Any external request is forcefully aborted after **5000ms** to prevent thread blockage.
*   **Exponential Backoff Retry**: If a call fails due to timeouts or network hiccups, the client retries **3 times** with progressive wait intervals (`delay = 2^attempt * 200ms`).
*   **Graceful API Failover**: On a primary provider outage (**Binance API**), the client automatically switches to a secondary provider (**CoinCap API**). If all providers fail, a local emergency pricing fallback provides uptime for major pairs (BTC, ETH, SOL, BNB).
*   **Cache-Aside Pattern**: Prices are stored in a **Redis** or **In-Memory** cache with a **15-second TTL** to avoid rate limit bans.

### 2. Standardized JSON Logging & End-to-End Tracing
*   **Winston Logger**: Writes structured JSON logs to `logs/app.log` in production, and pretty-prints them in dev mode.
*   **Correlation ID Middleware**: Evaluates incoming headers for `X-Correlation-ID` or generates a new UUID. This correlation ID is bound to the request lifecycle and automatically appended to every Winston log generated within that request, facilitating seamless log auditing.
*   **Audit Logging**: Key actions write permanent records to the database (`AuditLog` table).

### 3. Bulletproof Authentication & Refresh Token Rotation
*   **Access Token**: JWT containing user information (`id`, `email`, `role`) with an expiry of **15 minutes**.
*   **Refresh Token**: Long-lived secure token with an expiry of **7 days** stored in the database.
*   **Token Rotation (RTR)**: On token refreshes, the previous refresh token is immediately deleted, and a rotated token is issued. This blocks refresh replay attacks.
*   **Axios Interceptor**: The React client intercepts `401 Unauthorized` responses, silently executes a token refresh behind the scenes, and transparently retries the user's original request.

---

## Technical Stack

*   **Backend**: Node.js, Express.js, PostgreSQL, Prisma ORM, JWT, Bcryptjs, Winston, Zod, Swagger (OpenAPI 3.0), Jest, Supertest, Redis.
*   **Frontend**: React (Vite), Axios, React Router v6, Lucide React, Custom HSL Obsidian CSS.
*   **DevOps**: Docker, Docker Compose, Nginx.

---

## Environment Variables

### Backend Configuration (`backend/.env`)
Create a file named `.env` in the `backend/` directory:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://signalhub_admin:secure_db_password_99@localhost:5432/signalhub_prod?schema=public"
REDIS_URL="redis://localhost:6379"

JWT_ACCESS_SECRET="super_secret_access_key_158329"
JWT_REFRESH_SECRET="super_secret_refresh_key_982314"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY="7d"

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

CORS_ORIGIN="http://localhost:5173"
```

---

## Quickstart Guide

### 🐳 Method A: Run via Docker Compose (Recommended)
Launch the entire system (Database, Caching, Backend, and Frontend) in one command:
```bash
docker compose up --build
```
*   **React Frontend**: [http://localhost](http://localhost) (Served via Nginx)
*   **Express Backend**: [http://localhost:5000](http://localhost:5000)
*   **Swagger API Documentation**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
*   **Health Metrics Endpoint**: [http://localhost:5000/health](http://localhost:5000/health)

### 💻 Method B: Run Locally (Development Setup)

#### 1. Setup PostgreSQL Database
Run a PostgreSQL server or utilize a hosted provider (e.g. Supabase), and update `DATABASE_URL` in `backend/.env`.

#### 2. Install and Initialize Backend
```bash
cd backend
npm install
npx prisma db push    # Sync Prisma schema to DB
npm run prisma:seed   # Seed default users and signals
npm run dev           # Start Express Nodemon server
```
*   **Admin Credential**: `admin@primetrade.com` / `AdminPass123!`
*   **Standard User**: `john@primetrade.com` / `UserPass123!`

#### 3. Run Automated Tests
Execute the Jest + Supertest suite (tests mock DB layers, making them fast and self-contained):
```bash
npm test
```

#### 4. Install and Start Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Core System Scalability Section

To transition PrimeTrade SignalHub to support millions of concurrent trading terminals, the following enterprise scaling patterns are recommended:

### 1. Horizontal Scaling & High Availability
*   **Stateless Backend Nodes**: Our backend processes are fully stateless. Session configurations are avoided, and JWT structures verify user states signature-side. This allows backend containers to be replicated horizontally (`docker-compose scale backend=5` or Kubernetes replicas) behind a **Load Balancer** (AWS ALB or Nginx).
*   **Sticky Sessions Alternative**: By utilizing JWT tokens inside request headers rather than cookies, requests from any user can be routed to *any* active backend container instance without synchronization issues.

### 2. Resilient Caching Layers
*   **Multi-Level Cache**:
    *   **Level 1 (Memory)**: Fast in-process caches (e.g., node-cache) for hot environment configurations.
    *   **Level 2 (Redis)**: Distributed caching for live market prices, active user states, and rate-limiting counters. Under spikes, the Redis cache absorbs up to 95% of reads, isolating our primary PostgreSQL database.

### 3. Database Scaling (Read Replicas & Connection Pooling)
*   **Prisma Client Read Replicas**: In trading systems, read requests (viewing dashboards, signals, and price ticker history) outweigh writes (creating/modifying signals) by 10:1. Deploying **PostgreSQL Read Replicas** via Supabase or AWS RDS allows routing all SELECT queries to read-only replicas, reserving the primary database node exclusively for write operations.
*   **Connection Pooling (PgBouncer)**: Serverless functions or horizontal backend instances can exhaust PostgreSQL connection limits. Running PgBouncer in front of the database handles connection pooling efficiently.

### 4. Asynchronous Queue Systems (Message Brokers)
*   **Audit Logging Offloading**: Writing database logs on every user click causes network latency. Offloading these tasks by pushing logs to a message queue (**RabbitMQ** or **Apache Kafka**) allows a lightweight worker pool to persist logs to disk asynchronously, keeping HTTP responses snappy.

### 5. Microservice Migration Pathway
As engineering teams scale, the codebase can be split into microservices:
1.  **Auth Service**: Handles registrations, logins, JWT signing, and session refreshes.
2.  **Signals Service**: Focuses purely on Signal CRUD, querying database tables, and publishing event triggers.
3.  **Market Data Feed Service**: A Go or Rust-based websocket client that maintains open sockets with Binance and pushes live price changes to clients via WebSockets, completely replacing the polling API.
