# GymPro System Architecture

> Version: 1.0.0 | Last Updated: 2026-05-30 | Status: Production

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Repository Structure](#2-repository-structure)
3. [Tech Stack](#3-tech-stack)
4. [Backend Module Architecture](#4-backend-module-architecture)
5. [API Design](#5-api-design)
6. [Multi-Tenant Data Model](#6-multi-tenant-data-model)
7. [Real-time Architecture](#7-real-time-architecture)
8. [Queue Architecture](#8-queue-architecture)
9. [Observability](#9-observability)
10. [Infrastructure](#10-infrastructure)
11. [Scalability Approach](#11-scalability-approach)
12. [Security Layers](#12-security-layers)

---

## 1. System Overview

GymPro is an enterprise-grade Software-as-a-Service (SaaS) gym management platform designed to operate at scale across thousands of fitness facilities. It provides a unified control plane for gym operators, trainers, and members — consolidating member management, billing, attendance, workout planning, nutrition, engagement, and analytics into a single, multi-tenant system.

### Scale Targets

| Dimension          | Target                        |
|--------------------|-------------------------------|
| Gym tenants        | 1,000+ independent gyms       |
| Active members     | 1,000,000+ members            |
| Concurrent users   | 50,000+ simultaneous sessions |
| API throughput     | 10,000+ requests/minute       |
| Real-time events   | 100,000+ socket events/minute |
| Data retention     | 5+ years per tenant           |

### Business Purpose

GymPro replaces fragmented point-of-sale, spreadsheet, and legacy desktop software that most small-to-mid gym operators rely on. By delivering a cloud-native, API-first platform with a mobile-ready web frontend and native mobile apps, GymPro enables gym businesses to:

- Automate membership billing and renewal reminders
- Track attendance with digital check-in and biometric device integration
- Deliver personalised workout and diet plans at scale
- Retain members through gamification, community, and engagement features
- Make data-driven decisions with built-in analytics and AI intelligence
- Operate multi-branch networks under a single administrative umbrella
- White-label the platform for enterprise gym chains and franchise networks

---

## 2. Repository Structure

GymPro uses a **pnpm monorepo** with workspaces defined in `pnpm-workspace.yaml`. All applications live under the `apps/` directory. Shared configuration, Docker orchestration, and infrastructure files live at the repository root.

```
MyGym/gympro/
├── pnpm-workspace.yaml           # Workspace definition: packages: ["apps/*"]
├── package.json                  # Root package (scripts, devDependencies)
├── pnpm-lock.yaml
├── Dockerfile                    # Shared multi-stage build for backend + worker
├── docker-compose.yml            # Local development: redis, backend, worker, nginx, prometheus, grafana
├── docker-compose.prod.yml       # Production overrides
├── prometheus.yml                # Prometheus scrape configuration
├── prometheus.rules.yml          # Alerting rules
│
├── apps/
│   ├── backend/                  # Express 5 API server (Node.js / TypeScript)
│   │   ├── prisma/
│   │   │   └── schema.prisma     # Single source of truth for database schema
│   │   ├── src/
│   │   │   ├── app.ts            # Express application factory (middleware + routes)
│   │   │   ├── server.ts         # HTTP server bootstrap (Socket.IO init, listen)
│   │   │   ├── config/           # env validation, logger, redis, sentry, database
│   │   │   ├── middleware/       # Auth, roles, metrics, rate limits, request ID, audit, upload
│   │   │   ├── modules/          # 40+ domain feature modules (see Section 4)
│   │   │   ├── queues/           # BullMQ queue definitions, DLQ, redis connection
│   │   │   ├── workers/          # Separate worker process entry point
│   │   │   ├── realtime/         # Socket.IO server, auth, events, rooms
│   │   │   ├── monitoring/       # Prometheus metrics (HTTP, queue, socket, system)
│   │   │   ├── jobs/             # Scheduled/recurring job definitions
│   │   │   ├── events/           # Internal event emitter bus
│   │   │   ├── utils/            # Shared utilities
│   │   │   ├── types/            # Shared TypeScript types and interfaces
│   │   │   ├── constants/        # Application-wide constants
│   │   │   ├── cache/            # Redis cache helpers
│   │   │   ├── routes/           # Top-level route aggregation (if used)
│   │   │   └── test/             # Vitest test suites
│   │   └── package.json
│   │
│   ├── web/                      # Frontend web application (Next.js / React)
│   │   └── ...
│   │
│   └── mobile/                   # Native mobile application (React Native / Expo)
│       └── ...
│
├── docker/
│   ├── nginx/
│   │   └── nginx.conf            # Reverse proxy + SSL termination config
│   ├── grafana/
│   │   └── provisioning/         # Auto-provisioned Grafana dashboards + datasources
│   └── ssl/                      # TLS certificates (mounted into nginx container)
│
├── docs/
│   ├── ARCHITECTURE.md           # This document
│   └── MONITORING.md             # Observability runbook
│
└── scripts/                      # Operational scripts (migrations, seeding, backups)
```

### Workspace Conventions

- Each app in `apps/` is an independent pnpm workspace package with its own `package.json`.
- The root `package.json` only declares shared devDependencies (TypeScript, ESLint, Prettier).
- Commands are scoped with `pnpm --filter backend <script>`. The worker is started with `pnpm --filter backend worker`.
- Docker images are built from the single root `Dockerfile` and the correct entry point is specified per service via the `command:` override in `docker-compose.yml`.

---

## 3. Tech Stack

### Core Runtime

| Category              | Technology                        | Version  | Purpose                                                        |
|-----------------------|-----------------------------------|----------|----------------------------------------------------------------|
| Runtime               | Node.js                           | 20 LTS   | Server-side JavaScript runtime                                 |
| Language              | TypeScript                        | 5.x      | Static typing, compile-time safety, IDE support                |
| Web Framework         | Express                           | 5.x      | HTTP server, routing, middleware pipeline                      |
| Package Manager       | pnpm                              | 9.x      | Fast, disk-efficient monorepo package management               |

### Data Layer

| Category              | Technology                        | Version  | Purpose                                                        |
|-----------------------|-----------------------------------|----------|----------------------------------------------------------------|
| Relational Database   | PostgreSQL (Neon)                 | 16       | Primary datastore; serverless PostgreSQL with branching        |
| ORM                   | Prisma                            | 6.x      | Type-safe database client, schema migrations, query builder    |
| In-Memory Cache       | Redis (ioredis)                   | 7        | Session cache, pub/sub adapter, queue broker                   |

### Async & Real-time

| Category              | Technology                        | Version  | Purpose                                                        |
|-----------------------|-----------------------------------|----------|----------------------------------------------------------------|
| Job Queue             | BullMQ                            | 5.x      | Durable, Redis-backed job queues for notifications and billing |
| WebSockets            | Socket.IO                         | 4.x      | Bidirectional real-time communication (events, live updates)   |
| Socket Adapter        | @socket.io/redis-adapter          | 8.x      | Redis-backed Socket.IO adapter for horizontal scaling          |

### Security & Validation

| Category              | Technology                        | Purpose                                                        |
|-----------------------|-----------------------------------|----------------------------------------------------------------|
| Authentication        | jsonwebtoken (JWT)                | Stateless auth tokens for REST API and Socket.IO               |
| Password Hashing      | bcryptjs                          | Secure password storage with salted hashing                    |
| Security Headers      | Helmet                            | HTTP security headers (HSTS, CSP, X-Frame-Options, etc.)       |
| CORS                  | cors                              | Origin whitelist enforcement                                   |
| Rate Limiting         | express-rate-limit                | Per-route request throttling                                   |
| Validation            | Zod                               | Runtime schema validation on all request bodies                |
| File Uploads          | Multer                            | Multipart form handling with size/type restrictions            |
| File Storage          | Cloudinary                        | Cloud image and file storage for member media                  |

### Observability

| Category              | Technology                        | Purpose                                                        |
|-----------------------|-----------------------------------|----------------------------------------------------------------|
| Metrics Collection    | prom-client                       | Prometheus metrics exposition from Node.js process             |
| Metrics Storage       | Prometheus                        | Time-series metrics database with 30-day retention            |
| Dashboards            | Grafana                           | Metrics visualisation and alerting                             |
| Error Tracking        | Sentry (@sentry/node)             | Real-time error reporting, stack traces, release tracking      |
| HTTP Logging          | Morgan                            | Structured access logs streamed through the Winston logger     |
| App Logging           | Winston (via logger config)       | Structured JSON logging with log levels                        |

### Infrastructure & DevOps

| Category              | Technology                        | Purpose                                                        |
|-----------------------|-----------------------------------|----------------------------------------------------------------|
| Containerisation      | Docker                            | Reproducible build and deployment artefacts                    |
| Orchestration         | Docker Compose                    | Local and production multi-service topology                    |
| Reverse Proxy         | Nginx (alpine)                    | TLS termination, load balancing, static asset serving          |
| Testing               | Vitest                            | Fast unit and integration test runner                          |

---

## 4. Backend Module Architecture

The backend is organised into **42 feature modules** under `apps/backend/src/modules/`. Each module is a self-contained vertical slice that owns its routes, controllers, services, and types. Modules are grouped by business domain below.

### 4.1 Core Infrastructure Modules

These modules provide the foundational capabilities that all other modules depend on.

| Module       | Route Prefix            | Description                                                                                          |
|--------------|-------------------------|------------------------------------------------------------------------------------------------------|
| `health`     | `/api/v1/health`        | Liveness and readiness probes. Checks database connectivity, Redis ping, and queue worker status.   |
| `auth`       | `/api/v1/auth`          | Registration, login, logout, JWT issuance, password reset, and token refresh flows.                 |
| `user`       | `/api/v1/users`         | User profile management, password changes, preferences, and account lifecycle operations.            |
| `gym`        | `/api/v1/gyms`          | Gym entity CRUD. Tenant root — all other entities are scoped to a gym record.                       |
| `branch`     | `/api/v1/branches`      | Multi-branch support for gym chains. Each branch is a child of a parent gym tenant.                 |
| `audit`      | `/api/v1/audit`         | Immutable audit trail of all system actions (CREATE, UPDATE, DELETE, LOGIN, PAYMENT, CHECK_IN).     |
| `upload`     | `/api/v1/uploads`       | Cloudinary-backed file upload with MIME-type validation and size enforcement. Rate-limited.          |

### 4.2 Member Management Modules

Modules that manage the core member lifecycle from acquisition through retention.

| Module       | Route Prefix            | Description                                                                                          |
|--------------|-------------------------|------------------------------------------------------------------------------------------------------|
| `member`     | `/api/v1/members`       | Member CRUD, profile, biometric data, emergency contacts, and member search.                         |
| `membership` | `/api/v1/memberships`   | Plan assignment (Monthly/Quarterly/Half-Yearly/Yearly), renewal, suspension, and history.            |
| `attendance` | `/api/v1/attendance`    | Check-in/check-out logging, attendance history, streak tracking, and device-based check-in.          |
| `due`        | `/api/v1/dues`          | Due tracking (PENDING / PARTIAL / PAID / OVERDUE), partial payment recording, reminders.             |
| `lead`       | `/api/v1/leads`         | Prospect management, lead source tracking, follow-up scheduling, and conversion funnel.              |
| `device`     | *(internal)*            | Integration with biometric/RFID attendance devices for automated check-in events.                   |

### 4.3 Fitness & Wellness Modules

Content and plan delivery for member health outcomes.

| Module           | Route Prefix              | Description                                                                                        |
|------------------|---------------------------|----------------------------------------------------------------------------------------------------|
| `workout`        | `/api/v1/workouts`        | Workout plan creation, assignment to members, and session logging.                                 |
| `exercise`       | `/api/v1/exercises`       | Exercise library with categories, muscle groups, instructions, and media attachments.               |
| `diet`           | `/api/v1/diets`           | Diet plan management and assignment. Links to meal definitions.                                    |
| `diet-builder`   | `/api/v1/diet-builder`    | Interactive diet plan builder with macro calculation and meal templating.                          |
| `progress`       | `/api/v1/progress`        | Member body measurement tracking (weight, body fat, measurements) with trend analysis.             |
| `transformation` | `/api/v1/transformations` | Before/after transformation photos, milestone records, and sharing controls.                       |
| `goal`           | `/api/v1/goals`           | SMART goal setting, progress milestones, completion tracking, and goal history.                    |
| `health`         | *(module)*                | Health assessment data, fitness test results, and medical history notes per member.                |

### 4.4 Financial Modules

All revenue-related operations are handled by this group.

| Module      | Route Prefix         | Description                                                                                             |
|-------------|----------------------|---------------------------------------------------------------------------------------------------------|
| `payment`   | `/api/v1/payments`   | Payment recording, receipt generation, payment method tracking, and reconciliation.                     |
| `billing`   | `/api/v1/billing`    | Automated billing cycles, invoice generation, dunning logic, and subscription state machine.            |

### 4.5 Engagement & Gamification Modules

Features designed to increase member retention and daily active use.

| Module          | Route Prefix             | Description                                                                                         |
|-----------------|--------------------------|-----------------------------------------------------------------------------------------------------|
| `engagement`    | `/api/v1/engagement`     | Engagement scoring, activity feeds, check-in streaks, and member engagement dashboards.             |
| `gamification`  | `/api/v1/gamification`   | Point system, levels, achievements, leaderboards, and reward redemption.                            |
| `badge`         | `/api/v1/badges`         | Badge definition, criteria evaluation, and award issuance for milestones.                           |
| `experience`    | `/api/v1/experience`     | XP (experience points) accumulation system tied to activity completion.                             |
| `community`     | `/api/v1/community`      | Social feed, posts, comments, reactions, and member-to-member interactions.                         |

### 4.6 Analytics & Intelligence Modules

Data and insights for gym operators and trainers.

| Module               | Route Prefix                  | Description                                                                                   |
|----------------------|-------------------------------|-----------------------------------------------------------------------------------------------|
| `analytics`          | `/api/v1/analytics`           | Core gym KPI dashboards: revenue, attendance trends, membership churn, and retention rates.   |
| `reports`            | `/api/v1/reports`             | Scheduled and on-demand report generation (PDF/CSV) for revenue, members, and attendance.     |
| `trainer-analytics`  | `/api/v1/trainer-analytics`   | Trainer-specific metrics: client count, session completion rates, and revenue attribution.    |
| `intelligence`       | `/api/v1/intelligence`        | AI-powered insights: churn prediction, optimal outreach timing, and personalised suggestions. |

### 4.7 Communication Modules

All outbound member and staff communication channels.

| Module          | Route Prefix             | Description                                                                                         |
|-----------------|--------------------------|-----------------------------------------------------------------------------------------------------|
| `notification`  | `/api/v1/notifications`  | In-app notification creation, delivery via Socket.IO, and notification history.                     |
| `communication` | `/api/v1/communication`  | Unified communication hub routing messages across SMS, email, push, and WhatsApp.                   |
| `email`         | *(queue consumer)*       | Email template rendering and delivery via external SMTP/transactional email provider.               |
| `sms`           | *(queue consumer)*       | SMS dispatch via external SMS gateway integration.                                                  |
| `push`          | *(internal)*             | Mobile push notification delivery via FCM/APNs.                                                    |
| `whatsapp`      | *(internal)*             | WhatsApp Business API integration for conversational notifications.                                 |
| `campaign`      | `/api/v1/campaigns`      | Bulk campaign management: audience segmentation, scheduling, and delivery tracking.                 |

### 4.8 Business Operations Modules

Operational tooling for gym staff and management.

| Module        | Route Prefix           | Description                                                                                           |
|---------------|------------------------|-------------------------------------------------------------------------------------------------------|
| `automation`  | `/api/v1/automation`   | Rule-based automation engine: triggers (event/schedule) + actions (notify/tag/assign).                |
| `scalability` | `/api/v1/scalability`  | Infrastructure health endpoints, load shedding controls, and scaling diagnostics.                     |

### 4.9 Enterprise & Platform Modules

Capabilities that support white-label deployments, API resellers, and marketplace integrations.

| Module          | Route Prefix             | Description                                                                                         |
|-----------------|--------------------------|-----------------------------------------------------------------------------------------------------|
| `white-label`   | `/api/v1/white-label`    | Brand customisation per tenant: logos, colour schemes, domain mapping, and custom email footers.    |
| `marketplace`   | `/api/v1/marketplace`    | App/plugin marketplace for third-party integrations purchasable by gym tenants.                     |
| `api-platform`  | `/api/v1/api-platform`   | Developer API key management, usage quotas, webhook configuration, and API docs portal.             |

---

## 5. API Design

### Base URL Structure

All public API endpoints are versioned under `/api/v1/`. This allows non-breaking evolution by introducing `/api/v2/` without removing existing clients.

```
https://api.gympro.io/api/v1/{resource}
```

Health checks are also exposed under the unversioned `/api/health` for compatibility with load balancer probes.

### Middleware Chain

The Express application applies middleware in strict order. The sequence is critical — altering the order can break security, logging accuracy, or tracing.

```
Incoming HTTP Request
        |
        v
[1]  trust proxy (app.set)          — Correct IP when behind Nginx/LB
        |
[2]  Helmet                         — Security headers (HSTS, CSP, X-Frame-Options, referrer policy)
        |
[3]  CORS                           — Origin whitelist enforcement; pre-flight handling
        |
[4]  express.json()                 — JSON body parsing (10 MB limit)
[4]  express.urlencoded()           — Form body parsing (10 MB limit)
        |
[5]  requestIdMiddleware            — Attaches X-Request-ID to req + res for distributed tracing
        |
[6]  auditMiddleware                — Logs user actions to immutable audit trail (async, non-blocking)
        |
[7]  morgan (combined)              — HTTP access log streamed through Winston
        |
[8]  express-rate-limit             — Global 300 req/15 min window; returns 429 with JSON body
        |
[9]  metricsMiddleware              — Prometheus counter + histogram per request
        |
[10] Route handlers                 — Module-specific routes with auth + role guards applied per-route
        |
[11] Sentry.setupExpressErrorHandler — Captures unhandled errors; attaches context (user, gymId)
        |
[12] errorMiddleware                — Normalises all errors to JSON { success, message, code }
```

### Per-Route Rate Limiting

In addition to the global rate limiter, sensitive routes have stricter limits:

| Route Group           | Limiter          | Window    | Max Requests |
|-----------------------|------------------|-----------|--------------|
| `/api/v1/auth`        | `authLimiter`    | 15 min    | 20           |
| `/api/v1/uploads`     | `uploadLimiter`  | 15 min    | 50           |

### Request / Response Conventions

- All successful responses: `{ success: true, data: {...} }`
- All error responses: `{ success: false, message: "...", code: "ERROR_CODE" }`
- HTTP 400 — Validation errors (Zod schema failures)
- HTTP 401 — Missing or invalid JWT
- HTTP 403 — Valid JWT but insufficient role/permission
- HTTP 404 — Resource not found or tenant isolation violation
- HTTP 429 — Rate limit exceeded
- HTTP 500 — Unhandled server errors (captured by Sentry)

### Authentication Headers

```
Authorization: Bearer <jwt_token>
X-Request-ID: <uuid>           (attached by server, propagated in response)
```

---

## 6. Multi-Tenant Data Model

### Tenant Isolation Strategy

GymPro uses a **shared database, shared schema** multi-tenancy model. All data rows are scoped by a `gymId` foreign key. Tenant isolation is enforced at the application layer — every query in every service module filters by the `gymId` extracted from the authenticated JWT.

This approach trades the strongest isolation (separate databases per tenant) for operational simplicity and cost efficiency at scale, while keeping the data model straightforward.

```
JWT Payload
  └── gymId  ──────────────────────────────────────────────────┐
                                                                 |
  Database                                                        |
  ├── Gym (id, name, plan, createdAt)      <─── root tenant    ──┘
  ├── Branch (id, gymId, name, ...)        <─── gymId scoped
  ├── User (id, gymId, role, ...)          <─── gymId scoped
  ├── Member (id, gymId, userId, ...)      <─── gymId scoped
  ├── Membership (id, gymId, memberId)     <─── gymId scoped
  ├── Payment (id, gymId, memberId)        <─── gymId scoped
  ├── Attendance (id, gymId, memberId)     <─── gymId scoped
  ├── Workout (id, gymId, ...)             <─── gymId scoped
  └── ... (all 40+ entity tables)         <─── gymId scoped
```

### Role Hierarchy

Roles are stored on the `User` model and enforced by `role.middleware.ts` on every protected route. The hierarchy is:

```
SUPER_ADMIN
    └── REGIONAL_MANAGER
            └── BRANCH_MANAGER
                    └── ADMIN
                            └── RECEPTIONIST
                            └── TRAINER
                                    └── MEMBER
```

- `SUPER_ADMIN` — Platform-level access. Can manage all gyms. Reserved for GymPro operators.
- `REGIONAL_MANAGER` — Can oversee multiple branches within an assigned region.
- `BRANCH_MANAGER` — Full administrative access to their assigned branch.
- `ADMIN` — Gym-level administration: members, billing, reports, staff.
- `RECEPTIONIST` — Front-desk operations: check-in, member lookup, basic payments.
- `TRAINER` — Access to assigned members' plans, progress, and attendance.
- `MEMBER` — Self-service: own profile, plan view, progress, community.

### Prisma Schema Overview

The schema defines the following primary enums used for type-safe columns:

| Enum               | Values                                                                           |
|--------------------|----------------------------------------------------------------------------------|
| `Role`             | SUPER_ADMIN, REGIONAL_MANAGER, BRANCH_MANAGER, ADMIN, RECEPTIONIST, TRAINER, MEMBER |
| `MembershipPlan`   | MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY                                          |
| `PaymentStatus`    | PAID, PENDING, OVERDUE                                                           |
| `NotificationType` | MEMBERSHIP_RENEWAL, PAYMENT_REMINDER, ATTENDANCE_REMINDER, DIET_PLAN_UPDATED, WORKOUT_PLAN_UPDATED, GENERAL |
| `AuditAction`      | CREATE, UPDATE, DELETE, LOGIN, LOGOUT, PAYMENT, CHECK_IN                         |
| `DueStatus`        | PENDING, PARTIAL, PAID, OVERDUE                                                  |

### Tenant Isolation Guarantees

1. The `gymId` is extracted from the verified JWT on every request — it cannot be spoofed.
2. All service-layer queries include a `WHERE gymId = $gymId` clause.
3. The `gym.middleware.ts` middleware validates that the gym referenced in the URL matches the JWT's `gymId`.
4. `SUPER_ADMIN` users bypass the `gymId` filter for platform operations only.
5. No cross-tenant joins are possible in the application layer — only within the same `gymId`.

---

## 7. Real-time Architecture

### Socket.IO Server

The Socket.IO server is initialised on the same HTTP server as Express (`src/server.ts`). It uses the `@socket.io/redis-adapter` to synchronise events across multiple backend instances, enabling horizontal scaling.

```
Client (Web/Mobile)
        |
        | WebSocket / HTTP long-poll
        v
   Socket.IO Server
        |
   [Auth Middleware]  — Verifies JWT from socket.handshake.auth.token
        |             — Attaches user object to socket.data.user
        |
   socket.join(`user:{userId}`)     — Personal room for targeted notifications
   socket.join(`gym:{gymId}`)       — Gym-wide room for broadcast events
        |
        v
   Redis Pub/Sub (via redis-adapter)
        |
        v
   Other Backend Instances (horizontal scaling)
```

### Room Naming Convention

| Room Pattern     | Scope            | Use Case                                              |
|------------------|------------------|-------------------------------------------------------|
| `user:{id}`      | Single user      | Personal notifications, payment confirmations         |
| `gym:{id}`       | All gym users    | Gym-wide announcements, broadcast attendance events   |

### Socket Authentication

Every socket connection must supply a valid JWT either via:

- `socket.handshake.auth.token` (preferred — not logged)
- `socket.handshake.headers.authorization`

Connections without a valid token are rejected with `new Error("Unauthorized socket connection")` before the `connection` event fires. Failed auth attempts are tracked by the `socketAuthFailures` Prometheus counter.

### CORS for Sockets

The Socket.IO server enforces the same `CORS_ORIGIN` whitelist as the HTTP server. In development mode (`NODE_ENV !== 'production'`), `localhost` origins on any port are permitted.

### Socket Events

Socket events are centralised in `realtime/socket-events.ts` as a typed constants object (`SOCKET_EVENTS`), ensuring event name consistency between server emit and client subscription.

---

## 8. Queue Architecture

### Overview

GymPro uses **BullMQ** (backed by Redis) for all asynchronous, potentially long-running, or retryable work. The queue system runs in a **separate worker process** (`pnpm --filter backend worker` / `src/workers/index.ts`), completely isolated from the API server process. This means queue processing load cannot block API request handling.

### Queues

| Queue Name      | Defined In               | Purpose                                                               |
|-----------------|--------------------------|-----------------------------------------------------------------------|
| `notifications` | `queues/queue.ts`        | In-app and push notification delivery jobs                            |
| `emails`        | `queues/queue.ts`        | Transactional and marketing email rendering and SMTP dispatch         |
| `billing`       | `queues/queue.ts`        | Billing cycle runs, invoice generation, dunning state transitions     |
| `sms`           | `queues/sms.queue.ts`    | SMS dispatch via external gateway                                     |
| `dead-letter`   | `queues/dlq.ts`          | Failed jobs from all queues after exhausting retries                  |

### Job Lifecycle

```
Producer (API handler or scheduler)
        |
        | queue.add(jobName, jobData, options)
        v
   Redis (BullMQ sorted sets)
        |
        v
   Worker Process
   ├── Picks up job from queue
   ├── Executes job handler
   ├── On success → job marked COMPLETED, metrics updated
   └── On failure → retry with exponential backoff
                         |
                    After max retries (3)
                         |
                         v
                   Dead Letter Queue ("dead-letter")
                   addToDLQ(originalQueue, job, error)
                   Stores: originalQueue, jobId, jobName, jobData,
                           errorMessage, errorStack, attemptsMade
```

### Retry Strategy

BullMQ is configured with `defaultJobOptions` (defined in `queues/redis.ts`) that applies to all queues:

- **Attempts:** 3 retries before moving to DLQ
- **Backoff:** Exponential — delay doubles on each retry (e.g. 1s → 2s → 4s)
- **Remove on complete:** Completed jobs are pruned to cap Redis memory
- **Remove on fail:** Failed jobs are preserved in the DLQ for inspection

### Dead Letter Queue

The `dead-letter` queue is the safety net. It captures jobs that have exhausted all retry attempts. Each DLQ entry stores full context (original queue, job data, error stack, attempt count) enabling:

- Operational replay after bug fixes
- Alerting on abnormal DLQ growth (monitored via `deadLetterQueueSize` Prometheus gauge)
- Post-mortem debugging without log archaeology

### Queue Monitoring

`queues/queueMonitor.ts` exposes a monitoring interface. Queue depth, active jobs, completed/failed counts, and DLQ size are all published to Prometheus and visible in the Grafana Queue Dashboard.

---

## 9. Observability

GymPro implements a three-pillar observability strategy: **metrics** (Prometheus/Grafana), **errors** (Sentry), and **logs** (Morgan/Winston).

### 9.1 Prometheus Metrics

All metrics are defined in `src/monitoring/` and exposed at `GET /metrics` (scraped by Prometheus every 15 seconds).

#### HTTP Metrics (`monitoring/http.metrics.ts`)

| Metric Name                    | Type      | Labels                                     | Description                                  |
|--------------------------------|-----------|--------------------------------------------|----------------------------------------------|
| `http_requests_total`          | Counter   | method, route, status_code                 | Total HTTP requests, labelled by outcome     |
| `http_request_duration_seconds`| Histogram | method, route, status_code                 | Request duration distribution (p50/p95/p99)  |
| `http_requests_in_progress`    | Gauge     | method, route                              | Requests currently being processed           |
| `http_request_size_bytes`      | Histogram | method, route                              | Request body size distribution               |
| `http_response_size_bytes`     | Histogram | method, route                              | Response body size distribution              |
| `http_requests_by_endpoint`    | Counter   | method, path                               | Per-endpoint request volume                  |
| `http_errors_total`            | Counter   | method, route, error_type                  | Error count by type and route                |

#### Queue Metrics (`monitoring/queue.metrics.ts`)

| Metric Name                    | Type      | Labels       | Description                                     |
|--------------------------------|-----------|--------------|-------------------------------------------------|
| `queue_jobs_completed`         | Counter   | queue        | Total jobs successfully processed               |
| `queue_jobs_failed`            | Counter   | queue        | Total jobs that failed all retries              |
| `queue_jobs_retried`           | Counter   | queue        | Total retry attempts                            |
| `queue_depth`                  | Gauge     | queue        | Current number of waiting jobs                  |
| `queue_job_duration_seconds`   | Histogram | queue, job   | Job processing time distribution                |
| `queue_active_jobs`            | Gauge     | queue        | Jobs currently being processed                  |
| `queue_stalled_jobs`           | Gauge     | queue        | Jobs stalled (worker crashed mid-processing)    |
| `dead_letter_queue_size`       | Gauge     | —            | Number of unresolved entries in DLQ             |

#### Socket Metrics (`monitoring/socket.metrics.ts`)

| Metric Name                      | Type      | Labels    | Description                                   |
|----------------------------------|-----------|-----------|-----------------------------------------------|
| `socket_connections_active`      | Gauge     | —         | Currently connected Socket.IO clients         |
| `socket_connections_total`       | Counter   | —         | All-time connection count                     |
| `socket_disconnections_total`    | Counter   | reason    | Disconnections grouped by reason              |
| `socket_events_emitted`          | Counter   | event     | Server-side events emitted per type           |
| `socket_events_received`         | Counter   | event     | Client-sent events received per type          |
| `socket_room_users`              | Gauge     | room      | Current occupancy of named rooms              |
| `socket_message_size_bytes`      | Histogram | event     | Payload size distribution per event type      |
| `socket_auth_failures`           | Counter   | —         | Failed JWT auth attempts on socket handshake  |
| `socket_latency_seconds`         | Histogram | —         | Round-trip latency for ping/pong probes       |

#### System Metrics (`monitoring/system.metrics.ts`)

| Metric Name                      | Type      | Description                                  |
|----------------------------------|-----------|----------------------------------------------|
| `node_memory_usage_bytes`        | Gauge     | Process heap and RSS memory                  |
| `event_loop_lag_seconds`         | Gauge     | Node.js event loop lag (latency indicator)   |
| `redis_connection_status`        | Gauge     | 1 = connected, 0 = disconnected              |
| `redis_operation_latency_seconds`| Histogram | Redis command round-trip time                |
| `db_connection_pool_size`        | Gauge     | Prisma connection pool capacity              |
| `db_connection_pool_waiting`     | Gauge     | Queries waiting for a pool connection        |
| `worker_process_health`          | Gauge     | 1 = worker healthy, 0 = worker unreachable   |
| `process_uptime_seconds`         | Counter   | Time since process start                     |
| `cpu_usage_percent`              | Gauge     | Node.js process CPU utilisation              |

### 9.2 Grafana Dashboards

Dashboards are auto-provisioned from `docker/grafana/provisioning/` on container start. No manual import is required.

| Dashboard             | File                        | Key Panels                                               |
|-----------------------|-----------------------------|----------------------------------------------------------|
| API Performance       | `api-performance.json`      | Request rate, error rate, p95/p99 latency, top routes    |
| Queue Health          | `queue-health.json`         | Queue depth, job throughput, failure rate, DLQ size      |
| System Resources      | `system.json`               | CPU, memory, event loop lag, Redis status                |
| Socket Connections    | `sockets.json`              | Active connections, event rates, auth failures           |

### 9.3 Sentry Error Tracking

Sentry is initialised in `config/sentry.ts` and integrated at two points:

1. **Express error handler** — `Sentry.setupExpressErrorHandler(app)` captures all unhandled errors with full request context (URL, method, headers, body).
2. **Sentry context middleware** — `sentryContext.middleware.ts` enriches errors with the authenticated user's ID, email, and `gymId` for per-tenant filtering in the Sentry dashboard.

### 9.4 Structured Logging

Morgan access logs are piped into Winston (`logger.info`), producing structured log lines with request ID, method, URL, status code, and response time. Winston is configured to output JSON in production and formatted text in development.

---

## 10. Infrastructure

### Docker Compose Topology

```
                         ┌─────────────────────────────────────────────────────────┐
                         │                  Docker Network                          │
                         │                                                          │
  Internet               │                                                          │
      │                  │   ┌──────────────┐    ┌──────────────────────────────┐  │
      │  :80/:443        │   │    nginx      │    │         backend              │  │
      └─────────────────►│──►│  (reverse     │───►│  Express 5 + Socket.IO       │  │
                         │   │   proxy)      │    │  Port: 5050                  │  │
                         │   └──────────────┘    │  pnpm --filter backend dev   │  │
                         │                        └──────────────┬───────────────┘  │
                         │                                        │                  │
                         │   ┌──────────────────────────────┐    │                  │
                         │   │         worker               │    │                  │
                         │   │  BullMQ consumer process     │    │                  │
                         │   │  pnpm --filter backend worker│    │                  │
                         │   └──────────────┬───────────────┘    │                  │
                         │                  │                     │                  │
                         │                  │   ┌─────────────────▼────────────┐   │
                         │                  └──►│         redis                 │   │
                         │                      │  Redis 7 Alpine               │   │
                         │                      │  Port: 6379                   │   │
                         │                      │  AOF persistence enabled      │   │
                         │                      └──────────────────────────────┘   │
                         │                                                          │
                         │   ┌──────────────┐    ┌──────────────────────────────┐  │
  Ops Team               │   │  prometheus  │    │         grafana               │  │
      │  :9090 / :3000   │   │  Port: 9090  │───►│  Port: 3000                  │  │
      └─────────────────►│──►│  30d TSDB    │    │  Auto-provisioned dashboards  │  │
                         │   └──────────────┘    └──────────────────────────────┘  │
                         │                                                          │
                         │         PostgreSQL / Neon  (external managed service)    │
                         └─────────────────────────────────────────────────────────┘
```

### Service Configuration Summary

| Service      | Image / Build           | Port(s)      | Persistence              | Depends On         |
|--------------|-------------------------|--------------|--------------------------|--------------------|
| `redis`      | redis:7-alpine          | 6379         | redis_data volume (AOF)  | —                  |
| `backend`    | ./Dockerfile            | 5050         | —                        | redis              |
| `worker`     | ./Dockerfile            | —            | —                        | redis, backend     |
| `nginx`      | nginx:alpine            | 80, 443      | ssl mount (read-only)    | backend            |
| `prometheus` | prom/prometheus:latest  | 9090         | prometheus_data volume   | backend            |
| `grafana`    | grafana/grafana:latest  | 3000         | grafana_data volume      | prometheus         |

### Nginx Role

Nginx sits in front of the backend and performs:

- **TLS termination** — SSL certificates are mounted into the container; all HTTPS traffic is decrypted at Nginx and forwarded as HTTP internally.
- **Reverse proxy** — HTTP and WebSocket (`Upgrade: websocket`) traffic is proxied to `backend:5050`.
- **Connection limits** — Nginx enforces its own connection and request rate limits as a first line of defence before traffic reaches Express.

### Data Persistence

- **PostgreSQL** — Hosted on Neon (serverless PostgreSQL). No container needed. Connection via `DATABASE_URL` environment variable with connection pooling.
- **Redis** — Persisted with Append-Only File (AOF) mode (`appendonly yes`, `appendfsync everysec`). Survives container restarts.
- **Prometheus** — 30-day TSDB retention with volume persistence.
- **Grafana** — Dashboard and datasource state persisted via volume; dashboards are also version-controlled in `docker/grafana/provisioning/`.

---

## 11. Scalability Approach

GymPro is architected for horizontal scaling from the outset. No component in the critical path maintains process-local state.

### Stateless Backend

The Express + Socket.IO backend is fully stateless. No in-process session state, no sticky sessions required. Any backend instance can handle any request. This enables:

- Horizontal scaling behind a load balancer (add more `backend` containers).
- Rolling deployments with zero downtime.
- Autoscaling based on CPU or request queue depth.

### Redis as Shared State Layer

Redis serves as the centralised shared state store for all backend instances:

| Use Case                    | Mechanism                          |
|-----------------------------|------------------------------------|
| Socket.IO events            | `@socket.io/redis-adapter` pub/sub |
| Rate limit counters         | `express-rate-limit` with Redis store |
| BullMQ job queues           | Redis sorted sets and streams      |
| Application cache           | Key-value caching in `cache/`      |
| Brute force counters        | `bruteForce.middleware.ts` via Redis |

### Async Work Offloading

All workloads that do not need to block the HTTP response are enqueued to BullMQ:

- Email delivery
- SMS dispatch
- Push notifications
- Billing cycle runs
- Report generation

This keeps API response times low and predictable under load spikes.

### Worker Process Isolation

The BullMQ worker runs as a completely separate Node.js process. Computationally heavy queue processing (PDF report generation, bulk email sends) cannot cause event loop starvation in the API server process.

### Database Scalability

- Neon's serverless PostgreSQL provides automatic compute scaling and connection pooling.
- Prisma's connection pool is tuned via `DATABASE_URL` parameters.
- Read-heavy analytics queries can be offloaded to Neon read replicas without application changes (connection string swap).

### Scaling Checklist

- [ ] Deploy multiple `backend` container replicas behind Nginx upstream pool
- [ ] Deploy multiple `worker` container replicas (BullMQ supports concurrent consumers)
- [ ] Use Redis Sentinel or Redis Cluster for Redis HA
- [ ] Switch to Neon read replicas for analytics queries
- [ ] Enable Prometheus remote_write for long-term metrics storage (Thanos / Grafana Cloud)

---

## 12. Security Layers

GymPro applies defence-in-depth with multiple overlapping security controls.

### Layer 1 — Network / Proxy

- **Nginx** terminates TLS. Only ports 80 and 443 are exposed externally. All internal service communication is HTTP on the Docker network.
- **`trust proxy`** is set to `1` so Express uses `X-Forwarded-For` from Nginx, not the container's internal IP. This ensures rate limiting and IP-based controls target the actual client.

### Layer 2 — HTTP Security Headers (Helmet)

Helmet is the first application-layer middleware and sets:

| Header                        | Configuration                                           |
|-------------------------------|---------------------------------------------------------|
| `Strict-Transport-Security`   | `max-age=31536000; includeSubDomains`                   |
| `Referrer-Policy`             | `strict-origin-when-cross-origin`                       |
| `Content-Security-Policy`     | Helmet defaults (can be tightened per deployment)       |
| `X-Frame-Options`             | `DENY`                                                  |
| `X-Content-Type-Options`      | `nosniff`                                               |
| `Cross-Origin-Embedder-Policy`| Disabled (required for Cloudinary media embedding)      |

### Layer 3 — CORS

The allowed origins list is loaded from the `CORS_ORIGIN` environment variable (comma-separated). Requests from unlisted origins are rejected with a CORS error before reaching any route handler. Credentials (cookies) are permitted for same-origin requests.

### Layer 4 — Rate Limiting

Multiple rate limiting layers operate in sequence:

| Layer                | Scope            | Limit                  | Implementation                    |
|----------------------|------------------|------------------------|-----------------------------------|
| Nginx                | Connection level | Configurable           | Nginx `limit_req_zone`            |
| Global limiter       | All routes       | 300 req / 15 min / IP  | `express-rate-limit`              |
| Auth limiter         | `/api/v1/auth`   | 20 req / 15 min / IP   | `authLimiter` middleware          |
| Upload limiter       | `/api/v1/uploads`| 50 req / 15 min / IP   | `uploadLimiter` middleware        |
| Brute force          | Login endpoint   | Progressive delay      | `bruteForce.middleware.ts`        |

Rate limit responses return HTTP 429 with a JSON body and standard `Retry-After` headers.

### Layer 5 — Authentication (JWT)

- JWTs are signed with a secret stored in the `JWT_SECRET` environment variable.
- Tokens include `userId`, `gymId`, and `role` claims.
- `auth.middleware.ts` validates the token signature and expiry on every protected route.
- Expired tokens receive HTTP 401; the client must re-authenticate.
- Socket.IO connections undergo the same JWT validation on handshake.

### Layer 6 — Role-Based Access Control (RBAC)

- `role.middleware.ts` is applied per-route with the minimum required role.
- The role hierarchy is strictly ordered: a lower-privileged role cannot access higher-privilege endpoints.
- `gym.middleware.ts` enforces that the `gymId` in the URL or request body matches the JWT's `gymId`, preventing cross-tenant data access.

### Layer 7 — Input Validation

All request bodies are validated with **Zod schemas** before reaching controller logic. Invalid input is rejected with HTTP 400 and a structured error listing all validation failures. This prevents injection, type coercion attacks, and malformed data from reaching the database layer.

### Layer 8 — File Upload Security

Multer enforces:
- **MIME type allowlist** — only permitted file types are accepted
- **File size limits** — requests exceeding the limit are rejected before the body is fully buffered
- **Upload rate limit** — `uploadLimiter` prevents storage abuse

### Layer 9 — Audit Logging

`auditMiddleware` runs on every authenticated request and writes an immutable record to the `AuditLog` table with:
- `userId`, `gymId`, `action` (from `AuditAction` enum)
- `resource`, `resourceId`
- IP address, `requestId`, timestamp

Audit logs cannot be deleted through the application API. They serve as a forensic trail for compliance and incident investigation.

### Layer 10 — Error Handling and Information Leakage Prevention

- The global `errorMiddleware` normalises all errors to a safe JSON shape. Raw stack traces and database error messages are never returned to clients in production.
- Sentry captures the full error context server-side, so debugging information is available without exposing it to end users.
- `sentryContext.middleware.ts` enriches Sentry events with authenticated user context for precise issue attribution.

---

*This document is auto-maintained. When adding new modules, update Section 4. When adding new metrics, update Section 9. When changing the middleware order, update Section 5.*
