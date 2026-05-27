import { Request, Response } from "express";
import { CacheService } from "../../cache/cache.service";
import { QueueService } from "../../queues/queue.service";
import { scalabilityConfig } from "../../config/scalability/scalability.config";

export class ScalabilityController {
  static async health(req: Request, res: Response) {
    return res.json({
      success: true,
      data: {
        status: "healthy",
        cache: "memory",
        queue: "memory",
        config: scalabilityConfig,
      },
    });
  }

  static async queueStatus(req: Request, res: Response) {
    return res.json({
      success: true,
      data: {
        jobs: QueueService.list(),
        totalJobs: QueueService.list().length,
      },
    });
  }

  static async clearCache(req: Request, res: Response) {
    CacheService.clear();

    return res.json({
      success: true,
      message: "Cache cleared successfully",
    });
  }
}