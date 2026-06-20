import { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../utils/response";
import { LicenseService, type BillingActor } from "./license.service";
import { createPlanSchema, updatePlanSchema, assignPlanSchema } from "./license.validation";

function ok(res: Response, data: unknown, message?: string) {
  return res.json({ success: true, ...(message ? { message } : {}), data });
}

function actorFrom(req: Request): BillingActor {
  return {
    userId: req.user?.id ?? null,
    role: req.user?.role ?? null,
    ip: req.ip ?? null,
    userAgent: req.headers["user-agent"] ?? null,
    source: "manual",
  };
}

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const r = schema.safeParse(body);
  if (!r.success) {
    const first = r.error.issues[0];
    throw new AppError(`${first.path.join(".") || "body"}: ${first.message}`, 422);
  }
  return r.data;
}

export class LicenseController {
  // ── Plans (license catalogue) ────────────────────────────────────────────
  static async listPlans(req: Request, res: Response) {
    const includeInactive = req.query.includeInactive === "true";
    return ok(res, await LicenseService.listPlans(includeInactive));
  }
  static async createPlan(req: Request, res: Response) {
    const data = parse(createPlanSchema, req.body);
    return ok(res, await LicenseService.createPlan(data, actorFrom(req)), "License plan created");
  }
  static async comparison(_req: Request, res: Response) {
    return ok(res, await LicenseService.getPlanComparison());
  }
  static async updatePlan(req: Request, res: Response) {
    const data = parse(updatePlanSchema, req.body);
    return ok(res, await LicenseService.updatePlan(req.params.id as string, data, actorFrom(req)), "License plan updated");
  }

  // ── Super-admin license grid + detail ────────────────────────────────────
  static async listLicenses(_req: Request, res: Response) {
    return ok(res, await LicenseService.listLicenses());
  }
  static async getGymLicense(req: Request, res: Response) {
    return ok(res, await LicenseService.getGymLicense(req.params.gymId as string));
  }
  static async getHistory(req: Request, res: Response) {
    return ok(res, await LicenseService.getLicenseHistory(req.params.gymId as string));
  }
  static async getAudit(req: Request, res: Response) {
    return ok(res, await LicenseService.getAudit(req.params.gymId as string));
  }

  // ── License lifecycle ────────────────────────────────────────────────────
  static async assignPlan(req: Request, res: Response) {
    const data = parse(assignPlanSchema, req.body);
    const result = await LicenseService.assignPlan(req.params.gymId as string, data, actorFrom(req));
    return ok(res, result, "License updated");
  }
  static async suspend(req: Request, res: Response) {
    return ok(res, await LicenseService.setStatus(req.params.gymId as string, "SUSPENDED", actorFrom(req)), "License suspended");
  }
  static async resume(req: Request, res: Response) {
    return ok(res, await LicenseService.setStatus(req.params.gymId as string, "ACTIVE", actorFrom(req)), "License reactivated");
  }
  static async generate(req: Request, res: Response) {
    const month = (req.body?.month ?? req.query?.month) as string | undefined;
    const result = await LicenseService.generateInvoices(month, actorFrom(req));
    return ok(res, result, `Generated ${result.created} license invoice(s) for ${result.billingMonth}`);
  }

  // ── Gym-admin self view (read-only) ──────────────────────────────────────
  static async myLicense(req: Request, res: Response) {
    if (!req.user?.gymId) throw new AppError("Gym context missing", 403);
    return ok(res, await LicenseService.getGymLicense(req.user.gymId));
  }
}
