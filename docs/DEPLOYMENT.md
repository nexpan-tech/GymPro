# GymPro Deployment Guide

This guide covers every stage of deploying GymPro — from local development through production on a Linux host with Docker Compose, Nginx, Neon PostgreSQL, and the full observability stack (Prometheus + Grafana).

---

## 1. Prerequisites

| Tool | Minimum Version | Install |
|------|----------------|---------|
| Docker | 24.x | https://docs.docker.com/engine/install/ |
| Docker Compose (V2 plugin) | 2.x | bundled with Docker Desktop; `docker compose version` to verify |
| pnpm | 9.x | `npm install -g pnpm@9` |
| Node.js | 22.x | https://nodejs.org or `nvm install 22` |
| Git | any recent | OS package manager |
| pg_dump / pg_restore | 15+ | required only for backup/restore scripts |

Verify your environment before continuing:

```bash
docker --version          # Docker version 24.x.x
docker compose version    # Docker Compose version v2.x.x
pnpm --version            # 9.x.x
node --version            # v22.x.x
git --version
```

---

## 2. Local Development Setup

### 2.1 Clone the repository

```bash
git clone <repository-url> MyGym
cd MyGym/gympro
```

### 2.2 Install all workspace dependencies

From the monorepo root (where `pnpm-workspace.yaml` lives):

```bash
pnpm install
```

This installs dependencies for every workspace package (`apps/backend`, `apps/web`, `apps/mobile`).

### 2.3 Create the backend environment file

```bash
cp apps/backend/.env.example apps/backend/.env   # if an example file exists, otherwise:
# create apps/backend/.env manually — see Section 3 for all variables
```

At minimum, set:

```
DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=require"
DIRECT_URL="postgresql://<user>:<password>@<direct-host>/<db>?sslmode=require"
JWT_SECRET="<strong-random-secret>"
PORT=5050
REDIS_URL=redis://localhost:6379
```

### 2.4 Start Redis locally

```bash
docker compose up -d redis
```

Verify Redis is running:

```bash
docker exec gympro-redis redis-cli ping
# Expected: PONG
```

### 2.5 Run database migrations

```bash
# Apply all pending migrations against the database in DATABASE_URL
pnpm --filter backend exec prisma migrate deploy

# (First-time only, or after schema changes in development)
# pnpm --filter backend exec prisma db push
```

### 2.6 Seed the database

```bash
pnpm --filter backend exec prisma db seed
```

### 2.7 Start the development server

In one terminal — backend API + file-watching:

```bash
pnpm --filter backend dev
```

In a second terminal — BullMQ background worker:

```bash
pnpm --filter backend worker
```

The API is now available at `http://localhost:5050`.

### 2.8 Useful dev commands

```bash
# Run backend unit tests
pnpm --filter backend test

# Run tests in watch mode
pnpm --filter backend test:watch

# Generate test coverage report
pnpm --filter backend test:coverage

# Compile TypeScript to dist/
pnpm --filter backend build

# Open Prisma Studio (visual DB browser)
pnpm --filter backend exec prisma studio
```

---

## 3. Environment Variables Reference

All variables are read from `apps/backend/.env` (development) or `apps/backend/.env.production` (production).

### 3.1 Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | Prisma connection string via **connection pooler** (PgBouncer). Use the `-pooler` endpoint from Neon. Must include `?sslmode=require`. |
| `DIRECT_URL` | Yes | — | Direct (non-pooled) connection string for Prisma migrations. Use the non-pooler Neon endpoint. Must include `?sslmode=require`. |

### 3.2 Application

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5050` | TCP port the Express server listens on. |
| `NODE_ENV` | No | `development` | Set to `production` in prod. Controls logging verbosity, error detail exposure, and Sentry sampling. |
| `JWT_SECRET` | Yes | — | Secret key used to sign and verify JWTs. Minimum 32 random characters in production. |
| `CORS_ORIGIN` | No | `*` | Comma-separated list of allowed origins, e.g. `https://app.example.com`. In production this should never be `*`. |

### 3.3 Redis

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_URL` | Yes | `redis://redis:6379` | Redis connection URL. In Docker Compose the service name `redis` resolves automatically. For production use a managed Redis (Upstash, AWS ElastiCache). |

