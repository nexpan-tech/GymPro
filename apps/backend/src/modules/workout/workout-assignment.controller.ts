import { Request, Response } from "express";
import { WorkoutAssignmentService } from "./workout-assignment.service";

function requireAuth(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }
  return req.user;
}

const dateParam = (req: Request) =>
  typeof req.query.date === "string" ? req.query.date : undefined;

export class WorkoutAssignmentController {
  /** TRAINER / ADMIN — assign a plan to members across one or more days. */
  static async assign(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await WorkoutAssignmentService.assign(user, req.body);
    return res.status(201).json({ success: true, message: "Workout assigned", data });
  }

  /** MEMBER — today's workout (source of truth; never the wrong day). */
  static async today(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await WorkoutAssignmentService.getToday(user, dateParam(req));
    return res.json({ success: true, data });
  }

  /** MEMBER — the Mon–Sun week schedule (?date=, ?weekOffset=-1|0|1). */
  static async week(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const offset = Number.parseInt((req.query.weekOffset as string) ?? "0", 10) || 0;
    const data = await WorkoutAssignmentService.getWeek(user, dateParam(req), offset);
    return res.json({ success: true, data });
  }

  /** MEMBER — upcoming (future, scheduled) workouts. */
  static async upcoming(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await WorkoutAssignmentService.getUpcoming(user, dateParam(req));
    return res.json({ success: true, data });
  }

  /** MEMBER — completed / past workouts. */
  static async history(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await WorkoutAssignmentService.getHistory(user, dateParam(req));
    return res.json({ success: true, data });
  }

  /** MEMBER — mark an assignment complete. */
  static async complete(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await WorkoutAssignmentService.complete(user, req.params.id as string);
    return res.json({ success: true, message: "Workout completed", data });
  }
}
