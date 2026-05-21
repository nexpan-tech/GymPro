import { Request, Response } from "express";
import { AuditAction } from "@prisma/client";
import * as paymentService from "./payment.service";
import { createAuditLog } from "../../utils/audit";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";

function getRequestMeta(req: Request) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] || null,
  };
}

export const createPayment = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res
        .status(400)
        .json({ success: false, message: "Gym ID required" });
    }

    const gymId = req.user.gymId;

    const data = await paymentService.createPayment(gymId, req.body);

    await createAuditLog({
      gymId,
      userId: req.user.id,
      action: AuditAction.PAYMENT,
      entity: "Payment",
      entityId: data.id,
      newData: data,
      ...getRequestMeta(req),
    });

    return successResponse(
      res,
      "Payment recorded successfully",
      data,
      201
    );
  }
);

export const getPayments = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res
        .status(400)
        .json({ success: false, message: "Gym ID required" });
    }

    const data = await paymentService.getPayments(req.user.gymId);

    return successResponse(
      res,
      "Payments fetched successfully",
      data,
      200
    );
  }
);

export const getPaymentById = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    if (!req.user.gymId) {
      return res
        .status(400)
        .json({ success: false, message: "Gym ID required" });
    }

    const data = await paymentService.getPaymentById(
      req.user.gymId,
      req.params.id as string
    );

    return successResponse(
      res,
      "Payment details fetched",
      data,
      200
    );
  }
);