### 3.4 Payments — Razorpay

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RAZORPAY_KEY_ID` | Yes (if payments enabled) | `your_key` | Razorpay API key ID from the Razorpay dashboard. |
| `RAZORPAY_KEY_SECRET` | Yes (if payments enabled) | `your_secret` | Razorpay API key secret. Never commit this value. |
| `RAZORPAY_WEBHOOK_SECRET` | Yes (if payments enabled) | `super_secret` | Webhook verification secret configured in Razorpay dashboard. |

### 3.5 File Storage — Cloudinary

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Yes (if file uploads enabled) | `your_cloud_name` | Cloudinary cloud name (visible in dashboard). |
| `CLOUDINARY_API_KEY` | Yes (if file uploads enabled) | `your_api_key` | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Yes (if file uploads enabled) | `your_api_secret` | Cloudinary API secret. Never commit this value. |

### 3.6 Observability — Sentry

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SENTRY_DSN` | No | `` (empty) | Sentry Data Source Name. When empty, Sentry is disabled. Obtain from your Sentry project settings. |

### 3.7 Email — SMTP

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | Yes (if email enabled) | `smtp.gmail.com` | SMTP server hostname. |
| `SMTP_PORT` | Yes (if email enabled) | `587` | SMTP port. Use `587` for STARTTLS, `465` for TLS. |
| `SMTP_USER` | Yes (if email enabled) | `your_email@gmail.com` | SMTP authentication username. |
| `SMTP_PASS` | Yes (if email enabled) | `your_app_password` | SMTP authentication password. For Gmail, generate an App Password (not your account password). |
| `SMTP_FROM` | No | `GymPro <your_email@gmail.com>` | Sender display name and address shown in the `From` header. |

### 3.8 WhatsApp Messaging

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WHATSAPP_ENABLED` | No | `false` | Set to `true` to enable WhatsApp notifications via Meta Cloud API. |
| `WHATSAPP_API_URL` | No | `` | Meta Graph API endpoint, e.g. `https://graph.facebook.com/v18.0`. |
| `WHATSAPP_ACCESS_TOKEN` | No | `` | Permanent access token from Meta Business Manager. |
| `WHATSAPP_PHONE_NUMBER_ID` | No | `` | Phone Number ID from Meta WhatsApp Business Account. |

### 3.9 SMS

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMS_ENABLED` | No | `false` | Set to `true` to enable SMS notifications. |
| `SMS_PROVIDER` | No | `mock` | SMS provider name. Set to your provider's identifier (e.g. `twilio`, `msg91`). `mock` logs messages without sending. |
| `SMS_API_KEY` | No | `` | API key for the chosen SMS provider. |
| `SMS_SENDER_ID` | No | `GYMPRO` | Alphanumeric sender ID shown as the SMS originator. |

### 3.10 Push Notifications — Firebase Cloud Messaging

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PUSH_NOTIFICATIONS_ENABLED` | No | `false` | Set to `true` to enable FCM push notifications. |
| `FIREBASE_PROJECT_ID` | No | `` | Firebase project ID from the Firebase console. |
| `FIREBASE_CLIENT_EMAIL` | No | `` | Service account client email from the Firebase Admin SDK credentials JSON. |
| `FIREBASE_PRIVATE_KEY` | No | `` | Service account private key (PEM). In `.env` files wrap in double quotes and replace literal newlines with `\n`. |

### 3.11 Grafana (production only)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GF_SECURITY_ADMIN_PASSWORD` | Yes (production) | — | Grafana admin password. Set in the host environment or `.env.production`. Never use the default `admin`. |

---

## 4. Docker Development Stack

The development Compose file (`docker-compose.yml`) starts Redis, the backend API, the background worker, Nginx, Prometheus, and Grafana.

### 4.1 Start all services

```bash
# From the gympro/ monorepo root
docker compose up -d
```

Start a subset of services (recommended for development where you run the API locally):

```bash
docker compose up -d redis prometheus grafana
```

### 4.2 Service startup order

Docker Compose respects `depends_on` declarations. The effective startup order is:

```
redis → backend → worker
              └──→ prometheus → grafana
              └──→ nginx
```

### 4.3 Verify each service

