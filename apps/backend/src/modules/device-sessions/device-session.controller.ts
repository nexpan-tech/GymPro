import { Request, Response } from "express";
import { DeviceSessionService } from "./device-session.service";

export class DeviceSessionController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const gymId = req.user!.gymId;
      const { deviceId, platform, appVersion, deviceName, pushToken } = req.body;

      if (!deviceId || !platform) {
        res.status(400).json({
          success: false,
          message: "deviceId and platform are required",
        });
        return;
      }

      const session = await DeviceSessionService.registerSession(
        userId,
        gymId,
        { deviceId, platform, appVersion, deviceName, pushToken }
      );

      res.status(200).json({ success: true, data: session });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to register device session" });
    }
  }

  static async updatePushToken(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const deviceId = req.params.deviceId as string;
      const { pushToken } = req.body;

      if (!pushToken) {
        res.status(400).json({ success: false, message: "pushToken is required" });
        return;
      }

      const session = await DeviceSessionService.updatePushToken(userId, deviceId, pushToken);
      res.status(200).json({ success: true, data: session });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update push token" });
    }
  }

  static async markSeen(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const deviceId = req.params.deviceId as string;

      const session = await DeviceSessionService.markSeen(userId, deviceId);
      res.status(200).json({ success: true, data: session });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to update last seen" });
    }
  }

  static async remove(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const deviceId = req.params.deviceId as string;

      const session = await DeviceSessionService.removeSession(userId, deviceId);
      res.status(200).json({ success: true, data: session });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to remove device session" });
    }
  }

  static async getMySessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const sessions = await DeviceSessionService.getUserSessions(userId);
      res.status(200).json({ success: true, data: sessions });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch device sessions" });
    }
  }
}
