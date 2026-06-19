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

// ── Super-admin CRUD management ─────────────────────────────────────────────

export const listAll = asyncHandler(async (_req: Request, res: Response) => {
  return successResponse(res, "Feature flags", await FeatureFlagService.listAll());
});

export const createFlag = asyncHandler(async (req: Request, res: Response) => {
  const flag = await FeatureFlagService.createFlag(req.body);
  await createAuditLog({
    userId: req.user?.id,
    action: AuditAction.CREATE,
    entity: "FeatureFlag",
    entityId: flag.key,
    newData: { key: flag.key, label: flag.label },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] || null,
  });
  logSecurity("feature_flag_created", { key: flag.key, by: req.user?.id });
  return successResponse(res, "Feature flag created", flag);
});

export const updateFlag = asyncHandler(async (req: Request, res: Response) => {
  const key = req.params.key as string;
  const flag = await FeatureFlagService.updateFlag(key, req.body);
  await createAuditLog({
    userId: req.user?.id,
    action: AuditAction.UPDATE,
    entity: "FeatureFlag",
    entityId: key,
    newData: req.body,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] || null,
  });
  logSecurity("feature_flag_updated", { key, by: req.user?.id });
  return successResponse(res, "Feature flag updated", flag);
});

export const deleteFlag = asyncHandler(async (req: Request, res: Response) => {
  const key = req.params.key as string;
  const flag = await FeatureFlagService.deleteFlag(key);
  await createAuditLog({
    userId: req.user?.id,
    action: AuditAction.UPDATE,
    entity: "FeatureFlag",
    entityId: key,
    newData: { isActive: false },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] || null,
  });
  logSecurity("feature_flag_deactivated", { key, by: req.user?.id });
  return successResponse(res, "Feature flag deactivated", flag);
});
