import { Request, Response } from "express";
import { prisma } from "../../config/db";
import { metricsRegistry } from "../../monitoring/metrics";

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