# GymPro Scaling Guide

This document describes how GymPro scales from a single-instance deployment to a multi-region, multi-thousand gym production environment.

---

## 1. Current Baseline Capacity

A single backend instance paired with a single BullMQ worker can comfortably handle:

| Resource | Estimate |
|---|---|
| Concurrent WebSocket connections | ~500 users |
| Active gyms simultaneously | ~50 gyms |
| Total member records | 10,000+ members |
| API request throughput | ~200 req/s sustained |
| Background jobs (BullMQ) | ~100 jobs/min |

These numbers assume:
- A Neon Postgres instance with pgbouncer connection pooling.
- A single Redis instance (2 GB RAM or higher).
- The backend process allocated at least 512 MB RAM and 1 vCPU.
- Node.js cluster mode is NOT yet enabled (single process, single core).

Beyond this baseline, response times begin to degrade under sustained load. The architecture was designed from the start to scale horizontally rather than vertically.

---

## 2. Horizontal Scaling Design

GymPro is stateless by design, which means spinning up additional instances requires zero application-level changes. The following architectural decisions enable this:

### Stateless Backend
All authentication uses signed JWTs. No server-side session store is required. Any backend instance can validate any token independently.

### Redis as Shared State
Rate limiting, caching, presence tracking, and job queues are all stored in Redis — outside the application process. All backend instances share the same Redis connection, so state is consistent regardless of which instance handles a request.

### BullMQ Queue Fanout
BullMQ stores jobs in Redis. Multiple worker instances pull from the same queues. Adding workers increases job throughput linearly with no code changes.

### Socket.IO Redis Adapter
The `@socket.io/redis-adapter` package allows multiple Socket.IO server instances to share room membership and broadcast events via Redis pub/sub. A client connected to instance A will receive events emitted from instance B transparently.

---

## 3. Backend Scaling

### Running Multiple Instances

Start additional backend processes pointing at the same Redis and Postgres:

```bash
# Instance 1
PORT=4000 node dist/main.js

# Instance 2
PORT=4001 node dist/main.js

# Instance 3
PORT=4002 node dist/main.js
```

### Nginx Load Balancer Configuration

Place Nginx upstream in front of all backend instances. Use `least_conn` to route new connections to the least-busy instance:

```nginx
upstream gympro_backend {
    least_conn;
    server 127.0.0.1:4000;
    server 127.0.0.1:4001;
    server 127.0.0.1:4002;
    keepalive 64;
}

server {
    listen 80;
    server_name api.gympro.io;

    location / {
        proxy_pass http://gympro_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }
}
```

The `Upgrade` / `Connection` headers are required for WebSocket connections to pass through the proxy correctly.

### Session Consistency

Because GymPro uses JWT-based authentication (stateless), there is no sticky session requirement. Any backend instance can serve any request. The `least_conn` strategy is sufficient.

### Recommended Instance Count by Load

| Concurrent Users | Backend Instances |
|---|---|
| Up to 500 | 1 |
| 500 – 2,000 | 2 – 4 |
| 2,000 – 5,000 | 4 – 8 |
| 5,000 – 15,000 | 8 – 16 |
| 15,000+ | Kubernetes HPA (see Section 8) |

---

## 4. Worker Scaling

### Multiple Worker Instances

BullMQ workers are independent Node.js processes. To add workers:

```bash
# In each worker process
WORKER_CONCURRENCY=10 node dist/worker.js
```

The `WORKER_CONCURRENCY` environment variable controls how many jobs a single worker instance processes in parallel. The optimal value depends on whether jobs are CPU-bound or I/O-bound:

| Job Type | Recommended WORKER_CONCURRENCY |
|---|---|
| Email / SMS notifications (I/O-bound) | 20 – 50 |
| PDF report generation (CPU-bound) | 2 – 4 |
| Webhook delivery (I/O-bound) | 20 – 30 |
| Analytics aggregation (mixed) | 5 – 10 |

### Queue Partitioning for High-Volume Jobs

At scale, a single queue becomes a bottleneck. Partition high-volume queues by gym or tenant ID:

```typescript
// High-volume notification queue partitioned by shard
const shardId = gymId % NUM_QUEUE_SHARDS;
const queue = new Queue(`notifications-shard-${shardId}`, { connection: redis });
```

