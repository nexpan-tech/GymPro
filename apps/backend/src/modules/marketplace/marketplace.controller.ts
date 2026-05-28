import { Request, Response } from "express";
import { MarketplaceService } from "./marketplace.service";

function requireAuth(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }

  return req.user;
}

export class MarketplaceController {
  static async createItem(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await MarketplaceService.createItem(user, req.body);

    return res.status(201).json({
      success: true,
      message: "Marketplace item created successfully",
      data,
    });
  }

  static async getItems(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await MarketplaceService.getItems(user, req.query);

    return res.json({
      success: true,
      data,
    });
  }

  static async publishItem(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await MarketplaceService.publishItem(
      user,
      req.params.id as string
    );

    return res.json({
      success: true,
      message: "Marketplace item published successfully",
      data,
    });
  }

  static async unpublishItem(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await MarketplaceService.unpublishItem(
      user,
      req.params.id as string
    );

    return res.json({
      success: true,
      message: "Marketplace item unpublished successfully",
      data,
    });
  }

  static async publicMarketplace(req: Request, res: Response) {
    const data = await MarketplaceService.publicMarketplace(req.query);

    return res.json({
      success: true,
      data,
    });
  }
}