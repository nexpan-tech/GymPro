import { computeMemberScores, type MemberScoreInput } from "./retention.service";

/**
 * AI-PREPARATION LAYER — churn prediction.
 *
 * No LLM / external model is called yet. This is a deterministic, rule-based
 * predictor whose interface ({ predictionScore, confidence, ... }) is shaped so
 * a future ML model can be dropped in behind the same contract without touching
 * callers. `predictionScore` = probability (0–1) the member churns soon.
 */
export interface PredictionOutput {
  predictionScore: number; // 0–1
  confidence: number; // 0–1
  riskLevel: string;
  factors: string[];
  model: string;
}

export class ChurnPredictionService {
  static readonly model = "rule-based-v1";

  static predict(input: MemberScoreInput): PredictionOutput {
    const { riskScore, riskLevel } = computeMemberScores(input);
    const predictionScore = Number((riskScore / 100).toFixed(2));

    // Confidence grows with the amount of signal we actually have.
    let signals = 0;
    if (input.daysSinceLastAttendance !== null) signals += 1;
    if (input.attendanceLast30 > 0) signals += 1;
    if (input.workoutCompletions > 0) signals += 1;
    if (input.progressUpdatesLast90 > 0) signals += 1;
    if (input.renewalCount > 0) signals += 1;
    const confidence = Number(Math.min(1, 0.4 + signals * 0.12).toFixed(2));

    const factors: string[] = [];
    const d = input.daysSinceLastAttendance;
    if (d === null) factors.push("never attended");
    else if (d >= 30) factors.push("inactive 30+ days");
    else if (d >= 14) factors.push("inactive 14+ days");
    else if (d >= 7) factors.push("inactive 7+ days");
    if (input.membershipExpired) factors.push("membership expired");
    if (input.pendingDue > 0) factors.push("pending dues");
    if (input.workoutCompletions === 0) factors.push("no workouts completed");
    if (input.progressUpdatesLast90 === 0) factors.push("no recent progress");

    return { predictionScore, confidence, riskLevel, factors, model: this.model };
  }
}
