import { Request, Response } from "express";
import { DueService } from "./due.service";

function getGymId(req: Request, res: Response): string | null {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }

  if (!req.user.gymId) {
    res.status(400).json({ success: false, message: "Gym ID required" });
    return null;
  }

  return req.user.gymId;
}

export class DueController {
  static async create(req: Request, res: Response) {
    const gymId = getGymId(req, res);
    if (!gymId) return;

    const due = await DueService.create(gymId, req.body);

    return res.status(201).json({
      success: true,
      message: "Due created successfully",
      data: due,
    });
  }

  static async getAll(req: Request, res: Response) {
    const gymId = getGymId(req, res);
    if (!gymId) return;

    const dues = await DueService.getAll(
      gymId,
      req.query.status as any
    );

    return res.json({
      success: true,
      data: dues,
    });
  }

  static async getSummary(req: Request, res: Response) {
    const gymId = getGymId(req, res);
    if (!gymId) return;

    const summary = await DueService.getSummary(gymId);

    return res.json({
      success: true,
      data: summary,
    });
  }

  static async markPaid(req: Request, res: Response) {
    const gymId = getGymId(req, res);
    if (!gymId) return;

    const due = await DueService.markPaid(
      gymId,
      req.params.id as string,
      Number(req.body.amount)
    );

    return res.json({
      success: true,
      message: "Due payment recorded successfully",
      data: due,
    });
  }

  static async markOverdue(req: Request, res: Response) {
    const gymId = getGymId(req, res);
    if (!gymId) return;

    const result = await DueService.markOverdue(gymId);

    return res.json({
      success: true,
      message: "Overdue dues updated successfully",
      data: result,
    });
  }

  static async waive(req: Request, res: Response) {
    const gymId = getGymId(req, res);
    if (!gymId) return;

    const due = await DueService.waive(
      gymId,
      req.params.id as string
    );

    return res.json({
      success: true,
      message: "Due waived successfully",
      data: due,
    });
  }

  static async getPending(req: Request, res: Response) {
  const gymId = getGymId(req, res);
  if (!gymId) return;

  const dues = await DueService.getPendingDues(gymId);

  return res.json({
    success: true,
    data: dues,
  });
}

static async getOverdue(req: Request, res: Response) {
  const gymId = getGymId(req, res);
  if (!gymId) return;

  const dues = await DueService.getOverdueDues(gymId);

  return res.json({
    success: true,
    data: dues,
  });
}

static async getDashboard(req: Request, res: Response) {
  const gymId = getGymId(req, res);
  if (!gymId) return;

  const dashboard = await DueService.getCollectionDashboard(gymId);

  return res.json({
    success: true,
    data: dashboard,
  });
}

  static async getOverdueAging(req: Request, res: Response) {
  const gymId = getGymId(req, res);
  if (!gymId) return;

  const report = await DueService.getOverdueAgingReport(gymId);

  return res.json({
    success: true,
    data: report,
  });
}
}