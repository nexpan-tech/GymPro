import { Request, Response } from "express";
import { PersonalWorkoutService } from "./personal-workout.service";
import { createPersonalWorkoutSchema, updatePersonalWorkoutSchema, completePersonalWorkoutSchema } from "./personal-workout.validation";

function requireAuth(req: Request, res: Response) {
  if (!req.user) { res.status(401).json({ success: false, message: "Unauthorized" }); return null; }
  return req.user;
}
const ok = (res: Response, data: unknown, status = 200) => res.status(status).json({ success: true, data });

export class PersonalWorkoutController {
  static async list(req: Request, res: Response) {
    const user = requireAuth(req, res); if (!user) return;
    const q = req.query;
    return ok(res, await PersonalWorkoutService.list(user, {
      category: typeof q.category === "string" ? q.category : undefined,
      search: typeof q.search === "string" ? q.search : undefined,
      archived: q.archived === "true" ? true : q.archived === "false" ? false : undefined,
      favorite: q.favorite === "true",
      template: q.template === "true" ? true : q.template === "false" ? false : undefined,
    }));
  }
  static async stats(req: Request, res: Response) { const u = requireAuth(req, res); if (!u) return; return ok(res, await PersonalWorkoutService.stats(u)); }
  static async history(req: Request, res: Response) { const u = requireAuth(req, res); if (!u) return; return ok(res, await PersonalWorkoutService.history(u)); }
  static async week(req: Request, res: Response) { const u = requireAuth(req, res); if (!u) return; return ok(res, await PersonalWorkoutService.week(u)); }
  static async get(req: Request, res: Response) { const u = requireAuth(req, res); if (!u) return; return ok(res, await PersonalWorkoutService.get(u, req.params.id as string)); }
  static async create(req: Request, res: Response) { const u = requireAuth(req, res); if (!u) return; return ok(res, await PersonalWorkoutService.create(u, createPersonalWorkoutSchema.parse(req.body)), 201); }
  static async update(req: Request, res: Response) { const u = requireAuth(req, res); if (!u) return; return ok(res, await PersonalWorkoutService.update(u, req.params.id as string, updatePersonalWorkoutSchema.parse(req.body))); }
  static async remove(req: Request, res: Response) { const u = requireAuth(req, res); if (!u) return; return ok(res, await PersonalWorkoutService.remove(u, req.params.id as string)); }
  static async duplicate(req: Request, res: Response) { const u = requireAuth(req, res); if (!u) return; return ok(res, await PersonalWorkoutService.duplicate(u, req.params.id as string), 201); }
  static async archive(req: Request, res: Response) { const u = requireAuth(req, res); if (!u) return; return ok(res, await PersonalWorkoutService.setArchived(u, req.params.id as string, req.body?.isArchived !== false)); }
  static async favorite(req: Request, res: Response) { const u = requireAuth(req, res); if (!u) return; return ok(res, await PersonalWorkoutService.toggleFavorite(u, req.params.id as string)); }
  static async complete(req: Request, res: Response) { const u = requireAuth(req, res); if (!u) return; return ok(res, await PersonalWorkoutService.complete(u, req.params.id as string, completePersonalWorkoutSchema.parse(req.body ?? {})), 201); }
}