Assign dedicated worker instances to each shard to prevent one high-traffic gym from starving others.

### Worker Health Monitoring via Prometheus

Expose the following metrics from each worker process and scrape them with Prometheus:

- `bullmq_jobs_active` — jobs currently being processed
- `bullmq_jobs_waiting` — depth of the queue (alert if > 1000)
- `bullmq_jobs_failed_total` — failed job count (alert on rapid increase)
- `bullmq_job_duration_seconds` — histogram of job processing time

Use a Grafana dashboard to visualize queue depth per queue and per worker instance. Set an alert when `bullmq_jobs_waiting > 500` sustained for 5 minutes as the trigger to add worker instances.

---

## 5. WebSocket Scaling

### Redis Socket.IO Adapter

Without the Redis adapter, each Socket.IO server instance maintains its own in-memory room map. An event emitted on instance A is invisible to clients connected to instance B.

The Redis adapter solves this by using Redis pub/sub as a broadcast bus:

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'ioredis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

### How It Works

1. All backend instances connect to the same Redis instance using two connections each (one for publishing, one for subscribing).
2. When a client joins a room (e.g., `gym:42:live`), the socket server records membership in Redis.
3. When any instance emits to `gym:42:live`, Redis pub/sub fans the message out to all instances.
4. Each instance forwards the event to its locally connected clients in that room.

### Room Conventions

| Room Pattern | Purpose |
|---|---|
| `gym:{gymId}:live` | Live activity feed for a gym |
| `member:{memberId}:alerts` | Member-specific alerts |
| `staff:{gymId}:checkins` | Real-time check-in stream for staff |
| `admin:platform` | Platform-wide admin events |

### Capacity per Instance

A single Node.js Socket.IO instance handles approximately 5,000 – 10,000 concurrent WebSocket connections before event loop lag becomes noticeable. For 50,000 concurrent connections, plan for 6 – 12 Socket.IO instances behind Nginx.

---

## 6. Database Scaling

### Neon Connection Pooling (pgbouncer)

Neon provides a built-in pgbouncer endpoint. Use the pooled connection string for the application:

```
# .env (pooled — use this for the app)
DATABASE_URL=postgresql://user:pass@ep-xyz.us-east-1.aws.neon.tech/gympro?pgbouncer=true&sslmode=require

# Non-pooled — use only for migrations
DATABASE_MIGRATE_URL=postgresql://user:pass@ep-xyz.us-east-1.aws.neon.tech/gympro?sslmode=require
```

Never run `prisma migrate` against the pooled URL. pgbouncer does not support the advisory locks Prisma uses for migration.

### Prisma Connection Pool

Control Prisma's internal pool with the `connection_limit` parameter:

```
DATABASE_URL=...?connection_limit=5&pool_timeout=30
```

Per-instance guideline: set `connection_limit` to `(vCPUs × 2) + 1`. For a 2-vCPU instance, use `connection_limit=5`. Across 4 instances this is 20 total connections to pgbouncer, which maps to far fewer actual Postgres server connections.

### Read Replicas for Analytics

Heavy analytics queries (revenue reports, membership cohort analysis) should never run against the primary. Route them to a read replica:

```typescript
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
});

const analyticsDb = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_REPLICA_URL },
  },
});

// Use analyticsDb for all report generation queries
```

On Neon, enable read replicas in the Neon console and set `DATABASE_REPLICA_URL` to the replica endpoint.

### Slow Query Monitoring

Enable `pg_stat_statements` on Neon and create a Grafana panel for:

