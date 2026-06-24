import { Request, Response } from "express";
import { AuditAction } from "@prisma/client";
import { PlatformService } from "./platform.service";
import { SaaSBillingService, type BillingActor } from "./saas-billing.service";
import { PlatformSettingsService } from "./platform-settings.service";
import { createAuditLog } from "../../utils/audit";

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

export class SuperAdminController {
  // ── Dashboard + gyms ─────────────────────────────────────────────────────
  static async dashboard(_req: Request, res: Response) {
    return ok(res, await PlatformService.dashboard());
  }
  static async gyms(_req: Request, res: Response) {
    return ok(res, await PlatformService.gyms());
  }

  // ── SaaS billing ─────────────────────────────────────────────────────────
  static async subscriptions(_req: Request, res: Response) {
    return ok(res, await SaaSBillingService.subscriptions());
  }
  static async revenueSummary(_req: Request, res: Response) {
    return ok(res, await SaaSBillingService.revenueSummary());
  }
  static async generateInvoices(req: Request, res: Response) {
    const month = (req.body?.month ?? req.query?.month) as string | undefined;
    const actor = actorFrom(req);
    // Audit the trigger itself (manual billing run).
    await createAuditLog({
      userId: actor.userId, action: AuditAction.CREATE, entity: "SaaSBilling", entityId: month ?? "current",
      newData: { event: "MANUAL_BILLING_TRIGGERED", month: month ?? null }, ipAddress: actor.ip, userAgent: actor.userAgent,
    });
    const result = await SaaSBillingService.generateInvoices(month, actor);
    return ok(res, result, `Generated ${result.created} invoice(s) for ${result.billingMonth}`);
  }
  static async listInvoices(req: Request, res: Response) {
    const { month, status, gymId } = req.query as Record<string, string | undefined>;
    return ok(res, await SaaSBillingService.listInvoices({ month, status, gymId }));
  }
  static async getInvoice(req: Request, res: Response) {
    return ok(res, await SaaSBillingService.getInvoice(req.params.id as string));
  }
  static async invoicePdf(req: Request, res: Response) {
    const { buffer, filename } = await SaaSBillingService.getInvoicePdf(req.params.id as string);
    await createAuditLog({
      userId: req.user?.id ?? null, action: AuditAction.UPDATE, entity: "SaaSInvoice", entityId: req.params.id as string,
      newData: { event: "INVOICE_DOWNLOADED" }, ipAddress: req.ip ?? null, userAgent: req.headers["user-agent"] ?? null,
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(buffer);
  }
  static async recordPayment(req: Request, res: Response) {
    const inv = await SaaSBillingService.recordPayment(req.params.id as string, actorFrom(req));
    return ok(res, inv, "Payment recorded");
  }
  static async cancelInvoice(req: Request, res: Response) {
    const inv = await SaaSBillingService.cancelInvoice(req.params.id as string, actorFrom(req));
    return ok(res, inv, "Invoice cancelled");
  }

  // ── Platform billing settings ──────────────────────────────────────────────
  static async getSettings(_req: Request, res: Response) {
    return ok(res, await PlatformSettingsService.get());
  }
  static async updateSettings(req: Request, res: Response) {
    const updated = await PlatformSettingsService.update(req.body ?? {});
    await createAuditLog({
      userId: req.user?.id ?? null, action: AuditAction.UPDATE, entity: "PlatformBillingSettings", entityId: updated.id,
      newData: { event: "BILLING_SETTINGS_UPDATED", fields: Object.keys(req.body ?? {}) },
      ipAddress: req.ip ?? null, userAgent: req.headers["user-agent"] ?? null,
    });
    return ok(res, updated, "Billing settings updated");
  }

  // ── Gym Admin password reset (role hierarchy) ────────────────────────────
  static async resetGymAdminPassword(req: Request, res: Response) {
    const gymId = req.params.gymId as string;
    const { password, userId } = req.body ?? {};
    const result = await PlatformService.resetGymAdminPassword(gymId, password, userId);
    await createAuditLog({
      userId: req.user?.id ?? null, action: AuditAction.UPDATE, entity: "User", entityId: result.userId,
      newData: { event: "GYM_ADMIN_PASSWORD_RESET", gymId, adminEmail: result.email },
      ipAddress: req.ip ?? null, userAgent: req.headers["user-agent"] ?? null,
    });
    return ok(res, { userId: result.userId, email: result.email }, `Password reset for ${result.email}`);
  }

  // ── Operations ───────────────────────────────────────────────────────────
  static async metrics(_req: Request, res: Response) {
    return ok(res, await PlatformService.metrics());
  }
  static async monitoring(_req: Request, res: Response) {
    return ok(res, await PlatformService.monitoring());
  }
  static async queue(_req: Request, res: Response) {
    return ok(res, await PlatformService.queue());
  }
}
