import { Request, Response } from "express";
import { BillingAnalyticsService } from "./billing.analytics.service";

const ok = (res: Response, data: unknown) => res.json({ success: true, data });

// SUPER_ADMIN platform SaaS analytics.
export class BillingAdminController {
  static async overview(_req: Request, res: Response) {
    return ok(res, await BillingAnalyticsService.overview());
  }
  static async mrr(_req: Request, res: Response) {
    return ok(res, { mrr: await BillingAnalyticsService.mrr() });
  }
  static async arr(_req: Request, res: Response) {
    return ok(res, { arr: await BillingAnalyticsService.arr() });
  }
  static async churn(_req: Request, res: Response) {
    return ok(res, await BillingAnalyticsService.churn());
  }
  static async revenueTrend(req: Request, res: Response) {
    const months = req.query.months ? Number(req.query.months) : 6;
    return ok(res, await BillingAnalyticsService.revenueTrend(months));
  }
}
