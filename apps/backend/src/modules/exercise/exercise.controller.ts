import { Request, Response } from "express";
import { ExerciseService } from "./exercise.service";

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

export class ExerciseController {
  static async create(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await ExerciseService.create(user, req.body);

    return res.status(201).json({
      success: true,
      message: "Exercise created successfully",
      data,
    });
  }

  static async getAll(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await ExerciseService.getAll(user, {
      category: req.query.category as string,
      muscleGroup: req.query.muscleGroup as string,
      difficulty: req.query.difficulty as string,
      search: req.query.search as string,
    });

    return res.json({
      success: true,
      data,
    });
  }

  static async getById(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await ExerciseService.getById(user, req.params.id as string);

    return res.json({
      success: true,
      data,
    });
  }

  static async update(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await ExerciseService.update(
      user,
      req.params.id as string,
      req.body
    );

    return res.json({
      success: true,
      message: "Exercise updated successfully",
      data,
    });
  }

  static async delete(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    await ExerciseService.delete(user, req.params.id as string);

    return res.json({
      success: true,
      message: "Exercise deleted successfully",
    });
  }
}