# GymPro Operations Runbook

Last updated: 2026-05-30  
Maintainer: Platform Engineering  
Contact: naveensub1717@gmail.com

---

## Table of Contents

1. [Daily Health Checks](#1-daily-health-checks)
2. [Container Management](#2-container-management)
3. [Log Access](#3-log-access)
4. [Grafana Monitoring](#4-grafana-monitoring)
5. [Queue Operations](#5-queue-operations)
6. [Database Operations](#6-database-operations)
7. [Redis Operations](#7-redis-operations)
8. [Common Admin Tasks](#8-common-admin-tasks)
9. [Performance Tuning](#9-performance-tuning)
10. [Maintenance](#10-maintenance)
11. [Command Cheat Sheet](#11-command-cheat-sheet)

---

## 1. Daily Health Checks

Run the health-check script every morning before business hours open.

```bash
cd /path/to/gympro
bash scripts/health-check.sh
```

### What the script checks

| Check | Endpoint | Expected output |
|---|---|---|
| API liveness | `GET /api/v1/health` | `{"status":"ok"}` followed by `OK: health` |
| API readiness | `GET /api/v1/health/ready` | `{"status":"ready"}` followed by `OK: readiness` |
| Prometheus metrics | `GET /api/v1/health/metrics` | Two lines of `# HELP` / `# TYPE` text followed by `OK: metrics` |
| Grafana | `GET /api/health` on port 3000 | `{"database":"ok"}` followed by `OK: grafana` |
| Prometheus self | `GET /-/ready` on port 9090 | `Prometheus Server is Ready.` followed by `OK: prometheus` |
| Container states | `docker ps` filtered on `gympro` | All containers show `Up X minutes` or `Up X hours` |

### Interpreting the output

- All six `OK:` lines present — system is healthy.
- Any line missing or replaced by a curl error — investigate that service immediately.
- A container shows `Restarting` — read its logs before it restarts again (see Section 3).
- A container shows `Exited` — service is down; restart and investigate.

### Additional manual checks to perform daily

```bash
# Check Prometheus alert firing state
curl -s http://localhost:9090/api/v1/alerts | python3 -m json.tool | grep -E '"state"|"alertname"'

# Confirm no active critical alerts
curl -s 'http://localhost:9090/api/v1/alerts' \
  | python3 -c "import sys,json; alerts=json.load(sys.stdin)['data']['alerts']; \
    [print(a['labels']['alertname'], a['state']) for a in alerts if a['state']=='firing']"

# Quick queue depth scan (run inside redis container)
docker exec gympro-redis redis-cli llen bull:notifications:wait
docker exec gympro-redis redis-cli llen bull:emails:wait
docker exec gympro-redis redis-cli llen bull:billing:wait

# Disk usage — warn if above 80%
df -h | grep -v tmpfs
```

### Expected daily state

- API response time (p95) under 200 ms for read endpoints, under 500 ms for writes.
- Queue wait depth under 500 jobs per queue.
- No containers in `Restarting` state.
- Prometheus scrape interval lag under 30 s (visible in Prometheus Targets UI at `http://localhost:9090/targets`).

---

## 2. Container Management

GymPro runs six containers. In development use `docker-compose.yml`; in production use `docker-compose.prod.yml`.

### View running containers

```bash
# Show all gympro containers with status, ports, and uptime
docker ps --filter name=gympro --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Container name reference

| Container (dev) | Container (prod) | Role |
|---|---|---|
| `gympro-backend` | `gympro-backend-prod` | NestJS / Express API on port 5050 |
| `gympro-worker` | `gympro-worker-prod` | BullMQ workers (notifications, emails, billing) |
| `gympro-redis` | `gympro-redis-prod` | Redis 7 — job queue + cache |
| `gympro-nginx` | `gympro-nginx-prod` | Reverse proxy, TLS termination |
| `gympro-prometheus` | `gympro-prometheus-prod` | Metrics scraper |
| `gympro-grafana` | `gympro-grafana-prod` | Dashboard UI |

### Resource usage

```bash
# Live CPU and memory for all gympro containers
docker stats $(docker ps --filter name=gympro -q)
```

Production resource limits per `docker-compose.prod.yml`:

| Container | Memory limit | CPU limit |
|---|---|---|
| backend | 1 GB | 1.0 |
| worker | 512 MB | 0.5 |
| redis | 512 MB | 0.5 |
| nginx | 256 MB | 0.5 |
| prometheus | 512 MB | 0.5 |
| grafana | 256 MB | 0.5 |

### Restarting individual services

Prefer restarting a single service over a full stack restart. A targeted restart avoids re-negotiating TLS and losing in-flight requests on other services.

```bash
# Restart backend only (rolling — Docker replaces container while others stay up)
docker-compose restart backend

# Restart worker only (safe — BullMQ jobs are persisted in Redis)
docker-compose restart worker

# Restart nginx only (safe — upstream is still alive)
docker-compose restart nginx

# Restart Redis — ONLY if Redis itself is broken. This will pause all queue processing
# until BullMQ workers reconnect (~5 s).
docker-compose restart redis

# Restart Prometheus or Grafana — never affects the API
docker-compose restart prometheus
docker-compose restart grafana
```

### When to do a full restart vs. rolling restart

**Rolling restart (restart one service at a time):**
- A single service is unhealthy or has leaked memory.
- Deploying a new build of backend or worker.
- Routine Redis reconnection issue.

**Full stack restart (`docker-compose down && docker-compose up -d`):**
- A Docker network corruption is causing inter-container failures.
- You have changed `docker-compose.yml` or environment files.
- Multiple containers are simultaneously unhealthy.

```bash
# Full restart — development
docker-compose down && docker-compose up -d

# Full restart — production
docker-compose -f docker-compose.prod.yml down && docker-compose -f docker-compose.prod.yml up -d
```

Note: `docker-compose down` does NOT remove named volumes (`redis_data`, `prometheus_data`, `grafana_data`). Data is preserved across full restarts unless you add `--volumes`.

---

## 3. Log Access

All containers write to stdout/stderr. Docker captures these and makes them accessible via `docker logs`.

### Backend API logs

```bash
# Tail live backend logs
docker logs -f gympro-backend

# Last 200 lines
docker logs --tail 200 gympro-backend

# Logs from the last 30 minutes
docker logs --since 30m gympro-backend
```

Log format in development: Winston `simple` format — human-readable with timestamp.  
Log format in production: Winston `json` format — one JSON object per line, level `info` and above.

### Worker logs

```bash
# Tail worker logs — shows job completed / job failed events
docker logs -f gympro-worker

# Filter to failed jobs only
docker logs gympro-worker 2>&1 | grep "job failed"

# Filter to DLQ additions
docker logs gympro-worker 2>&1 | grep "\[DLQ\]"
```

### Nginx logs

```bash
# Access log (all HTTP requests Nginx handled)
docker logs gympro-nginx

# Filter to non-2xx / non-3xx responses
docker logs gympro-nginx 2>&1 | grep -v '" [23]'

# 5xx errors only
docker logs gympro-nginx 2>&1 | grep '" 5'
```

### Grafana logs

```bash
docker logs gympro-grafana

# Grafana datasource or provisioning errors
docker logs gympro-grafana 2>&1 | grep -i "error\|warn\|fail"
```

### Prometheus logs

```bash
docker logs gympro-prometheus

# Scrape failures
docker logs gympro-prometheus 2>&1 | grep -i "scrape\|err"
```

### Log filtering patterns

```bash
# All errors across all gympro containers at once
for c in backend worker nginx grafana prometheus; do
  echo "=== gympro-$c ===" && docker logs --tail 50 gympro-$c 2>&1 | grep -i "error\|exception\|fatal\|panic" || true
done

# Search backend logs for a specific request path
docker logs gympro-backend 2>&1 | grep "/api/v1/members"

# Search for a specific user ID in backend logs
docker logs gympro-backend 2>&1 | grep "usr_abc123"

# Search for slow query warnings (if logged)
docker logs gympro-backend 2>&1 | grep -i "slow\|timeout\|took"

# Search for uncaught exceptions in worker
docker logs gympro-worker 2>&1 | grep -i "uncaughtException\|unhandledRejection"
```

---

## 4. Grafana Monitoring

### Dashboard URLs

| Dashboard | URL (dev) | Purpose |
|---|---|---|
| Home | http://localhost:3000 | Landing — defaults to API Performance |
| API Performance | http://localhost:3000/d/api-performance | Request rate, latency, error rate |
| Queue Health | http://localhost:3000/d/queue-health | BullMQ job counts and failure rate |
| System Metrics | http://localhost:3000/d/system-metrics | Node.js heap, RSS, event loop |
| Socket Realtime | http://localhost:3000/d/socket-realtime | WebSocket connection counts and events |

Default credentials: `admin` / `admin` (change immediately in production — set `GF_SECURITY_ADMIN_PASSWORD` env var).

In production Grafana is not exposed on the host. Access via SSH tunnel:

```bash
ssh -L 3000:localhost:3000 user@prod-host
# Then open http://localhost:3000 locally
```

### API Performance dashboard — normal vs. alerting

| Metric | Normal | Investigate | Alert (critical) |
|---|---|---|---|
| Request rate (req/s) | Baseline varies by time of day | Sudden 3x spike or total drop to 0 | `APIDown` fires after 2 min of silence |
| HTTP error rate (5xx) | < 0.5% | 1–5% | > 5% for 2 min — `HighErrorRate` fires |
| p95 latency | < 200 ms | 200 ms – 2 s | > 2 s for 5 min — `HighP95Latency` fires |
| p99 latency | < 500 ms | 500 ms – 5 s | Investigate alongside p95 |

### Queue Health dashboard — when to investigate

| Metric | Normal | Investigate |
|---|---|---|
| Jobs waiting | < 500 per queue | > 1,000 — worker may be overloaded or stuck |
| Jobs active | < 50 per queue | Near or at `WORKER_CONCURRENCY` for sustained period |
| Jobs failed (rate) | Occasional spikes only | > 0.1 failures/s for 3 min — `QueueHighFailureRate` fires |
| Jobs completed (rate) | Non-zero during business hours | Zero for 10 min — `NoQueueActivity` fires |
| Dead letter queue depth | 0 – 10 | > 10 — review DLQ contents and replay or discard |

### System Metrics dashboard — heap and CPU normal ranges

| Metric | Normal | Investigate | Alert |
|---|---|---|---|
| Heap used / Heap total | < 70% | 70–85% | > 85% for 5 min — `HighHeapUsage` fires |
| RSS (resident set) | < 700 MB | 700 MB – 900 MB | Approaching container limit (1 GB) |
| Event loop lag | < 20 ms | 20–100 ms | > 500 ms for 3 min — `HighEventLoopLag` fires |
| Redis op latency | < 5 ms | 5–50 ms | > 50 ms — check Redis CPU and memory |
| DB connection pool waiting | 0 | > 0 for sustained period | Suggests pool exhaustion — check `DATABASE_POOL_SIZE` |

### Socket Realtime dashboard — connection count baseline

| Metric | Normal | Investigate | Alert |
|---|---|---|---|
| Active connections | Depends on member count — establish a baseline in the first week | 2x normal baseline | > 5,000 for 2 min — `HighSocketConnections` fires |
| Socket auth failures | Near 0 | Any sustained spike — may indicate credential abuse | Correlate with auth module logs |
| Events/s | Proportional to active connections | Sharp drop without connection drop | May indicate a socket handler panic |

---

## 5. Queue Operations

GymPro uses BullMQ backed by Redis. Three queues exist: `notifications`, `emails`, `billing`. Failed jobs after 3 attempts are moved to the `dead-letter` queue.

### Inspect queue state via redis-cli

```bash
# Enter Redis CLI inside the container
docker exec -it gympro-redis redis-cli

# Within redis-cli — count jobs by state for notifications queue
LLEN bull:notifications:wait       # waiting jobs
LLEN bull:notifications:active     # currently processing
ZCARD bull:notifications:delayed   # scheduled/delayed jobs
ZCARD bull:notifications:failed    # failed jobs retained
LLEN bull:dead-letter:wait         # dead letter queue depth
```

### Inspect queue state programmatically (Node.js REPL)

Run inside the backend container:

```bash
docker exec -it gympro-backend sh
node -e "
const { Queue } = require('bullmq');
const q = new Queue('notifications', {
  connection: { host: 'redis', port: 6379 }
});
q.getJobCounts('waiting','active','completed','failed','delayed')
  .then(c => { console.log(c); process.exit(0); });
"
```

### Check dead letter queue contents

```bash
docker exec -it gympro-backend node -e "
const { Queue } = require('bullmq');
const dlq = new Queue('dead-letter', {
  connection: { host: 'redis', port: 6379 }
});
dlq.getFailed(0, 20).then(jobs => {
  jobs.forEach(j => {
    console.log('id:', j.id, '| name:', j.name, '| data:', JSON.stringify(j.data));
  });
  process.exit(0);
});
"
```

### Manually retry a failed job

**Option A — BullMQ CLI (if installed globally):**

```bash
# Retry a specific job by ID in the notifications queue
docker exec gympro-backend npx bullmq retry notifications <job-id>
```

**Option B — Node.js one-liner:**

```bash
docker exec -it gympro-backend node -e "
const { Queue } = require('bullmq');
const q = new Queue('notifications', { connection: { host: 'redis', port: 6379 } });
q.getJob('<job-id>').then(async job => {
  if (!job) { console.log('Job not found'); process.exit(1); }
  await job.retry();
  console.log('Retried job', job.id);
  process.exit(0);
});
"
```

**Option C — Retry ALL failed jobs in a queue:**

```bash
docker exec -it gympro-backend node -e "
const { Queue } = require('bullmq');
const q = new Queue('notifications', { connection: { host: 'redis', port: 6379 } });
q.getFailed(0, 100).then(async jobs => {
  for (const j of jobs) await j.retry();
  console.log('Retried', jobs.length, 'jobs');
  process.exit(0);
});
"
```

### Retry failed DLQ jobs (re-enqueue to original queue)

Dead letter queue entries contain the original queue name and data. Re-enqueue manually:

```bash
docker exec -it gympro-backend node -e "
const { Queue } = require('bullmq');
const dlq = new Queue('dead-letter', { connection: { host: 'redis', port: 6379 } });
dlq.getFailed(0, 50).then(async jobs => {
  for (const j of jobs) {
    const { originalQueue, originalJobName, originalJobData } = j.data;
    const target = new Queue(originalQueue, { connection: { host: 'redis', port: 6379 } });
    await target.add(originalJobName, originalJobData);
    await j.remove();
    console.log('Re-enqueued job from DLQ to', originalQueue);
  }
  process.exit(0);
});
"
```

### Clear stuck jobs (obliterate a queue — use with caution)

Only use this when a queue is completely stalled and the jobs are non-critical or already retried.

```bash
docker exec -it gympro-backend node -e "
const { Queue } = require('bullmq');
const q = new Queue('notifications', { connection: { host: 'redis', port: 6379 } });
// obliterate removes all jobs and queue metadata
q.obliterate({ force: true }).then(() => { console.log('Queue cleared'); process.exit(0); });
"
```

---

## 6. Database Operations

GymPro uses PostgreSQL accessed via Prisma ORM. The `DATABASE_URL` environment variable must be set.

### Running a backup

```bash
cd /path/to/gympro
export DATABASE_URL="postgresql://user:pass@host:5432/gympro"
export BACKUP_DIR="./backups"   # optional — defaults to ./backups

bash scripts/backup.sh
```

The script:
1. Creates a compressed custom-format pg_dump at `./backups/gympro_YYYYMMDD_HHMMSS.pgdump`.
2. Automatically deletes dump files older than 7 days.

Expected output:

```
[Backup] Starting GymPro backup: 20260530_090000
[Backup] PostgreSQL dump saved
[Backup] Done: 20260530_090000
```

### Checking the backup file

```bash
# Verify the file exists and has a non-zero size
ls -lh ./backups/

# Verify the dump is readable by pg_restore (dry run)
pg_restore --list ./backups/gympro_20260530_090000.pgdump | head -20
```

### Running a restore

WARNING: Restore drops all existing objects in the target database before restoring. Ensure the database is not serving production traffic or use a separate restore target.

```bash
export DATABASE_URL="postgresql://user:pass@host:5432/gympro"
bash scripts/restore.sh ./backups/gympro_20260530_090000.pgdump
```

Expected output:

```
[Restore] Restoring from ./backups/gympro_20260530_090000.pgdump to postgresql://...
[Restore] Complete
```

If you see `[Restore] FAILED`, check:
- Database URL is correct and the target database exists.
- The backup file is not corrupted (`pg_restore --list <file>` should list tables).
- The database user has `SUPERUSER` or `CREATEDB` privileges.

### Running Prisma migrations in production

Never run `prisma migrate dev` in production. Use `migrate deploy` which only applies already-committed migrations without creating new ones.

```bash
# Run inside the backend container
docker exec -it gympro-backend-prod sh -c \
  "DATABASE_URL=\$DATABASE_URL npx prisma migrate deploy"

# Alternatively, run from host if prisma is installed and DATABASE_URL is set
npx prisma migrate deploy
```

Always take a backup before applying migrations:

```bash
bash scripts/backup.sh && npx prisma migrate deploy
```

### Checking slow queries

Identify queries exceeding 500 ms using PostgreSQL's `pg_stat_statements` extension (must be enabled in PostgreSQL config):

```sql
SELECT
  query,
  calls,
  round(mean_exec_time::numeric, 2) AS mean_ms,
  round(total_exec_time::numeric, 2) AS total_ms,
  rows
FROM pg_stat_statements
WHERE mean_exec_time > 500
ORDER BY mean_exec_time DESC
LIMIT 20;
```

Run via psql:

```bash
docker exec -it <postgres-container> psql -U <user> -d gympro -c \
  "SELECT query, calls, round(mean_exec_time::numeric,2) AS mean_ms FROM pg_stat_statements WHERE mean_exec_time > 500 ORDER BY mean_exec_time DESC LIMIT 10;"
```

Add missing indexes or use `EXPLAIN ANALYZE` on slow queries to identify table scans.

---

## 7. Redis Operations

Redis runs as `gympro-redis` (dev) or `gympro-redis-prod` (prod) with AOF persistence enabled (`appendonly yes`, `appendfsync everysec`).

### Enter Redis CLI

```bash
# Development
docker exec -it gympro-redis redis-cli

# Production
docker exec -it gympro-redis-prod redis-cli
```

### Key monitoring commands

```bash
# Server info summary (version, uptime, connected clients, memory)
INFO server

# Memory usage summary
INFO memory

# Persistence state — verify AOF is enabled
INFO persistence

# Check replication state (if using Redis Sentinel or Cluster)
INFO replication

# Count all keys by database
INFO keyspace

# Active connections count
INFO clients
```

### Memory usage

```bash
# Total memory used by Redis
redis-cli INFO memory | grep used_memory_human

# Memory used by a specific key
redis-cli MEMORY USAGE bull:notifications:wait

# Find the largest keys (scan-based — does not block)
redis-cli --bigkeys
```

### Verifying AOF is enabled

AOF (Append-Only File) ensures Redis data survives a restart. Verify it is active:

```bash
docker exec gympro-redis redis-cli INFO persistence | grep aof
```

Expected output:

```
aof_enabled:1
aof_rewrite_in_progress:0
aof_current_size:...
```

If `aof_enabled:0`, the container is not running with `--appendonly yes`. Check the Docker Compose command and restart the container.

### Checking keyspace and BullMQ key structure

```bash
# Count total keys
redis-cli DBSIZE

# Scan all BullMQ-related keys (non-blocking)
redis-cli --scan --pattern "bull:*" | head -40

# Check all queue key types
redis-cli --scan --pattern "bull:notifications:*" | sort
```

### Flushing cache keys only (not queue keys)

GymPro may cache API responses under a custom prefix. Flush only cache keys, not BullMQ job data:

```bash
# Preview keys to be deleted
redis-cli --scan --pattern "cache:*"

# Delete cache keys (use carefully in production)
redis-cli --scan --pattern "cache:*" | xargs redis-cli DEL
```

---

## 8. Common Admin Tasks

### Adding a new gym

Use the API directly or via the admin panel. Via API:

```bash
curl -s -X POST http://localhost:5050/api/v1/gyms \
  -H "Authorization: Bearer <super-admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Iron Paradise",
    "email": "contact@ironparadise.com",
    "phone": "+1-555-0100",
    "address": "123 Fitness Blvd, Austin TX"
  }' | python3 -m json.tool
```

Verify the gym was created and the audit log recorded the event:

```bash
curl -s http://localhost:5050/api/v1/audit?gymId=<new-gym-id> \
  -H "Authorization: Bearer <super-admin-jwt>" | python3 -m json.tool
```

### Resetting an admin password

There is no built-in password reset CLI. Options:

**Option A — Via the API (if the forgot-password flow is implemented):**

```bash
curl -s -X POST http://localhost:5050/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@gym.com"}'
```

**Option B — Directly in the database using Prisma:**

```bash
# Generate a bcrypt hash for the new password (bcrypt rounds = BCRYPT_SALT, default 10)
node -e "
const bcrypt = require('bcryptjs');
bcrypt.hash('NewTemporaryPass!1', 10).then(h => console.log(h));
"

# Update the user record
docker exec -it gympro-backend-prod npx prisma db execute --stdin <<'SQL'
UPDATE "User" SET "password" = '$2a$10$<hash>' WHERE "email" = 'admin@gym.com';
SQL
```

Always force the user to change this password on next login.

### Investigating a member complaint

1. Identify the member's user ID from their email:

```bash
docker exec -it gympro-backend-prod npx prisma db execute --stdin <<'SQL'
SELECT id, name, email, "createdAt" FROM "Member" WHERE email = 'member@example.com';
SQL
```

2. Check audit logs for that member's recent activity:

```bash
curl -s "http://localhost:5050/api/v1/audit?userId=<user-id>" \
  -H "Authorization: Bearer <super-admin-jwt>" | python3 -m json.tool
```

3. Check backend logs around the time of the complaint:

```bash
docker logs gympro-backend --since "2026-05-30T09:00:00" --until "2026-05-30T10:00:00" 2>&1 \
  | grep "<user-id or member email>"
```

4. Check if any jobs failed for that member:

```bash
docker exec -it gympro-backend node -e "
const { Queue } = require('bullmq');
const q = new Queue('notifications', { connection: { host: 'redis', port: 6379 } });
q.getFailed(0, 100).then(jobs => {
  const matched = jobs.filter(j => JSON.stringify(j.data).includes('<member-id>'));
  matched.forEach(j => console.log(j.id, j.name, j.data));
  process.exit(0);
});
"
```

### Checking audit logs

The audit service records all mutating API actions with IP address, method, path, and entity details.

```bash
# All audit logs for a specific gym (last 100)
curl -s "http://localhost:5050/api/v1/audit?gymId=<gym-id>" \
  -H "Authorization: Bearer <super-admin-jwt>" | python3 -m json.tool

# All audit logs system-wide (super admin only)
curl -s "http://localhost:5050/api/v1/audit" \
  -H "Authorization: Bearer <super-admin-jwt>" | python3 -m json.tool
```

Audit log fields: `id`, `gymId`, `userId`, `action`, `method`, `path`, `ipAddress`, `userAgent`, `metadata`, `createdAt`.

---

## 9. Performance Tuning

### When to increase WORKER_CONCURRENCY

The worker processes jobs on the `notifications`, `emails`, and `billing` queues. Default concurrency is set in the worker configuration.

Increase concurrency when:
- Queue depth is consistently above 1,000 jobs during peak hours.
- Active job count is always at or near the current concurrency limit (visible in Grafana Queue Health).
- Worker CPU usage is low (jobs are I/O bound — network calls to email/SMS providers).

Do not increase concurrency when:
- Worker heap usage is already above 70%. Increase worker replicas instead.
- Jobs are CPU-intensive. More concurrency on a single process will cause contention.

```bash
# Set via environment variable — add to apps/backend/.env.production
WORKER_CONCURRENCY=20

# Then restart the worker
docker-compose -f docker-compose.prod.yml restart worker
```

### When to add worker instances

Add a second worker container when:
- Single worker CPU is consistently above 70%.
- Queue depth keeps growing despite max concurrency.
- You need fault tolerance (one worker crash should not stop all job processing).

Add a second worker in `docker-compose.prod.yml`:

```yaml
worker-2:
  # Same definition as worker — BullMQ workers compete for jobs automatically
  <<: *worker-definition
  container_name: gympro-worker-2-prod
```

BullMQ uses Redis-based distributed locking. Multiple workers process jobs from the same queue without duplication.

### Redis memory tuning

Production Redis is limited to 512 MB. If `used_memory` approaches this limit:

1. Check which BullMQ queues are accumulating jobs and clear completed jobs:

```bash
redis-cli INFO memory | grep used_memory_human
redis-cli --bigkeys  # find the largest keys
```

2. Reduce `removeOnComplete` count in `apps/backend/src/queues/redis.ts` (currently 500 jobs / 24 h).

3. If Redis is used for caching as well, add `maxmemory` and `maxmemory-policy allkeys-lru` to the Redis command in Docker Compose:

```yaml
command: redis-server --appendonly yes --appendfsync everysec --maxmemory 400mb --maxmemory-policy allkeys-lru
```

### Node.js memory tuning

Backend container is limited to 1 GB. If heap usage is consistently above 80%:

1. Increase the V8 heap size limit (add to backend Dockerfile `CMD` or `ENTRYPOINT`):

```bash
NODE_OPTIONS="--max-old-space-size=768" node dist/server.js
```

2. If RSS (resident set size) is the issue, investigate native module memory leaks or large buffer usage.

3. Enable heap snapshots in a staging environment to identify memory leaks:

```bash
NODE_OPTIONS="--inspect=0.0.0.0:9229" node dist/server.js
# Attach Chrome DevTools at chrome://inspect
```

4. If the backend consistently uses > 900 MB, increase the container memory limit to 2 GB and adjust the host accordingly.

---

## 10. Maintenance

### Graceful shutdown procedure

Before stopping any service, drain in-flight requests and jobs to avoid data corruption.

```bash
# 1. Remove the service from load balancer / mark as draining (Nginx upstream)
#    OR signal the process to stop accepting new connections:

# Stop backend gracefully (SIGTERM triggers graceful shutdown in most Node.js frameworks)
docker kill --signal=SIGTERM gympro-backend
# Wait 30 s for in-flight requests to complete
sleep 30
docker stop gympro-backend

# 2. Stop the worker gracefully — BullMQ listens for SIGINT and closes workers cleanly
docker kill --signal=SIGINT gympro-worker
sleep 15
docker stop gympro-worker

# 3. Stop remaining services
docker stop gympro-nginx gympro-grafana gympro-prometheus
docker stop gympro-redis  # stop Redis last
```

### Zero-downtime deployment steps

GymPro does not yet have a multi-replica orchestrator (Kubernetes / ECS). The lowest-downtime process with Docker Compose:

1. Build the new image on the host without stopping the running container:

```bash
docker-compose -f docker-compose.prod.yml build backend worker
```

2. Take a database backup:

```bash
bash scripts/backup.sh
```

3. Apply any pending Prisma migrations:

```bash
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy
```

4. Replace the backend container (brief downtime ~5 s while the new container starts and passes its health check):

```bash
docker-compose -f docker-compose.prod.yml up -d --no-deps backend
```

5. Replace the worker container (no user-facing downtime; BullMQ jobs queue in Redis while worker restarts):

```bash
docker-compose -f docker-compose.prod.yml up -d --no-deps worker
```

6. Verify health:

```bash
bash scripts/health-check.sh
```

### Database vacuum

PostgreSQL auto-vacuum runs automatically but may fall behind after large bulk deletes (e.g., purging old audit logs).

Run a manual vacuum analyze during a low-traffic window:

```bash
docker exec -it <postgres-container> psql -U <user> -d gympro -c "VACUUM ANALYZE;"
```

For a more thorough reclaim of disk space (locks the table briefly):

```bash
docker exec -it <postgres-container> psql -U <user> -d gympro -c "VACUUM FULL ANALYZE;"
```

Check table bloat before deciding:

```sql
SELECT
  relname,
  pg_size_pretty(pg_total_relation_size(oid)) AS total_size,
  pg_size_pretty(pg_relation_size(oid)) AS table_size
FROM pg_class
WHERE relkind = 'r'
ORDER BY pg_total_relation_size(oid) DESC
LIMIT 15;
```

### Log rotation

Docker logs are written to JSON files on the host under `/var/lib/docker/containers/<id>/`. Configure Docker's log driver in `/etc/docker/daemon.json` to cap log file size:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "5"
  }
}
```

Reload Docker after changing daemon.json:

```bash
sudo systemctl reload docker
```

Existing containers must be recreated (not restarted) to pick up the new log driver settings.

---

## 11. Command Cheat Sheet

### Health

```bash
bash scripts/health-check.sh                          # Full health check
curl -s http://localhost:5050/api/v1/health           # API liveness
curl -s http://localhost:5050/api/v1/health/ready     # API readiness
curl -s http://localhost:9090/-/ready                 # Prometheus ready
curl -s http://localhost:9090/api/v1/alerts           # Active alert list
```

### Containers

```bash
docker ps --filter name=gympro -a                     # All gympro containers
docker stats $(docker ps --filter name=gympro -q)     # Live resource stats
docker-compose restart backend                         # Restart backend
docker-compose restart worker                          # Restart worker
docker-compose restart redis                           # Restart Redis
docker-compose -f docker-compose.prod.yml up -d       # Start prod stack
docker-compose down                                    # Stop dev stack (keeps volumes)
```

### Logs

```bash
docker logs -f gympro-backend                         # Tail backend
docker logs -f gympro-worker                          # Tail worker
docker logs --tail 100 gympro-nginx                   # Last 100 nginx lines
docker logs gympro-worker 2>&1 | grep "job failed"    # Worker failures
docker logs gympro-backend 2>&1 | grep -i error       # Backend errors
```

### Backup and restore

```bash
bash scripts/backup.sh                                # Backup to ./backups/
ls -lh ./backups/                                     # List backups
pg_restore --list ./backups/<file>.pgdump | head -20  # Verify backup
bash scripts/restore.sh ./backups/<file>.pgdump       # Restore
```

### Database

```bash
npx prisma migrate deploy                             # Apply prod migrations
npx prisma db pull                                    # Sync schema from DB
npx prisma studio                                     # Visual DB browser (dev only)
```

### Redis

```bash
docker exec -it gympro-redis redis-cli                # Enter Redis CLI
redis-cli INFO memory | grep used_memory_human        # Memory used
redis-cli INFO persistence | grep aof                 # AOF status
redis-cli INFO keyspace                               # Key count per DB
redis-cli DBSIZE                                      # Total key count
redis-cli --bigkeys                                   # Largest keys scan
redis-cli LLEN bull:notifications:wait                # Notification queue depth
redis-cli LLEN bull:emails:wait                       # Email queue depth
redis-cli LLEN bull:billing:wait                      # Billing queue depth
redis-cli LLEN bull:dead-letter:wait                  # DLQ depth
```

### Queues

```bash
# Inspect queue counts (inside backend container node REPL)
docker exec -it gympro-backend node -e "
const {Queue}=require('bullmq');
const q=new Queue('notifications',{connection:{host:'redis',port:6379}});
q.getJobCounts('waiting','active','completed','failed','delayed').then(c=>{console.log(c);process.exit(0);});
"

# Retry all failed jobs in a queue
docker exec -it gympro-backend node -e "
const {Queue}=require('bullmq');
const q=new Queue('notifications',{connection:{host:'redis',port:6379}});
q.getFailed(0,100).then(async j=>{for(const x of j)await x.retry();console.log('Done');process.exit(0);});
"
```

### Grafana

```bash
open http://localhost:3000                            # Grafana UI (dev)
ssh -L 3000:localhost:3000 user@prod-host            # Tunnel to prod Grafana
curl -s http://localhost:3000/api/health              # Grafana health
curl -s http://localhost:3000/api/datasources         # Datasource list
docker logs gympro-grafana 2>&1 | grep -i err        # Grafana errors
```

### Prometheus

```bash
open http://localhost:9090                            # Prometheus UI (dev)
curl -s http://localhost:9090/api/v1/targets          # Scrape target status
curl -s 'http://localhost:9090/api/v1/query?query=rate(gympro_http_requests_total[5m])'
curl -s 'http://localhost:9090/api/v1/query?query=gympro_queue_depth'
curl -s 'http://localhost:9090/api/v1/query?query=gympro_socket_connections_active'
docker logs gympro-prometheus 2>&1 | grep -i err     # Prometheus errors
```

### Performance

```bash
# Node.js heap snapshot (attach debugger)
NODE_OPTIONS="--inspect=0.0.0.0:9229" node dist/server.js

# PostgreSQL vacuum
docker exec -it <pg-container> psql -U <user> -d gympro -c "VACUUM ANALYZE;"

# Redis memory pressure relief (flush cache keys only)
redis-cli --scan --pattern "cache:*" | xargs redis-cli DEL
```

---

*This runbook covers GymPro as deployed with Docker Compose. For Kubernetes or cloud-managed deployments, adapt container names and access methods accordingly.*
