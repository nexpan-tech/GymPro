import { Request, Response } from "express";
import { AuditService } from "./audit.service";

export class AuditController {
  static async getLogs(req: Request, res: Response) {
    const user = (req as any).user;

    const logs = await AuditService.list(user?.gymId);

    return res.json({
      success: true,
      data: logs,
    });
  }
}