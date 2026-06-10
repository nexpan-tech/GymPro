import { Request, Response } from "express";
import { ReferralService } from "./referral.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";

export const myCode = asyncHandler(async (req: Request, res: Response) => {
  const data = await ReferralService.getMyCode(req.user!);
  return successResponse(res, "Referral code", data);
});

export const myReferrals = asyncHandler(async (req: Request, res: Response) => {
  const data = await ReferralService.myReferrals(req.user!);
  return successResponse(res, "My referrals", data);
});

export const createInvite = asyncHandler(async (req: Request, res: Response) => {
  const data = await ReferralService.createInvite(req.user!, req.body);
  return successResponse(res, "Referral created", data, 201);
});

export const convert = asyncHandler(async (req: Request, res: Response) => {
  const data = await ReferralService.convert(req.user!, req.params.id as string);
  return successResponse(res, "Referral converted", data);
});

export const listForGym = asyncHandler(async (req: Request, res: Response) => {
  const data = await ReferralService.listForGym(req.user!);
  return successResponse(res, "Referrals", data);
});
