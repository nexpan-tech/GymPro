import { Request, Response } from "express";
import { TransformationService } from "./transformation.service";

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

export class TransformationController {
  static async addPhoto(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await TransformationService.addPhoto(user, req.body);

    return res.status(201).json({
      success: true,
      message: "Progress photo added successfully",
      data,
    });
  }

  static async getMemberPhotos(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await TransformationService.getMemberPhotos(
      user,
      req.params.memberId as string
    );

    return res.json({
      success: true,
      data,
    });
  }

  static async getMyPhotos(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await TransformationService.getMyPhotos(user);

    return res.json({
      success: true,
      data,
    });
  }

  static async getBeforeAfter(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await TransformationService.getBeforeAfter(
      user,
      req.params.memberId as string
    );

    return res.json({
      success: true,
      data,
    });
  }

  static async getTimeline(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await TransformationService.getTimeline(
      user,
      req.params.memberId as string
    );

    return res.json({
      success: true,
      data,
    });
  }

  static async deletePhoto(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    await TransformationService.deletePhoto(user, req.params.id as string);

    return res.json({
      success: true,
      message: "Progress photo deleted successfully",
    });
  }
}