```sql
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

Alert on any query with `mean_exec_time > 500ms` and `calls > 100/min`. Add indexes or rewrite queries before scaling out instances — a slow query hits all instances equally.

---

## 7. Redis Scaling

### Memory Planning

Estimate Redis memory consumption:

| Data Type | Memory per Unit | Notes |
|---|---|---|
| Session / rate limit key | ~200 bytes | Expires in 15 min |
| BullMQ job (active) | ~2 KB | Expires on completion |
| BullMQ job (completed history) | ~1 KB | Keep last 500 per queue |
| Socket.IO room membership | ~100 bytes/member | Cleared on disconnect |
| Cache entries | ~5 KB avg | Depends on payload size |

For 50 active gyms with 500 concurrent users, budget approximately 500 MB for Redis working set. Start with 1 GB Redis and monitor `used_memory_rss`.

### Key Expiry Strategy

Every Redis key written by GymPro must have a TTL. Never write keys without expiry. Standard TTLs:

| Key Category | TTL |
|---|---|
| Rate limit windows | 60 seconds |
| Auth token blacklist | JWT expiry time |
| API response cache | 30 – 300 seconds |
| Presence / online status | 30 seconds (refreshed by heartbeat) |
| BullMQ completed jobs | 24 hours |
| BullMQ failed jobs | 7 days (for inspection) |

Set a Redis `maxmemory-policy` of `allkeys-lru` as a safety net to prevent OOM if a key is written without TTL.

### Redis Cluster for Extreme Scale

When Redis memory exceeds 8 GB or write throughput exceeds 100,000 ops/sec, migrate to Redis Cluster (3 primary + 3 replica shards minimum):

```
REDIS_URL=redis://cluster-node-1:6379,cluster-node-2:6379,cluster-node-3:6379
```

Note: BullMQ requires `ioredis` in cluster mode and all job keys in the same hash slot. Use `{gympro}:queue:{name}` key naming to force hash-slot colocation.

### Redis Sentinel for High Availability

For production deployments below Cluster scale, use Redis Sentinel (1 primary + 2 replicas + 3 sentinels):

```typescript
const redis = new Redis({
  sentinels: [
    { host: 'sentinel-1', port: 26379 },
    { host: 'sentinel-2', port: 26379 },
    { host: 'sentinel-3', port: 26379 },
  ],
  name: 'gympro-primary',
});
```

Sentinel provides automatic failover with no manual intervention. Failover completes in approximately 30 seconds.

---

## 8. Kubernetes Migration Path

### When to Migrate

Consider migrating from Docker Compose to Kubernetes when:

- You need more than 10 backend replica instances.
- You require automated horizontal pod autoscaling (HPA) based on CPU or custom metrics.
- You need zero-downtime rolling deployments without manual coordination.
- You need multi-cloud or multi-region pod scheduling.

### What Changes

| Docker Compose Concept | Kubernetes Equivalent |
|---|---|
| `services` in `docker-compose.yml` | `Deployment` + `Service` manifests |
| `environment` variables | `ConfigMap` (non-secret) + `Secret` (credentials) |
| `volumes` | `PersistentVolumeClaim` (PVC) |
| `docker-compose scale` | `kubectl scale` or HPA |
| Nginx proxy | `Ingress` with nginx-ingress-controller |
| Manual health checks | `livenessProbe` + `readinessProbe` |

### Minimal Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gympro-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gympro-backend
  template:
    metadata:
      labels:
        app: gympro-backend
    spec:
      containers:
        - name: backend
          image: gympro/backend:latest
          ports:
            - containerPort: 4000
          envFrom:
            - secretRef:
                name: gympro-secrets
          livenessProbe:
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 10
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 4000
            initialDelaySeconds: 5
            periodSeconds: 10
```

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: gympro-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: gympro-backend
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

Use KEDA (Kubernetes Event-Driven Autoscaling) to scale workers based on BullMQ queue depth instead of CPU.

### Helm Chart Migration

Package all manifests into a Helm chart for environment-specific overrides:

```
helm/
  gympro/
    Chart.yaml
    values.yaml          # defaults
    values.prod.yaml     # production overrides
    templates/
      backend-deployment.yaml
      worker-deployment.yaml
      ingress.yaml
      secrets.yaml
```

---

## 9. Multi-Region Architecture

### When to Consider Multi-Region

- P95 API latency > 200ms for users in a specific geography.
- Regulatory requirements mandate data residency in a specific region.
- Business continuity requires zero single-region dependency.

### Latency Considerations

Round-trip time between a user in Europe and a US-East backend is typically 80 – 120ms, adding latency to every API call and WebSocket message. Deploy a regional backend cluster in EU-West to serve European gyms.

Route users to the nearest region using GeoDNS or a global load balancer (AWS Global Accelerator, Cloudflare Load Balancing).

### Database Replication

Neon supports read replicas in additional regions. For writes, implement a primary-region model:

