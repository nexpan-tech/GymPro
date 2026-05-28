import { Request, Response } from "express";
import { WhiteLabelService } from "./white-label.service";

function requireAuth(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }

  return req.user;
}

export class WhiteLabelController {
  static async upsertSettings(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await WhiteLabelService.upsertSettings(user, req.body);

    return res.json({
      success: true,
      message: "White label settings saved successfully",
      data,
    });
  }

  static async getSettings(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await WhiteLabelService.getSettings(user);

    return res.json({
      success: true,
      data,
    });
  }

  static async publicSettingsByDomain(req: Request, res: Response) {
    const data = await WhiteLabelService.publicSettingsByDomain(
      req.params.domain as string
    );

    return res.json({
      success: true,
      data,
    });
  }

  static async verifyDomain(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await WhiteLabelService.verifyDomain(user);

    return res.json({
      success: true,
      message: "Custom domain verified successfully",
      data,
    });
  }
}