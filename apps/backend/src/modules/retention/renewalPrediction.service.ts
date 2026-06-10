import { computeMemberScores, type MemberScoreInput } from "./retention.service";
import type { PredictionOutput } from "./churnPrediction.service";

/**
 * AI-PREPARATION LAYER — renewal prediction.
 *
 * Deterministic, rule-based for now. `predictionScore` = probability (0–1) the
 * member renews. Mirrors the churn predictor's contract so a real model can be
 * swapped in later. Renewal probability is the engagement-weighted inverse of
 * churn risk.
 */
export class RenewalPredictionService {
  static readonly model = "rule-based-v1";

  static predict(input: MemberScoreInput): PredictionOutput {
    const { retentionScore, riskScore, riskLevel } = computeMemberScores(input);

    // Blend: high retention pushes renewal up, high churn risk pulls it down.
    const raw = retentionScore * 0.6 + (100 - riskScore) * 0.4;
    const predictionScore = Number(Math.max(0, Math.min(1, raw / 100)).toFixed(2));

    let signals = 0;
    if (input.attendanceLast30 > 0) signals += 1;
    if (input.workoutCompletions > 0) signals += 1;
    if (input.dietCompletions > 0) signals += 1;
    if (input.progressUpdatesLast90 > 0) signals += 1;
    if (input.renewalCount > 0) signals += 1;
    const confidence = Number(Math.min(1, 0.4 + signals * 0.12).toFixed(2));

    const factors: string[] = [];
    if (input.renewalCount > 0) factors.push(`${input.renewalCount} prior renewal(s)`);
    if (input.attendanceLast30 >= 8) factors.push("strong recent attendance");
    if (input.workoutCompletions > 0) factors.push("completing workouts");
    if (!input.membershipExpired) factors.push("membership active");
    if (input.pendingDue > 0) factors.push("has pending dues");

    return { predictionScore, confidence, riskLevel, factors, model: this.model };
  }
}
