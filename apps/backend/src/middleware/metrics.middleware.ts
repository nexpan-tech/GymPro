import { Request, Response, NextFunction } from 'express';
import {
  register,
  Histogram,
  Counter,
  Gauge,
} from 'prom-client';

// ---------------------------------------------------------------------------
// Module-level singletons — created once, never per-request
// ---------------------------------------------------------------------------

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
});

const httpActiveConnections = new Gauge({
  name: 'http_active_connections',
  help: 'Number of HTTP requests currently being processed',
});

const queueJobsCompleted = new Counter({
  name: 'queue_jobs_completed_total',
  help: 'Total number of queue jobs completed successfully',
  labelNames: ['queue'] as const,
});

const queueJobsFailed = new Counter({
  name: 'queue_jobs_failed_total',
  help: 'Total number of queue jobs that failed',
  labelNames: ['queue'] as const,
});

const socketConnections = new Gauge({
  name: 'socket_active_connections',
  help: 'Number of active WebSocket connections',
});

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Safely derive a normalised route label from an Express request.
 * Falls back gracefully when req.route is undefined (e.g. 404 paths or
 * middleware-only calls) — the root cause of the original crash.
 */
function extractRoute(req: Request): string {
  const rawRoute =
    req.route && req.route.path
      ? req.route.path
      : req.baseUrl || req.path || 'unknown';

  return rawRoute
    // Replace UUIDs with a placeholder
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ':id',
    )
    // Replace bare numeric path segments with a placeholder
    .replace(/\/\d+(?=\/|$)/g, '/:id');
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

/**
 * Express middleware that records Prometheus HTTP metrics.
 * Skips /metrics and /health routes to avoid noise and recursion.
 */
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const path = req.path || '';

  // Do not instrument the scrape or health-check endpoints themselves
  if (path === '/metrics' || path === '/health') {
    return next();
  }

  const startTime = process.hrtime.bigint();
  const method = req.method || 'UNKNOWN';

  httpActiveConnections.inc();

  res.on('finish', () => {
    // Derive route AFTER the request has been handled so req.route is populated
    const route = extractRoute(req);
    const statusCode = String(res.statusCode);

    const durationNs = process.hrtime.bigint() - startTime;
    const durationSeconds = Number(durationNs) / 1e9;

    httpRequestDuration.observe({ method, route, status_code: statusCode }, durationSeconds);
    httpRequestsTotal.inc({ method, route, status_code: statusCode });
    httpActiveConnections.dec();
  });

  next();
}

// ---------------------------------------------------------------------------
// Queue / socket helper exports
// ---------------------------------------------------------------------------

export function incrementQueueJobCompleted(queueName: string): void {
  queueJobsCompleted.inc({ queue: queueName });
}

export function incrementQueueJobFailed(queueName: string): void {
  queueJobsFailed.inc({ queue: queueName });
}

export function setActiveSocketConnections(count: number): void {
  socketConnections.set(count);
}

export { register };