1. All write operations (gym config, memberships, transactions) go to the US-East primary.
2. EU-West backend reads from a Neon read replica in EU-West for low-latency reads.
3. Writes from EU-West are proxied to US-East (acceptable for low-frequency writes).

For data residency compliance, use separate Neon projects per region with no cross-region replication.

### Redis Cross-Region

Do not replicate Redis across regions over WAN — latency makes it impractical. Each region runs its own Redis cluster. The implications:

- BullMQ jobs are regional — a job enqueued in EU-West is processed by EU-West workers.
- Socket.IO rooms are regional — cross-region broadcasts require an application-level bridge.

For cross-region broadcasts (e.g., platform-wide admin announcements), use a dedicated Redis pub/sub topic replicated by an application bridge service.

### Active-Passive vs Active-Active

| Model | Description | When to Use |
|---|---|---|
| Active-Passive | One region serves all traffic; second region is warm standby | DR, not multi-region serving |
| Active-Active | Both regions serve traffic; users routed by geography | True multi-region, requires conflict-free writes |

Start with Active-Passive (simpler, no conflict resolution). Migrate to Active-Active only when business justification is clear — it requires CRDT or application-level conflict resolution for shared data.

---

## 10. Load Testing

### Recommended Tools

| Tool | Best For |
|---|---|
| k6 | Scripted HTTP and WebSocket load tests, CI integration |
| Artillery | YAML-defined scenarios, WebSocket, good for ops teams |
| Locust | Python-based, complex user behavior simulation |

### Test Scenarios

#### 1. Concurrent Logins

Simulate a burst of gym members logging in simultaneously (e.g., gym opening at 6am):

```javascript
// k6 script
import http from 'k6/http';

export const options = {
  scenarios: {
    login_burst: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 200 },
        { duration: '60s', target: 200 },
        { duration: '30s', target: 0 },
      ],
    },
  },
};

export default function () {
  http.post('https://api.gympro.io/auth/login', JSON.stringify({
    email: `member-${__VU}@test.com`,
    password: 'TestPass123!',
  }), { headers: { 'Content-Type': 'application/json' } });
}
```

Target: P95 login < 300ms, error rate < 0.1%.

#### 2. Membership Queries

Simulate staff querying member records at high frequency:

- 50 concurrent staff users.
- Each staff user queries `/members?gymId=X` every 2 seconds.
- Target: P95 < 150ms.

#### 3. Realtime Connections

Use Artillery's WebSocket plugin to simulate 500 concurrent Socket.IO connections:

```yaml
config:
  target: "https://api.gympro.io"
  phases:
    - duration: 60
      arrivalRate: 10
      name: Ramp up

scenarios:
  - name: WebSocket connection hold
    engine: socketio
    flow:
      - emit:
          channel: "join-gym"
          data: { gymId: 1 }
      - think: 300
```

Target: All connections established within 5s, no dropped connections under steady state.

#### 4. Queue Saturation

Enqueue 10,000 notification jobs in under 60 seconds and measure worker throughput:

- Monitor `bullmq_jobs_waiting` — should drain within 5 minutes with default worker config.
- If drain time exceeds 10 minutes, add worker instances or increase `WORKER_CONCURRENCY`.

### Load Test Checklist

- [ ] Run tests against a staging environment, never production.
- [ ] Set Prometheus alert thresholds before testing so alerts fire during the test.
- [ ] Record baseline metrics (P50, P95, P99 latency; error rate; CPU; memory) before scaling.
- [ ] Run each scenario for a minimum of 10 minutes to expose memory leaks and connection pool exhaustion.
- [ ] After each test, inspect Grafana for Redis memory growth, Postgres connection count, and event loop lag.

---

## 11. Capacity Planning Guide

Use this table to determine the number of backend instances and workers needed based on your gym count. Assumes an average of 20 concurrent users per active gym during peak hours.

| Gyms | Peak Concurrent Users | Backend Instances | Worker Instances | Redis Memory | Postgres Connections |
|---|---|---|---|---|---|
| 10 | ~200 | 1 | 1 | 512 MB | 10 |
| 50 | ~1,000 | 2 | 2 | 1 GB | 20 |
| 100 | ~2,000 | 3 – 4 | 3 | 2 GB | 40 |
| 250 | ~5,000 | 6 – 8 | 5 | 4 GB | 80 |
| 500 | ~10,000 | 10 – 14 | 8 | 8 GB | 140 |
| 1,000 | ~20,000 | 20 – 28 | 14 | 16 GB | 250 |
| 2,500 | ~50,000 | 50 – 70 | 30 | 32 GB + Cluster | 500 (via pgbouncer) |
| 5,000 | ~100,000 | Kubernetes HPA | Kubernetes HPA | Redis Cluster | Neon Enterprise |

