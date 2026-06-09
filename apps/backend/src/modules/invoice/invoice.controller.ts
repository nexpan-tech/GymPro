import { Request, Response } from "express";
import { InvoiceService } from "./invoice.service";

function requireAuth(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }
  return req.user;
}

const ok = (res: Response, data: unknown) => res.json({ success: true, data });

export class InvoiceController {
  static async listForGym(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    return ok(res, await InvoiceService.listForGym(user));
  }

  static async listMine(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    return ok(res, await InvoiceService.listMine(user));
  }

  static async getById(req: Request, res: Response) {
    const user = requireAuth(req, res);
    if (!user) return;
    return ok(res, await InvoiceService.getById(user, req.params.id as string));
  }
}
