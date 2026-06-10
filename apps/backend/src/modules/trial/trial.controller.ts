import { Request, Response } from "express";
import { TrialService } from "./trial.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await TrialService.create(req.user!, req.body);
  return successResponse(res, "Trial created", data, 201);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await TrialService.list(req.user!, req.query.status as string | undefined);
  return successResponse(res, "Trials", data);
});

export const stats = asyncHandler(async (req: Request, res: Response) => {
  const data = await TrialService.stats(req.user!);
  return successResponse(res, "Trial conversion stats", data);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const data = await TrialService.getById(req.user!, req.params.id as string);
  return successResponse(res, "Trial", data);
});

export const convert = asyncHandler(async (req: Request, res: Response) => {
  const data = await TrialService.convert(req.user!, req.params.id as string, req.body);
  return successResponse(res, "Trial converted", data);
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const data = await TrialService.setStatus(req.user!, req.params.id as string, "CANCELLED");
  return successResponse(res, "Trial cancelled", data);
});
