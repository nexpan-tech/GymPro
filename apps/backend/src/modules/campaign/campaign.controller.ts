import { Request, Response } from "express";
import { CampaignService } from "./campaign.service";

function requireAuth(req: Request, res: Response) {
  const user = req.user;

  if (!user) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });

    return null;
  }

  return user;
}

export class CampaignController {
  static async create(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const campaign = await CampaignService.create(
      user,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      data: campaign,
    });
  }

  static async getAll(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const campaigns = await CampaignService.getAll(user);

    return res.json({
      success: true,
      data: campaigns,
    });
  }

  static async send(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const result = await CampaignService.send(
      user,
      req.params.id as string
    );

    return res.json({
      success: true,
      message: "Campaign sent successfully",
      data: result,
    });
  }
}