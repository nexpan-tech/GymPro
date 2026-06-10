import { Request, Response } from "express";
import { AuditAction } from "@prisma/client";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import { FeatureFlagService } from "./feature-flag.service";
import { createAuditLog } from "../../utils/audit";
import { logSecurity } from "../../config/logger";

export const myFlags = asyncHandler(async (req: Request, res: Response) => {
  return successResponse(res, "Feature flags", await FeatureFlagService.forCaller(req.user!));
});

export const catalogue = asyncHandler(async (_req: Request, res: Response) => {
  return successResponse(res, "Feature catalogue", await FeatureFlagService.catalogue());
});

export const gymFlags = asyncHandler(async (req: Request, res: Response) => {
  return successResponse(res, "Gym feature flags", await FeatureFlagService.effectiveForGym(req.params.gymId as string));
});

export const setFlag = asyncHandler(async (req: Request, res: Response) => {
  const gymId = req.params.gymId as string;
  const { flagKey, enabled } = req.body;
  const data = await FeatureFlagService.setForGym(gymId, flagKey, Boolean(enabled));

  // Stage 10 — compliance: feature-flag changes are audited + security-logged.
  await createAuditLog({
    gymId,
    userId: req.user?.id,
    action: AuditAction.UPDATE,
    entity: "FeatureFlag",
    entityId: flagKey,
    newData: { flagKey, enabled: Boolean(enabled) },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] || null,
  });
  logSecurity("feature_flag_changed", { gymId, flagKey, enabled: Boolean(enabled), by: req.user?.id });

  return successResponse(res, "Feature flag updated", data);
});

export const seed = asyncHandler(async (_req: Request, res: Response) => {
  return successResponse(res, "Catalogue seeded", await FeatureFlagService.seed());
});