| Service | Container Name | Verification Command |
|---------|---------------|---------------------|
| Redis | `gympro-redis` | `docker exec gympro-redis redis-cli ping` → `PONG` |
| Backend API | `gympro-backend` | `curl -s http://localhost:5050/api/v1/health` |
| Worker | `gympro-worker` | `docker logs gympro-worker --tail 20` |
| Nginx | `gympro-nginx` | `curl -s http://localhost/api/v1/health` |
| Prometheus | `gympro-prometheus` | `curl -s http://localhost:9090/-/ready` |
| Grafana | `gympro-grafana` | `curl -s http://localhost:3000/api/health` |

### 4.4 Health check commands (all at once)

```bash
./scripts/health-check.sh
```

The script checks all six endpoints and prints a Docker container status table.

### 4.5 View service logs

```bash
docker compose logs -f backend      # follow backend logs
docker compose logs -f worker       # follow worker logs
docker compose logs --tail 50       # last 50 lines from all services
```

### 4.6 Stop and tear down

```bash
docker compose down              # stop containers, keep volumes
docker compose down -v           # stop containers and DELETE volumes (data loss!)
```

---

## 5. Database Setup

GymPro uses **Neon PostgreSQL** (serverless Postgres) with **two connection strings** — one for runtime (via PgBouncer pooler) and one direct connection for migrations.

### 5.1 Create a Neon project

1. Sign up at https://neon.tech and create a new project.
2. From the **Connection Details** panel, copy:
   - **Pooled connection string** → `DATABASE_URL`
   - **Direct connection string** → `DIRECT_URL`
3. Both strings must end with `?sslmode=require`.

### 5.2 Why two URLs?

Prisma Migrate requires a direct connection (not pooled) because it uses advisory locks and DDL transactions that are incompatible with PgBouncer in transaction mode. The application runtime uses the pooler for efficiency.

### 5.3 `prisma migrate deploy` vs `prisma db push`

| Command | When to use |
|---------|-------------|
| `prisma migrate deploy` | **Production and CI.** Applies all pending migration files in `prisma/migrations/`. Safe — never drops data without an explicit migration. |
| `prisma db push` | **Development only.** Pushes the current schema directly to the database, potentially dropping data if tables change. Do not use in production. |

Run migrations:

```bash
# Apply migrations (production-safe)
pnpm --filter backend exec prisma migrate deploy

# Development schema sync (never use in production)
pnpm --filter backend exec prisma db push
```

### 5.4 Seed the database

```bash
pnpm --filter backend exec prisma db seed
```

The seed file is located at `apps/backend/prisma/seed.ts`. It creates initial roles, plan templates, and a default admin account. It is safe to run multiple times — existing records are upserted.

### 5.5 Migration safety guidelines

- Always commit migration files (`prisma/migrations/`) to version control.
- Never modify an already-applied migration file — create a new one instead.
- Before running `migrate deploy` in production, test it against a staging database with a copy of production data.
- Destructive changes (column drops, renames) require explicit migration SQL review.
- Keep `DIRECT_URL` (non-pooler endpoint) in production `.env.production` even though the application uses `DATABASE_URL` at runtime.
- Enable Neon branching for zero-risk migration testing: create a branch, run migrations, validate, then apply to main.

### 5.6 Inspect migrations

```bash
ls apps/backend/prisma/migrations/

# Open Prisma Studio to browse data
pnpm --filter backend exec prisma studio
```

---

## 6. Production Deployment

Production uses `docker-compose.prod.yml`, which:
- Removes host port bindings for Redis, Prometheus, and Grafana (only Nginx is publicly accessible).
- Adds `healthcheck` blocks so `depends_on` waits for services to be truly ready.
- Sets `restart: always` on all services.
- Enforces memory and CPU limits per service.

### 6.1 Server requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 2 GB | 4 GB |
| Disk | 20 GB SSD | 40 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |

### 6.2 Create `.env.production`

```bash
cp apps/backend/.env apps/backend/.env.production
```

Edit `.env.production` and set every value correctly. At minimum:

