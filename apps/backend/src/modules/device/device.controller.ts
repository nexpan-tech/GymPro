import { Request, Response } from "express";
import { DeviceService } from "./device.service";

export class DeviceController {
  static async register(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data = await DeviceService.registerToken(req.user.id, req.body);

    return res.status(201).json({
      success: true,
      message: "Device token registered successfully",
      data,
    });
  }

  static async getMine(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data = await DeviceService.getMyTokens(req.user.id);

    return res.json({
      success: true,
      data,
    });
  }

  static async delete(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await DeviceService.deleteToken(req.user.id, req.body.token);

    return res.json({
      success: true,
      message: "Device token deleted successfully",
    });
  }
}