Notes:
- "Postgres Connections" refers to pgbouncer client connections, not raw Postgres server connections.
- At 500+ gyms, move to Kubernetes with HPA to handle traffic spikes automatically.
- At 2,500+ gyms, evaluate Redis Cluster and Neon Enterprise support.

---

## 12. Cost Estimation

The following estimates are based on AWS EC2 (or equivalent) pricing for compute, managed Redis (ElastiCache), and Neon Postgres as of 2025. Prices are approximate and will vary by cloud provider and region.

### 100 Gyms (~2,000 peak concurrent users)

| Component | Specification | Monthly Cost (USD) |
|---|---|---|
| Backend (3 × t3.medium) | 2 vCPU, 4 GB RAM each | $100 |
| Workers (2 × t3.small) | 2 vCPU, 2 GB RAM each | $30 |
| Redis (ElastiCache r7g.large) | 13 GB RAM, Multi-AZ | $150 |
| Neon Postgres | Scale plan, 2 compute units | $69 |
| Nginx / Load balancer | ALB or equivalent | $25 |
| Egress / misc | Estimated | $50 |
| **Total** | | **~$424/month** |

### 500 Gyms (~10,000 peak concurrent users)

| Component | Specification | Monthly Cost (USD) |
|---|---|---|
| Backend (12 × t3.large) | 2 vCPU, 8 GB RAM each | $600 |
| Workers (6 × t3.medium) | 2 vCPU, 4 GB RAM each | $200 |
| Redis (ElastiCache r7g.2xlarge) | 52 GB RAM, Multi-AZ | $500 |
| Neon Postgres | Business plan, 8 compute units | $700 |
| Nginx / Load balancer | ALB with WAF | $150 |
| Read replica | 1 × Neon read replica | $200 |
| Egress / misc | Estimated | $200 |
| **Total** | | **~$2,550/month** |

### 1,000 Gyms (~20,000 peak concurrent users)

| Component | Specification | Monthly Cost (USD) |
|---|---|---|
| Backend (24 × t3.large, EKS) | Kubernetes node group | $1,200 |
| Workers (12 × t3.medium, EKS) | Kubernetes node group | $400 |
| Redis Cluster (6-node r7g.2xlarge) | Sharded + Multi-AZ | $1,500 |
| Neon Postgres | Enterprise plan | $2,000 |
| EKS control plane | Managed Kubernetes | $150 |
| Load balancer + WAF + CDN | AWS ALB + CloudFront | $400 |
| Read replicas (2×) | Analytics + regional | $600 |
| Observability (Grafana Cloud) | Business tier | $200 |
| Egress / misc | Estimated | $500 |
| **Total** | | **~$6,950/month** |

### Cost Optimization Tips

- Use Reserved Instances or Savings Plans for backend compute to save 30 – 40% over on-demand pricing.
- Enable Redis data tiering (ElastiCache r7g instances) to offload infrequently accessed keys to SSD.
- Use Neon's autoscaling compute to scale down Postgres during off-peak hours automatically.
- Cache aggressively in Redis to reduce read replica query load.
- Use Cloudflare as a CDN and DDoS mitigation layer to reduce egress from your origin.

---

## Appendix: Scaling Checklist

Before scaling out, verify the following:

- [ ] All environment variables use external config (no hardcoded values in code).
- [ ] Redis keys all have TTLs set.
- [ ] Prisma uses pooled DATABASE_URL (pgbouncer endpoint).
- [ ] Socket.IO Redis adapter is configured and tested with 2+ instances.
- [ ] `/health` and `/health/ready` endpoints return correct status codes.
- [ ] Prometheus metrics are scraped from all instances.
- [ ] Grafana dashboards show per-instance breakdowns.
- [ ] BullMQ failed jobs have an alert configured.
- [ ] Load test completed against staging before scaling production.
- [ ] Runbook exists for adding/removing backend instances.
