import { logger } from "../config/logger";
import { RetentionService } from "../modules/retention/retention.service";

/**
 * Stage 7 — nightly recompute + persist of every member's retention/risk score.
 * Stored scores power the risk dashboards and downstream churn alerts.
 */
export async function processScoreRecompute() {
  try {
    const result = await RetentionService.recomputeAll();
    logger.info("Retention scores recomputed", result);
    return { success: true, ...result };
  } catch (error) {
    logger.error("Score recompute job failed", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
