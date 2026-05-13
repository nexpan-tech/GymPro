import { Request, Response } from "express";
import { MemberService } from "./member.service";
import {
  createMemberSchema,
  updateMemberSchema,
} from "./member.validation";

export class MemberController {
  static async create(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const data = createMemberSchema.parse(req.body);

    const member = await MemberService.create(
      req.user.gymId,
      data
    );

    res.json({
      success: true,
      message: "Member created successfully",
      data: member,
    });
  }

  static async getAll(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const members = await MemberService.getAll(req.user.gymId);

    res.json({
      success: true,
      data: members,
    });
  }

  static async getById(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const member = await MemberService.getById(
      req.user.gymId,
      req.params.id as string
    );

    res.json({
      success: true,
      data: member,
    });
  }

  static async update(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    const data = updateMemberSchema.parse(req.body);

    const member = await MemberService.update(
      req.user.gymId,
      req.params.id as string,
      data
    );

    res.json({
      success: true,
      message: "Member updated successfully",
      data: member,
    });
  }

  static async delete(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res.status(400).json({ success: false, message: "Gym ID required" });
    }

    await MemberService.delete(
      req.user.gymId,
      req.params.id as string
    );

    res.json({
      success: true,
      message: "Member deleted successfully",
    });
  }
}