```dotenv
DATABASE_URL="postgresql://<user>:<pass>@<pooler-host>/neondb?sslmode=require"
DIRECT_URL="postgresql://<user>:<pass>@<direct-host>/neondb?sslmode=require"
JWT_SECRET="<minimum-32-char-random-string>"
PORT=5050
NODE_ENV=production
REDIS_URL=redis://redis:6379
CORS_ORIGIN=https://your-domain.com

RAZORPAY_KEY_ID=<live-key>
RAZORPAY_KEY_SECRET=<live-secret>
RAZORPAY_WEBHOOK_SECRET=<webhook-secret>

CLOUDINARY_CLOUD_NAME=<name>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>

SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>

SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=noreply@your-domain.com
SMTP_PASS=<app-password>
SMTP_FROM="GymPro <noreply@your-domain.com>"

WHATSAPP_ENABLED=false
SMS_ENABLED=false
PUSH_NOTIFICATIONS_ENABLED=false

GF_SECURITY_ADMIN_PASSWORD=<strong-grafana-password>
```

Restrict file permissions:

```bash
chmod 600 apps/backend/.env.production
```

### 6.3 SSL certificate setup

Place certificates inside `docker/ssl/`:

```bash
mkdir -p docker/ssl

# Option A: Let's Encrypt via Certbot (recommended)
certbot certonly --standalone -d your-domain.com
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem docker/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem   docker/ssl/key.pem

# Option B: Self-signed (dev/staging only)
openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout docker/ssl/key.pem \
  -out docker/ssl/cert.pem \
  -subj "/CN=your-domain.com"
```

The Nginx container mounts `./docker/ssl` read-only at `/etc/nginx/ssl`. The prod Nginx config (`docker/nginx/nginx.prod.conf`) references these paths — verify the filenames match.

### 6.4 Build and start production stack

```bash
# Step 1: Pull/build all images
docker compose -f docker-compose.prod.yml build --no-cache

# Step 2: Run database migrations (runs against DIRECT_URL, safe)
docker compose -f docker-compose.prod.yml run --rm backend \
  pnpm --filter backend exec prisma migrate deploy

# Step 3: Start all services in the correct dependency order
docker compose -f docker-compose.prod.yml up -d

# Step 4: Confirm all containers are healthy
docker compose -f docker-compose.prod.yml ps
```

Expected output — all services should show `healthy` or `running`:

```
NAME                      STATUS
gympro-redis-prod         running (healthy)
gympro-backend-prod       running (healthy)
gympro-worker-prod        running
gympro-nginx-prod         running
gympro-prometheus-prod    running
gympro-grafana-prod       running
```

### 6.5 Full production startup sequence

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild images (only when code changed)
docker compose -f docker-compose.prod.yml build backend worker

# 3. Apply database migrations before restarting the app
docker compose -f docker-compose.prod.yml run --rm backend \
  pnpm --filter backend exec prisma migrate deploy

# 4. Rolling restart — Redis first, then backend, then everything else
docker compose -f docker-compose.prod.yml up -d --no-deps redis
docker compose -f docker-compose.prod.yml up -d --no-deps backend
docker compose -f docker-compose.prod.yml up -d --no-deps worker
docker compose -f docker-compose.prod.yml up -d --no-deps nginx prometheus grafana

# 5. Verify
./scripts/health-check.sh
```

### 6.6 Health verification

```bash
# Backend health (liveness)
curl -sf https://your-domain.com/api/v1/health

# Backend readiness
curl -sf https://your-domain.com/api/v1/health/ready

# Prometheus metrics endpoint
curl -s https://your-domain.com/api/v1/health/metrics | head -5

# Prometheus self-check (internal — requires SSH or internal network)
docker exec gympro-prometheus-prod wget -qO- http://localhost:9090/-/ready

# Grafana health (internal)
docker exec gympro-grafana-prod wget -qO- http://localhost:3000/api/health

# Redis
docker exec gympro-redis-prod redis-cli ping
```

---

## 7. Backup and Restore

### 7.1 How the backup script works

`scripts/backup.sh` reads `DATABASE_URL` from the environment and calls `pg_dump` with the custom (binary) format at compression level 9. Backup files are written to `./backups/` and named `gympro_<TIMESTAMP>.pgdump`. Files older than 7 days are automatically pruned.

### 7.2 Run a manual backup

```bash
# Export DATABASE_URL (or ensure it is already in your shell environment)
export DATABASE_URL="postgresql://..."

