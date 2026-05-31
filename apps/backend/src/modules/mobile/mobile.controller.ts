import { Request, Response } from "express";
import { MobileService, SyncAction } from "./mobile.service";

export class MobileController {
  static async sync(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { actions } = req.body as { actions: SyncAction[] };

    if (!Array.isArray(actions)) {
      return res.status(400).json({
        success: false,
        message: "actions must be an array",
      });
    }

    const results = await MobileService.processSyncActions(
      req.user.id,
      req.user.gymId ?? undefined,
      actions
    );

    return res.status(200).json({
      results,
      processedAt: new Date().toISOString(),
    });
  }

  static getConfig(_req: Request, res: Response) {
    const config = MobileService.getMobileAppConfig();
    return res.status(200).json(config);
  }

  static health(_req: Request, res: Response) {
    return res.status(200).json({
      status: "ok",
      service: "gympro-mobile-api",
    });
  }
}
