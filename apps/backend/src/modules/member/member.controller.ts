import { Request, Response } from "express";
import { MemberService } from "./member.service";
import {
  createMemberSchema,
  updateMemberSchema,
} from "./member.validation";

function requireAuth(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }

  return req.user;
}

function requireGym(req: Request, res: Response) {
  const user = requireAuth(req, res);

  if (!user) return null;

  if (!user.gymId) {
    res.status(400).json({ success: false, message: "Gym ID required" });
    return null;
  }

  return user.gymId;
}

export class MemberController {
  static async create(req: Request, res: Response) {
    const gymId = requireGym(req, res);
    if (!gymId) return;

    const data = createMemberSchema.parse(req.body);
    const member = await MemberService.create(gymId, data);

    return res.status(201).json({
      success: true,
      message: "Member created successfully",
      data: member,
    });
  }

  static async getAll(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const members = await MemberService.getAll(user);

    return res.json({
      success: true,
      data: members,
    });
  }

  static async getById(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const member = await MemberService.getById(
      user,
      req.params.id as string
    );

    return res.json({
      success: true,
      data: member,
    });
  }

  static async update(req: Request, res: Response) {
    const gymId = requireGym(req, res);
    if (!gymId) return;

    const data = updateMemberSchema.parse(req.body);

    const member = await MemberService.update(
      gymId,
      req.params.id as string,
      data
    );

    return res.json({
      success: true,
      message: "Member updated successfully",
      data: member,
    });
  }

  static async delete(req: Request, res: Response) {
    const gymId = requireGym(req, res);
    if (!gymId) return;

    await MemberService.delete(gymId, req.params.id as string);

    return res.json({
      success: true,
      message: "Member deleted successfully",
    });
  }
}