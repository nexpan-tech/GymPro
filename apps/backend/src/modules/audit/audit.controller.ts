import { Request, Response } from "express";
import { AuditService } from "./audit.service";

export class AuditController {
  static async getLogs(req: Request, res: Response) {
    const user = (req as any).user;
    const { action, event, userId, search, from, to, limit } = req.query as Record<string, string | undefined>;

    const logs = await AuditService.list({
      gymId: user?.gymId, // null for SUPER_ADMIN = whole platform
      action,
      event,
      userId,
      search,
      from,
      to,
      limit: limit ? Number(limit) : undefined,
    });

    return res.json({
      success: true,
      data: logs,
    });
  }
}