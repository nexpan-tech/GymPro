import { Request, Response } from "express";
import { CommunicationService } from "./communication.service";

function requireAuth(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
    return null;
  }

  return req.user;
}

export class CommunicationController {
  static async sendMessage(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await CommunicationService.sendMessage(user, req.body);

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data,
    });
  }

  static async getMemberMessages(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await CommunicationService.getMemberMessages(
      user,
      req.params.memberId as string
    );

    return res.json({
      success: true,
      data,
    });
  }

  static async addProgressComment(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await CommunicationService.addProgressComment(user, req.body);

    return res.status(201).json({
      success: true,
      message: "Progress comment added successfully",
      data,
    });
  }

  static async submitFeedback(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await CommunicationService.submitFeedback(user, req.body);

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data,
    });
  }

  static async getTrainerFeedback(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await CommunicationService.getTrainerFeedback(
      user,
      req.params.trainerId as string
    );

    return res.json({
      success: true,
      data,
    });
  }

  // ── Stage 9 — chat threads + read receipts ─────────────────────────────────
  static async getMyThread(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await CommunicationService.getMyThread(user);
    return res.json({ success: true, data });
  }

  static async getThreads(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await CommunicationService.getThreads(user);
    return res.json({ success: true, data });
  }

  static async markThreadRead(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await CommunicationService.markThreadRead(user, req.params.memberId as string);
    return res.json({ success: true, message: "Thread marked read", data });
  }

  // ── Admin <-> Trainer staff DM ──
  static async sendStaffMessage(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await CommunicationService.sendStaffMessage(user, req.body);
    return res.status(201).json({ success: true, message: "Message sent", data });
  }

  static async getStaffThread(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const trainerId = (req.params.trainerId as string) === "me" ? user.id : (req.params.trainerId as string);
    const data = await CommunicationService.getStaffThread(user, trainerId);
    return res.json({ success: true, data });
  }
}