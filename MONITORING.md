# GymPro Monitoring & Observability Stack

Complete Prometheus + Grafana monitoring setup for GymPro backend.

## Architecture

```txt
GymPro Backend (metrics endpoint)
         ↓
    Prometheus (scraper)
         ↓
    Grafana (dashboards)
```

## Components

### 1. Prometheus (`prometheus.yml`)
- Scrapes metrics from backend `/api/health/metrics` endpoint
- Runs on `http://localhost:9090`
- Retains data for 30 days
- Configured with 15-second scrape interval

### 2. Grafana (`http://localhost:3000`)
- Default credentials: `admin` / `admin`
- Auto-provisioned Prometheus datasource
- 4 operational dashboards included

### 3. Metrics Emitted

#### HTTP Metrics
- Request count + rate
- Request duration (p50, p95, p99)
- Request/response sizes
- Error rates by status code

#### Queue Metrics (BullMQ)
- Jobs completed/failed/retried
- Queue depth (pending jobs)
- Job processing duration
- Active jobs
- Stalled jobs
- Dead letter queue size

#### Socket Metrics (WebSocket)
- Active connections
- Total connections (lifetime)
- Connection/disconnection events
- Events emitted/received
- Socket auth failures
- Message sizes
- Room population

#### System Metrics
- Node.js memory usage (heap, RSS, external)
- Event loop lag
- Redis connection health
- Redis operation latency
- Database connection pool size/waiting
- Worker process health
- Server uptime

## Quick Start

### 1. Start with Docker Compose
```bash
cd gympro
docker-compose up -d
```

### 2. Verify Services
```bash
# Backend + Prometheus metrics
curl http://localhost:5050/api/health/metrics

# Prometheus
open http://localhost:9090

# Grafana
open http://localhost:3000
```

### 3. View Dashboards
Login to Grafana at `http://localhost:3000`

Available dashboards:
- **GymPro API Metrics** — Request rate, latency, errors, size
- **GymPro Queue Health** — Job processing, failures, depth, retries
- **GymPro Realtime Activity** — Socket connections, events, latency
- **GymPro System Health** — Memory, event loop, Redis, database, uptime

## Metrics Endpoints

### Prometheus Scrape
```
http://backend:5050/api/health/metrics
```

### Queries in Prometheus

#### Request Rate
```promql
rate(gympro_http_requests_total[5m])
```

#### P95 Latency
```promql
histogram_quantile(0.95, rate(gympro_http_request_duration_seconds_bucket[5m]))
```

#### Queue Depth
```promql
gympro_queue_depth
```

#### Active Connections
```promql
gympro_socket_connections_active
```

## Production Checklist

Before deploying to production:

- [ ] Set up external Prometheus instance
- [ ] Configure persistent storage for Prometheus (SSD recommended)
- [ ] Set up alert rules for critical metrics
- [ ] Configure Alertmanager
- [ ] Add rate limiting on /metrics endpoint
- [ ] Set up Grafana backups
- [ ] Configure SSL/TLS for Grafana
- [ ] Monitor Prometheus disk space
- [ ] Set up log aggregation (Loki)
- [ ] Add tracing (Jaeger/Zipkin)

## Monitoring Strategy

### Real-time Dashboards
- API health dashboard for operations team
- Queue health dashboard for DevOps
- Realtime activity for feature teams
- System health for infrastructure

### Key Metrics to Watch

**Critical (alert immediately)**
- HTTP error rate > 5%
- Queue depth > 10,000
- Active connections > threshold
- Memory usage > 80%
- Event loop lag > 100ms

**Warning (investigate)**
- Job failure rate spike
- Socket auth failures spike
- Request latency p95 > 500ms
- Redis operation latency spike

## Future Enhancements

- [ ] Custom dashboards per gym (multi-tenant monitoring)
- [ ] Alerting rules (PagerDuty integration)
- [ ] Distributed tracing (Jaeger)
- [ ] Log aggregation (Loki)
- [ ] Metrics collection for mobile apps
- [ ] Business metrics dashboards (revenue, members, churn)
- [ ] ML-based anomaly detection
- [ ] Custom metric exports for data warehouse

## Troubleshooting

### Prometheus not scraping
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check backend metrics endpoint
curl http://localhost:5050/api/health/metrics
```

### Grafana dashboards not loading
```bash
# Check Grafana logs
docker logs gympro-grafana

# Verify datasource
curl http://localhost:3000/api/datasources
```

### High memory usage
- Reduce Prometheus retention: `--storage.tsdb.retention.time=7d`
- Reduce scrape frequency
- Remove unused metrics

## References

- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/)
- [BullMQ Metrics](https://docs.bullmq.io/)
- [Node.js Metrics](https://nodejs.org/en/docs/guides/simple-profiling/)
