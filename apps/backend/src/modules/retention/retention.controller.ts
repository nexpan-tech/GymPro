import { Request, Response } from "express";
import { RetentionService } from "./retention.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import type { RiskLevel } from "@prisma/client";

const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
function parseLevel(v: unknown): RiskLevel | undefined {
  return RISK_LEVELS.includes(v as RiskLevel) ? (v as RiskLevel) : undefined;
}

export const overview = asyncHandler(async (req: Request, res: Response) => {
  const data = await RetentionService.getOverview(req.user!);
  return successResponse(res, "Retention overview", data);
});

export const memberRisk = asyncHandler(async (req: Request, res: Response) => {
  const data = await RetentionService.getMemberRisk(req.user!, {
    level: parseLevel(req.query.level),
  });
  return successResponse(res, "Member risk list", data);
});

export const trainerRisk = asyncHandler(async (req: Request, res: Response) => {
  const data = await RetentionService.getTrainerRisk(req.user!);
  return successResponse(res, "Assigned member risk", data);
});

export const platform = asyncHandler(async (_req: Request, res: Response) => {
  const data = await RetentionService.getPlatformOverview();
  return successResponse(res, "Platform retention overview", data);
});

export const churn = asyncHandler(async (req: Request, res: Response) => {
  const data = await RetentionService.getChurn(req.user!);
  return successResponse(res, "Churn analysis", data);
});

export const predictions = asyncHandler(async (req: Request, res: Response) => {
  const data = await RetentionService.getPredictions(req.user!);
  return successResponse(res, "Churn & renewal predictions", data);
});

// Manual recompute trigger (admin) — the nightly job calls the service directly.
export const recompute = asyncHandler(async (req: Request, res: Response) => {
  const data = await RetentionService.recomputeGym(req.user!.gymId!);
  return successResponse(res, "Scores recomputed", data);
});
