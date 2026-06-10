import { Request, Response } from "express";
import { prisma } from "../../config/db";
import { metricsRegistry } from "../../monitoring/metrics";
import { getSocketServer } from "../../realtime/socket";
import { getAllQueueStats } from "../../queues/queueMonitor";
import { notificationQueue, emailQueue, billingQueue } from "../../queues/queue";
import { createRedisConnection } from "../../config/redis";

export class HealthController {
  static async health(req: Request, res: Response) {
    return res.json({
      success: true,
      status: "healthy",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: "gympro-api",
    });
  }

  /** Liveness — process is up (no external deps checked). */
  static async live(_req: Request, res: Response) {
    return res.json({ success: true, status: "alive", uptime: process.uptime(), timestamp: new Date().toISOString() });
  }

  /** Full sub-system health: database, redis, queues, socket. */
  static async full(_req: Request, res: Response) {
    const checks: Record<string, { status: string; detail?: unknown }> = {};

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { status: "up" };
    } catch {
      checks.database = { status: "down" };
    }

    try {
      const conn = createRedisConnection() as unknown as { ping?: () => Promise<string>; quit?: () => Promise<unknown>; disconnect?: () => void };
      if (conn.ping) {
        await conn.ping();
        checks.redis = { status: "up" };
        await conn.quit?.().catch(() => conn.disconnect?.());
      } else {
        checks.redis = { status: "unknown" };
      }
    } catch {
      checks.redis = { status: "down" };
    }

    try {
      const stats = await getAllQueueStats([notificationQueue, emailQueue, billingQueue]);
      checks.queues = { status: "up", detail: stats };
    } catch {
      checks.queues = { status: "down" };
    }

    checks.socket = { status: getSocketServer() ? "up" : "down" };

    const healthy = Object.values(checks).every((c) => c.status === "up" || c.status === "unknown");
    return res.status(healthy ? 200 : 503).json({
      success: healthy,
      status: healthy ? "healthy" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    });
  }

  static async readiness(req: Request, res: Response) {
    try {
      await prisma.$queryRaw`SELECT 1`;

      return res.json({
        success: true,
        status: "ready",
        database: "connected",
        timestamp: new Date().toISOString(),
      });
    } catch {
      return res.status(503).json({
        success: false,
        status: "not_ready",
        database: "disconnected",
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async metrics(req: Request, res: Response) {
    res.set("Content-Type", metricsRegistry.contentType);
    return res.end(await metricsRegistry.metrics());
  }
}