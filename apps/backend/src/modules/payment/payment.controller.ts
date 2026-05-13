import { Request, Response } from "express";
import * as paymentService from "./payment.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";

export const createPayment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!req.user.gymId) {
    return res.status(400).json({ success: false, message: "Gym ID required" });
  }

  const gymId = req.user.gymId;
  const data = await paymentService.createPayment(gymId, req.body);

  return successResponse(res, "Payment recorded successfully", data, 201);
});

export const getPayments = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!req.user.gymId) {
    return res.status(400).json({ success: false, message: "Gym ID required" });
  }

  const gymId = req.user.gymId;
  const data = await paymentService.getPayments(gymId);

  return successResponse(res, "Payments fetched successfully", data, 200);
});

export const getPaymentById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!req.user.gymId) {
    return res.status(400).json({ success: false, message: "Gym ID required" });
  }

  const gymId = req.user.gymId;
  const id = req.params.id as string;

  const data = await paymentService.getPaymentById(gymId, id);

  return successResponse(res, "Payment details fetched", data, 200);
});