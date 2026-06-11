import { Request, Response } from "express";
import { ReportsService } from "./reports.service";

function requireAuth(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }

  return req.user;
}

function getFormat(req: Request): "json" | "csv" | "pdf" {
  if (req.query.format === "csv") return "csv";
  if (req.query.format === "pdf") return "pdf";
  return "json";
}

function sendReport(res: Response, result: any) {
  if (result.format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`
    );
    return res.send(result.content);
  }

  if (result.format === "pdf") {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.filename}"`
    );
    return res.send(result.content);
    }

  return res.json({
    success: true,
    data: result,
  });
}

export class ReportsController {
  static async revenue(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const result = await ReportsService.revenueReport(user, getFormat(req));
    return sendReport(res, result);
  }

  static async attendance(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const result = await ReportsService.attendanceReport(user, getFormat(req));
    return sendReport(res, result);
  }

  static async members(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const result = await ReportsService.memberReport(user, getFormat(req));
    return sendReport(res, result);
  }

  static async churn(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const result = await ReportsService.churnReport(user, getFormat(req));
    return sendReport(res, result);
  }

  static async monthly(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;

    const month = typeof req.query.month === "string" ? req.query.month : undefined;
    const format = req.query.format === "pdf" ? "pdf" : "json";
    const result = await ReportsService.monthlyReport(user, month, format);

    if (result.format === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
      return res.send(result.content);
    }
    return res.json({ success: true, data: result.data });
  }
}

export default ReportsController;