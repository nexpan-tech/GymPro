import { Request, Response } from "express";
import { BillingService } from "./billing.service";

function requireAuth(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }

  return req.user;
}

export class BillingController {
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