import { Request, Response } from "express";
import { MembershipService } from "./membership.service";
import {
  createMembershipSchema,
  updateMembershipSchema,
} from "./membership.validation";

export class MembershipController {
  static async create(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const data = createMembershipSchema.parse(req.body);

    const membership = await MembershipService.create(
      req.user.gymId,
      data
    );

    res.json({
      success: true,
      message: "Membership created successfully",
      data: membership,
    });
  }

  static async getAll(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const memberships = await MembershipService.getAll(
      req.user.gymId
    );

    res.json({
      success: true,
      data: memberships,
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

    const memberships =
      await MembershipService.getByMember(
        req.user.gymId,
        memberId
      );

    res.json({
      success: true,
      data: memberships,
    });
  }

  static async update(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const data = updateMembershipSchema.parse(req.body);

    const updated = await MembershipService.update(
      req.user.gymId,
      req.params.id as string,
      data
    );

    res.json({
      success: true,
      message: "Membership updated successfully",
      data: updated,
    });
  }

  static async delete(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    await MembershipService.delete(
      req.user.gymId,
      req.params.id as string
    );

    res.json({
      success: true,
      message: "Membership deleted successfully",
    });
  }
}