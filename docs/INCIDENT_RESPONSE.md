# GymPro Incident Response Playbook

## Severity Classification

| Level | Name | Criteria | Response Time |
|-------|------|----------|---------------|
| P0 | Critical | Complete service outage, data loss risk | 5 minutes |
| P1 | High | Major feature broken, >20% error rate | 30 minutes |
| P2 | Medium | Degraded performance, queue backup | 2 hours |
| P3 | Low | Minor bug, cosmetic issue | Next business day |

### P0 Critical
Complete service outage or data loss risk. All hands on deck. Notify stakeholders immediately. Escalate if not resolved within 15 minutes.

### P1 High
Major feature broken or error rate exceeds 20%. Assign a dedicated responder. Notify stakeholders. Begin investigation immediately.

### P2 Medium
Degraded performance or queue backup. Investigate within 2 hours. No immediate stakeholder notification required unless escalated.

### P3 Low
Minor bug or cosmetic issue. Log the issue, schedule for next sprint or business day resolution.

---

## Incident Response Steps

1. **Detect** — Alert source: Prometheus alert, Sentry notification, or user report.
2. **Assess** — Determine severity using the classification table above.
3. **Communicate** — Notify stakeholders immediately for P0 and P1 incidents. Use communication templates below.
4. **Investigate** — Gather data: check logs, metrics dashboards, Sentry errors, and recent deployments.
5. **Mitigate** — Stop the bleeding. Apply the fastest available fix to restore service, even if temporary.
6. **Resolve** — Deploy a permanent fix or validated configuration change.
7. **Post-Mortem** — Document what happened, root cause, timeline, and prevention measures using the template below.

---

## Runbook: Backend Down (P0)

**Symptoms:** Health check failing, API returning 502/503, Prometheus alert fired.

1. Check container status:
   ```bash
   docker ps | grep gympro-backend
   ```
2. Check recent logs:
   ```bash
   docker logs gympro-backend --tail=100
   ```
3. Check Sentry for recent unhandled exceptions.
4. Attempt immediate restart:
   ```bash
   docker compose restart backend
   ```
5. Verify health after restart:
   ```bash
   curl -sf http://localhost:5050/api/v1/health
   ```
6. If restart fails, force recreate:
   ```bash
   docker compose up --force-recreate -d backend
   ```
7. If still failing, check host resources (disk, memory) and escalate.

---

## Runbook: Redis Connection Failure (P0)

**Symptoms:** Backend logs show Redis connection errors, queue processing stopped, session issues.

1. Check container status:
   ```bash
   docker ps | grep gympro-redis
   ```
2. Ping Redis directly:
   ```bash
   docker exec gympro-redis redis-cli ping
   ```
   Expected response: `PONG`
3. Check Redis logs:
   ```bash
   docker logs gympro-redis --tail=50
   ```
4. Restart Redis:
   ```bash
   docker compose restart redis
   ```
5. Once Redis is healthy, restart dependent services:
   ```bash
   docker compose restart backend worker
   ```
6. Verify queue processing resumes by checking the health endpoint and Grafana Queue Health dashboard.

---

## Runbook: BullMQ Queue Backup (P1)

**Symptoms:** Grafana shows rising queue depth, jobs not completing, worker logs show errors.

1. Check worker logs:
   ```bash
   docker logs gympro-worker --tail=100
   ```
2. Check queue depth via health endpoint:
   ```bash
   curl -sf http://localhost:5050/api/v1/health | jq '.queues'
   ```
3. Restart the worker:
   ```bash
   docker compose restart worker
   ```
4. Monitor Grafana Queue Health dashboard for recovery. Queue depth should begin decreasing within 2-3 minutes.
5. Check the dead letter queue for permanently failed jobs:
   ```bash
   docker exec gympro-redis redis-cli llen bull:default:failed
   ```
6. If dead letter queue is growing, investigate the failing job type in worker logs and Sentry.

---

## Runbook: High Error Rate (P1)

**Symptoms:** Prometheus alert for error rate >20%, Sentry spike in errors, user reports of failures.

1. Open Grafana API Performance dashboard and identify the time error rate spiked.
2. Check which routes are failing — look at the HTTP 5xx breakdown panel.
3. Open Sentry and filter errors by the last 30 minutes to identify the error type and stack trace.
4. Check backend logs for correlated errors:
   ```bash
   docker logs gympro-backend --tail=200
   ```
5. If error is database-related: check Neon dashboard for connection pool exhaustion, slow queries, or outage status.
6. If error is Redis-related: follow the Redis Connection Failure runbook above.
7. If a recent deployment is correlated: consider rollback.

