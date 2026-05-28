import { Request, Response } from "express";
import { ApiPlatformService } from "./api-platform.service";

function requireAuth(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }

  return req.user;
}

export class ApiPlatformController {
  static async createApiKey(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await ApiPlatformService.createApiKey(user, req.body);

    return res.status(201).json({
      success: true,
      message: "API key created successfully. Copy rawKey now; it will not be shown again.",
      data,
    });
  }

  static async getApiKeys(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await ApiPlatformService.getApiKeys(user);

    return res.json({
      success: true,
      data,
    });
  }

  static async revokeApiKey(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await ApiPlatformService.revokeApiKey(
      user,
      req.params.id as string
    );

    return res.json({
      success: true,
      message: "API key revoked successfully",
      data,
    });
  }

  static async createWebhook(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await ApiPlatformService.createWebhook(user, req.body);

    return res.status(201).json({
      success: true,
      message: "Webhook endpoint created successfully",
      data,
    });
  }

  static async getWebhooks(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await ApiPlatformService.getWebhooks(user);

    return res.json({
      success: true,
      data,
    });
  }

  static async createIntegration(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await ApiPlatformService.createIntegration(user, req.body);

    return res.status(201).json({
      success: true,
      message: "Integration created successfully",
      data,
    });
  }

  static async getIntegrations(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await ApiPlatformService.getIntegrations(user);

    return res.json({
      success: true,
      data,
    });
  }

  static async publicGymProfile(req: Request, res: Response) {
    const apiKey = req.headers["x-api-key"] as string;

    const data = await ApiPlatformService.publicGymProfile(apiKey);

    return res.json({
      success: true,
      data,
    });
  }
}