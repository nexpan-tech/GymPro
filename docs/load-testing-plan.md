# GymPro — Load Testing Plan (Stage 10)

Goal: validate the platform holds **1,000 concurrent members across 100 gyms** with realtime messaging, QR check-ins, and billing spikes, without breaching latency/error SLOs.

## SLOs (targets)
| Metric | Target |
|---|---|
| API p95 latency (reads) | < 300 ms |
| API p95 latency (writes) | < 600 ms |
| Error rate | < 1% |
| Socket connect success | > 99% |
| Realtime message delivery p95 | < 1 s |
| Queue (notifications) drain | < 30 s backlog at peak |

## Tooling
- **HTTP**: k6 (or Artillery) — ramped VUs, scenarios below.
- **WebSocket**: k6 `ws` / Artillery socket.io engine.
- **Infra metrics**: Prometheus `/api/v1/health/metrics` + `/health/full` (db/redis/queue/socket), Render/Docker stats.
- **DB**: Neon connection-pool saturation; watch `prisma` pool + `pg` active connections.

## Seed data
- 100 gyms, ~1,000 members total (10 avg/gym, skew to 50 in 5 gyms), trainers, memberships, payments history (6 mo), challenges, devices with Expo tokens.

## Scenarios

### S1 — Steady browse (read-heavy), 1,000 VUs, 10 min
- Login once, reuse JWT. Loop: dashboard, `/members/my`, `/notifications/me`, `/announcements/me`, `/gamification/me/summary`, `/ai/me/recommendations`.
- Assert p95 < 300 ms, error < 1%.

### S2 — QR check-in spike, 500 VUs, 2 min burst
- `POST /attendance/scan` (members), peak 9am.
- Watch attendance create latency + the Stage 8 gamification event hook (points/streak) not blocking the response.

### S3 — Realtime messaging, 1,000 socket clients
- Connect authenticated sockets (gym/user rooms). Trainers send `POST /communication/messages` to members; assert `chat.message` delivery p95 < 1 s; Redis adapter fan-out across 2+ API instances.

### S4 — Broadcast fan-out, 100 gyms
- Admins `POST /comms/broadcast` (audience ALL) + `POST /announcements/:id/send`. Verify `broadcastLimiter` (30/hr) holds, DeliveryLog writes keep up, notification queue drains < 30 s.

### S5 — Billing spike, 300 VUs, 3 min
- `POST /payments` + `POST /payments/checkout/order`. Verify `paymentLimiter` (30/min) and invoice generation + `payment.updated` socket emit under load.

## Pass/fail
Run each scenario 3×. A scenario passes if all SLOs hold on 2/3 runs and no scenario causes DB pool exhaustion or unbounded queue growth.

## Scaling levers (if failing)
- Horizontal: add API replicas (socket Redis adapter already supports it) + worker replicas.
- DB: raise Neon pool / add read replica for analytics endpoints.
- Cache: memoize enterprise/intelligence aggregates (short TTL via existing Redis `cache.ts`).
- Queue: raise `WORKER_CONCURRENCY`.
