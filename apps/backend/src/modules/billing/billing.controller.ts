import { Request, Response } from "express";
import { BillingService } from "./billing.service";
import { SaaSBillingService } from "../super-admin/saas-billing.service";

function requireAuth(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }

  return req.user;
}

export class BillingController {
  /** A gym admin's own per-active-member SaaS invoices. */
  static async mySaaSInvoices(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const data = await SaaSBillingService.listInvoices({ gymId: user.gymId ?? undefined });
    return res.json({ success: true, data });
  }

  /** Download a gym admin's own SaaS invoice PDF (scoped to their gym). */
  static async mySaaSInvoicePdf(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    const { buffer, filename } = await SaaSBillingService.getInvoicePdf(req.params.id as string, user.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(buffer);
  }

  static async createPlan(req: Request, res: Response) {
    const data = await BillingService.createPlan(req.body);

    return res.status(201).json({
      success: true,
      message: "SaaS plan created successfully",
      data,
    });
  }

  static async getPlans(req: Request, res: Response) {
    const data = await BillingService.getPlans();

    return res.json({
      success: true,
      data,
    });
  }

  static async subscribeGym(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await BillingService.subscribeGym(user, req.body);

    return res.status(201).json({
      success: true,
      message: "Gym subscribed successfully",
      data,
    });
  }

  static async getMySubscription(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await BillingService.getMySubscription(user);

    return res.json({
      success: true,
      data,
    });
  }

  static async getInvoices(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await BillingService.getInvoices(user);

    return res.json({
      success: true,
      data,
    });
  }

  static async markInvoicePaid(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await BillingService.markInvoicePaid(
      user,
      req.params.id as string
    );

    return res.json({
      success: true,
      message: "Invoice marked as paid",
      data,
    });
  }

  static async markInvoiceFailed(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await BillingService.markInvoiceFailed(
      user,
      req.params.id as string
    );

    return res.json({
      success: true,
      message: "Invoice marked as failed",
      data,
    });
  }

  static async failedPaymentRecovery(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const data = await BillingService.failedPaymentRecovery(user);

    return res.json({
      success: true,
      data,
    });
  }
}