./scripts/backup.sh
# Output example:
# [Backup] Starting GymPro backup: 20260530_143000
# [Backup] PostgreSQL dump saved
# [Backup] Done: 20260530_143000
```

The dump file will be at `./backups/gympro_20260530_143000.pgdump`.

### 7.3 Schedule automated backups (cron)

```bash
# Run backup daily at 02:00 UTC
crontab -e
# Add:
0 2 * * * cd /path/to/gympro && DATABASE_URL="postgresql://..." ./scripts/backup.sh >> ./backups/backup.log 2>&1
```

### 7.4 Verify a backup

```bash
# List contents of the dump (does not restore data)
pg_restore --list ./backups/gympro_<TIMESTAMP>.pgdump | head -30

# Check file integrity
file ./backups/gympro_<TIMESTAMP>.pgdump
# Should output: PostgreSQL custom database dump
```

### 7.5 Restore from backup

```bash
# Usage: ./scripts/restore.sh <backup_file.pgdump>
export DATABASE_URL="postgresql://..."

./scripts/restore.sh ./backups/gympro_20260530_143000.pgdump
# Output:
# [Restore] Restoring from ./backups/gympro_20260530_143000.pgdump to postgresql://...
# [Restore] Complete
```

The restore script uses `pg_restore --clean --if-exists` which drops and recreates all objects before restoring. This means the target database will be completely overwritten.

### 7.6 Restore safety checklist

- [ ] Confirm you are restoring to the correct database (check `DATABASE_URL`).
- [ ] Notify users of downtime before restoring to a live database.
- [ ] Stop the backend before restoring to prevent active writes: `docker compose stop backend worker`.
- [ ] After restore, restart services: `docker compose start backend worker`.
- [ ] Run a health check: `./scripts/health-check.sh`.

---

## 8. Scaling

### 8.1 Running multiple backend replicas

Use Docker Compose `--scale` to run N backend replicas:

```bash
docker compose -f docker-compose.prod.yml up -d --scale backend=3
```

Each replica shares the same Redis instance for BullMQ job queues and Socket.IO pub/sub via `@socket.io/redis-adapter`.

**Important:** When running multiple replicas, remove the `container_name: gympro-backend-prod` line from `docker-compose.prod.yml` — named containers cannot be scaled.

### 8.2 Nginx upstream for multiple replicas

Update `docker/nginx/nginx.conf` (or `nginx.prod.conf`) to load-balance across replicas. With Docker Compose networking and multiple containers in the same service, Nginx's default round-robin DNS resolution handles this automatically when you reference the service name:

```nginx
upstream backend {
    server backend:5050;   # Docker DNS resolves to all replica IPs
    keepalive 32;
}
```

For explicit replica addressing with weights or least-connections:

```nginx
upstream backend {
    least_conn;
    server gympro-backend-1:5050;
    server gympro-backend-2:5050;
    server gympro-backend-3:5050;
    keepalive 64;
}
```

After changing the Nginx config, reload without downtime:

```bash
docker exec gympro-nginx-prod nginx -s reload
```

### 8.3 Worker scaling

Scale BullMQ workers independently — they do not serve HTTP traffic:

```bash
docker compose -f docker-compose.prod.yml up -d --scale worker=4
```

Remove `container_name: gympro-worker-prod` from the prod Compose file before scaling. Workers are stateless; each one connects to Redis and picks up jobs from the queue.

### 8.4 Redis scaling considerations

For production workloads with high queue throughput:
- Use a managed Redis service (e.g. **Upstash Redis** for serverless, **AWS ElastiCache** for VPC-based deployments).
- Update `REDIS_URL` to point to the managed instance.
- The Docker Compose Redis service is suitable for development and small deployments only.

### 8.5 Prometheus scrape configuration for multiple replicas

When running multiple backend replicas, update `prometheus.yml` to scrape each replica or use Docker service discovery. Example with static targets:

```yaml
- job_name: 'gympro-backend'
  static_configs:
    - targets:
        - 'backend:5050'    # Docker DNS resolves all replicas
  metrics_path: /api/v1/health/metrics
