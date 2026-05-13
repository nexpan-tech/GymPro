import { Request, Response } from "express";
import { NotificationService } from "./notification.service";

export class NotificationController {
  static async create(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const { memberId, type, title, message } = req.body;

    const notification = await NotificationService.create(
      req.user.gymId,
      { memberId, type, title, message }
    );

    res.json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  }

  static async getAll(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const notifications =
      await NotificationService.getAll(req.user.gymId);

    res.json({
      success: true,
      data: notifications,
    });
  }

  static async getByMember(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const memberId = req.params.memberId as string;

    const notifications =
      await NotificationService.getByMember(
        req.user.gymId,
        memberId
      );

    res.json({
      success: true,
      data: notifications,
    });
  }

  static async markSent(req: Request, res: Response) {
    const id = req.params.id as string;

    const updated =
      await NotificationService.markAsSent(id);

    res.json({
      success: true,
      message: "Marked as sent",
      data: updated,
    });
  }
}