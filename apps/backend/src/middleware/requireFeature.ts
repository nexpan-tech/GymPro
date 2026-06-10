import { Request, Response, NextFunction } from "express";
import { featureEnabled } from "../modules/feature-flag/feature-flag.service";

/**
 * Stage 10 — optional route gate. Returns 403 when the caller's gym has the
 * feature disabled. Fail-open (unknown flag / no gym = allowed) so it never
 * breaks existing flows; only an explicit disable blocks the route.
 */
export function requireFeature(key: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const enabled = await featureEnabled(req.user?.gymId ?? null, key);
      if (!enabled) {
        return res.status(403).json({ success: false, message: `Feature "${key}" is not enabled for this gym.` });
      }
      return next();
    } catch {
      // Never block on a flag-lookup failure.
      return next();
    }
  };
}
