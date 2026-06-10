import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import { RecommendationEngine } from "./recommendation.engine";
import { ForecastEngine } from "./forecast.engine";
import { InsightEngine } from "./insight.engine";

// Member-facing recommendations (self).
export const myRecommendations = asyncHandler(async (req: Request, res: Response) => {
  const data = await RecommendationEngine.forCaller(req.user!);
  return successResponse(res, "Recommendations", data);
});

/** Positive coaching nudges derived from recommendations (no scary churn language). */
export const myNudges = asyncHandler(async (req: Request, res: Response) => {
  const recs = await RecommendationEngine.forCaller(req.user!);
  const nudges = recs
    .filter((r) => r.category === "ENGAGEMENT" || r.category === "CHALLENGE" || r.category === "RENEWAL" || r.category === "WORKOUT")
    .map((r) => ({ title: r.title, message: r.description, confidence: r.confidence }));
  return successResponse(res, "Smart nudges", nudges);
});

// Staff recommendations for a specific member.
export const memberRecommendations = asyncHandler(async (req: Request, res: Response) => {
  const data = await RecommendationEngine.forMember(req.user!.gymId!, req.params.memberId as string);
  return successResponse(res, "Member recommendations", data);
});

export const forecast = asyncHandler(async (req: Request, res: Response) => {
  const data = await ForecastEngine.forGym(req.user!);
  return successResponse(res, "Forecasts", data);
});

export const insights = asyncHandler(async (req: Request, res: Response) => {
  const data = await InsightEngine.forGym(req.user!);
  return successResponse(res, "Predictive insights", data);
});
