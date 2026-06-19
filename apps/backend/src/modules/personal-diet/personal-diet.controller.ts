import { Request, Response } from "express";
import { PersonalDietService } from "./personal-diet.service";
import { createPersonalDietSchema, updatePersonalDietSchema, setWaterSchema } from "./personal-diet.validation";

function requireAuth(req: Request, res: Response) {
  if (!req.user) { res.status(401).json({ success: false, message: "Unauthorized" }); return null; }
  return req.user;
}
const ok = (res: Response, data: unknown, status = 200) => res.status(status).json({ success: true, data });

export class PersonalDietController {
  static async list(req: Request, res: Response) {
    const user = requireAuth(req, res); if (!user) return;
    const q = req.query;
    return ok(res, await PersonalDietService.list(user, {
      category: typeof q.category === "string" ? q.category : undefined,
      search: typeof q.search === "string" ? q.search : undefined,
      archived: q.archived === "true" ? true : q.archived === "false" ? false : undefined,
      favorite: q.favorite === "true",
      template: q.template === "true" ? true : q.template === "false" ? false : undefined,
    }));
  }
  static async stats(req: Request, res: Response) { const u = requireAuth(req, res); if (!u) return; return ok(res, await PersonalDietService.stats(u)); }
  static async week(req: Request, res: Response) { const u = requireAuth(req, res); if (!u) return; return ok(res, await PersonalDietService.week(u)); }
  static async getWater(req: Request, res: Response) { const u = requireAuth(req, res); if (!u) return; return ok(res, await PersonalDietService.getWater(u, typeof req.query.date === "string" ? req.query.date : undefined)); }
  static async setWater(req: Request, res: Response) { const u = requireAuth(req, res); if (!u) return; const { glasses, date } = setWaterSchema.parse(req.body); return ok(res, await PersonalDietService.setWater(u, glasses, date)); }
  static async get(req: Request, res: Response) { const u = requireAuth(req, res); if (!u) return; return ok(res, await PersonalDietService.get(u, req.params.id as string)); }
  static async create(req: Request, res: Response) { const u = requireAuth(req, res); if (!u) return; return ok(res, await PersonalDietService.create(u, createPersonalDietSchema.parse(req.body)), 201); }
  static async update(req: Request, res: Response) { const u = requireAuth(req, res); if (!u) return; return ok(res, await PersonalDietService.update(u, req.params.id as string, updatePersonalDietSchema.parse(req.body))); }
  static async remove(req: Request, res: Response) { const u = requireAuth(req, res); if (!u) return; return ok(res, await PersonalDietService.remove(u, req.params.id as string)); }
  static async duplicate(req: Request, res: Response) { const u = requireAuth(req, res); if (!u) return; return ok(res, await PersonalDietService.duplicate(u, req.params.id as string), 201); }
  static async archive(req: Request, res: Response) { const u = requireAuth(req, res); if (!u) return; return ok(res, await PersonalDietService.setArchived(u, req.params.id as string, req.body?.isArchived !== false)); }
  static async favorite(req: Request, res: Response) { const u = requireAuth(req, res); if (!u) return; return ok(res, await PersonalDietService.toggleFavorite(u, req.params.id as string)); }
}