---

## Runbook: Memory Leak (P2)

**Symptoms:** Grafana System Metrics shows steadily climbing heap usage, increased event loop lag, eventual OOM crash.

1. Open Grafana System Metrics dashboard and review the heap usage trend over the past 6-24 hours.
2. Observe event loop lag panel — sustained lag >100ms indicates a blocked loop or heavy allocation.
3. Perform a rolling restart to restore immediate stability:
   ```bash
   docker compose restart backend
   ```
4. After restart, continue monitoring heap growth rate. If it returns quickly, the leak is reproducible.
5. Investigate code paths:
   - Review recent PRs for unbounded caches, unreleased event listeners, or large in-memory data structures.
   - Enable heap profiling if available in the environment.
6. Deploy a fix, verify heap stabilizes in Grafana, and document findings in a post-mortem.

---

## Runbook: Database Slow Queries (P2)

**Symptoms:** Increased API latency in Grafana, Neon dashboard shows slow query alerts, backend logs show query timeouts.

1. Open Neon dashboard and navigate to the slow query log.
2. Identify the problematic query by duration, frequency, and table.
3. Run `EXPLAIN ANALYZE` on the query in Neon's query editor to confirm a missing index or full table scan.
4. Add the missing index via a Prisma migration:
   ```bash
   # Add @@index or @index to the Prisma schema, then:
   npx prisma migrate dev --name add_index_<table>_<column>
   ```
5. Re-run `EXPLAIN ANALYZE` to confirm index is being used.
6. Deploy migration to production and verify latency returns to baseline in Grafana.

---

## Post-Mortem Template

Use this template within 48 hours of resolving any P0 or P1 incident.

```
## Incident Post-Mortem

**Incident Date/Time:** YYYY-MM-DD HH:MM UTC
**Duration:** X hours Y minutes
**Severity:** P0 / P1 / P2
**Incident Commander:**

### Summary
2-3 sentences describing what happened, the impact, and how it was resolved.

### Timeline
| Time (UTC) | Event |
|------------|-------|
| HH:MM | Alert fired / issue first detected |
| HH:MM | On-call engineer paged |
| HH:MM | Investigation began |
| HH:MM | Root cause identified |
| HH:MM | Mitigation applied |
| HH:MM | Service restored |
| HH:MM | Incident closed |

### Root Cause
Detailed technical description of the root cause.

### Contributing Factors
- Factor 1
- Factor 2

### Impact
- Number of users affected
- Features unavailable
- Data integrity impact (if any)
- Duration of impact

### Resolution
Steps taken to resolve the incident.

### Action Items
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Fix X | @engineer | YYYY-MM-DD | Open |
| Add alert for Y | @engineer | YYYY-MM-DD | Open |

### Prevention Measures
What changes will prevent this class of incident from recurring?
```

---

## Communication Templates

### Initial Stakeholder Notification (P0/P1)

> We are investigating [issue description]. Our team is working to resolve this as quickly as possible. Updates will follow every 30 minutes.

### Status Update (every 30 minutes during active incident)

> Update [HH:MM UTC]: We have identified [what is known]. We are currently [action being taken]. Estimated resolution: [ETA or "unknown, continuing investigation"].

### Resolution Notification

> The issue affecting [feature/service] has been resolved as of [HH:MM UTC]. Service is operating normally. We will publish a post-mortem within 48 hours. We apologize for the disruption.

### Stakeholder Escalation (P0 unresolved after 15 minutes)

> ESCALATION: The P0 incident affecting [service] has not been resolved within the initial response window. Escalating to [name/team]. Current status: [brief summary].

---

## Contacts and Escalation Path

| Role | Responsibility | Escalation Trigger |
|------|---------------|--------------------|
| On-Call Engineer | First responder, owns mitigation | Default for all alerts |
| Tech Lead | Escalated investigation, architectural decisions | P0 unresolved >15 min, P1 unresolved >1 hour |
| Engineering Manager | Stakeholder communication, resource allocation | P0 with customer impact |

---

## Tools Reference

| Tool | Purpose | URL |
|------|---------|-----|
| Grafana | Metrics dashboards (API Performance, Queue Health, System Metrics) | http://localhost:3001 |
| Prometheus | Raw metrics and alert rules | http://localhost:9090 |
| Sentry | Error tracking and stack traces | https://sentry.io |
| Neon | PostgreSQL database dashboard and slow query log | https://console.neon.tech |
| Health Endpoint | Live service health check | http://localhost:5050/api/v1/health |