```

---

## 9. Health Verification

Use these commands to verify the full stack is operational after any deployment.

### 9.1 Automated health check

```bash
./scripts/health-check.sh
```

Output includes status for: backend liveness, backend readiness, metrics endpoint, Grafana, Prometheus, and a Docker container status table.

### 9.2 Individual endpoint checks

```bash
# --- Backend ---

# Liveness probe (is the process alive?)
curl -sf http://localhost:5050/api/v1/health
# Expected: {"status":"ok",...}

# Readiness probe (can it serve traffic? checks DB + Redis connectivity)
curl -sf http://localhost:5050/api/v1/health/ready
# Expected: {"status":"ready",...}

# Prometheus metrics
curl -s http://localhost:5050/api/v1/health/metrics | head -10
# Expected: lines starting with "# HELP" and metric values

# --- Nginx (proxied) ---

curl -sf http://localhost/api/v1/health
# Expected: same as above (routed through Nginx)

# --- Redis ---

docker exec gympro-redis redis-cli ping
# Expected: PONG

docker exec gympro-redis redis-cli info server | grep redis_version
# Expected: redis_version:7.x.x

# --- Prometheus ---

curl -sf http://localhost:9090/-/ready
# Expected: Prometheus is Ready.

curl -s "http://localhost:9090/api/v1/query?query=up" | python3 -m json.tool
# Expected: JSON with metric results showing value [1]

# --- Grafana ---

curl -sf http://localhost:3000/api/health
# Expected: {"commit":"...","database":"ok","version":"..."}

# --- BullMQ Worker (via Redis queue inspection) ---

docker exec gympro-redis redis-cli keys "bull:*" | head -10
# Expected: queue key names if any jobs have been processed

# --- Full container status ---

docker compose ps
# or in production:
docker compose -f docker-compose.prod.yml ps
```

### 9.3 Production smoke test sequence

After a production deployment, run these checks in order:

```bash
# 1. All containers are running
docker compose -f docker-compose.prod.yml ps

# 2. Backend is healthy
curl -sf https://your-domain.com/api/v1/health && echo "PASS: health"

# 3. Backend can reach database and Redis
curl -sf https://your-domain.com/api/v1/health/ready && echo "PASS: readiness"

# 4. Metrics are being exposed
curl -s https://your-domain.com/api/v1/health/metrics | grep -c "^#" && echo "PASS: metrics"

# 5. SSL certificate is valid
curl -vI https://your-domain.com 2>&1 | grep -E "SSL|expire|issuer"

# 6. No error-level logs in the last 5 minutes
docker compose -f docker-compose.prod.yml logs --since 5m backend | grep -i "error" || echo "PASS: no errors"
```

### 9.4 Grafana dashboard access

In development (Grafana exposed on port 3000):
- URL: `http://localhost:3000`
- Username: `admin`
- Password: `admin` (change on first login)

In production (Grafana not exposed on host — access via SSH tunnel):
```bash
# On your local machine:
ssh -L 3001:localhost:3000 user@your-server-ip
# Then open: http://localhost:3001
# Password: value of GF_SECURITY_ADMIN_PASSWORD in .env.production
```

---

## Appendix: Quick Reference

### Common commands

```bash
# Start dev stack
docker compose up -d && pnpm --filter backend dev

# Run migrations
pnpm --filter backend exec prisma migrate deploy

# Seed database
pnpm --filter backend exec prisma db seed

# View all logs
docker compose logs -f

# Backup database
DATABASE_URL="..." ./scripts/backup.sh

# Restore database
DATABASE_URL="..." ./scripts/restore.sh ./backups/gympro_<TIMESTAMP>.pgdump

# Health check
./scripts/health-check.sh

# Production deploy
docker compose -f docker-compose.prod.yml build && \
docker compose -f docker-compose.prod.yml run --rm backend \
  pnpm --filter backend exec prisma migrate deploy && \
docker compose -f docker-compose.prod.yml up -d
```

### Port map (development)

| Port | Service |
|------|---------|
| 5050 | Backend API (direct) |
| 6379 | Redis |
| 80 | Nginx HTTP |
| 443 | Nginx HTTPS |
| 3000 | Grafana |
| 9090 | Prometheus |

### Port map (production)

| Port | Service |
|------|---------|
| 80 | Nginx HTTP (redirects to HTTPS) |
| 443 | Nginx HTTPS (public) |
| all others | Internal Docker network only |
