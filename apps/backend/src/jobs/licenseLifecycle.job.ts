import { logger } from "../config/logger";
import { LicenseService } from "../modules/license/license.service";

/**
 * Daily license lifecycle automation. Advances license states by date
 * (trial-expiry, renewal-due → PAST_DUE, grace → SUSPENDED) and sends reminder
 * emails. Idempotent: re-running only re-evaluates current dates; already-
 * transitioned licenses are skipped. See LicenseService.runLifecycle.
 */
export async function processLicenseLifecycle() {
  try {
    const result = await LicenseService.runLifecycle({ source: "auto" });
    logger.info("License lifecycle automation complete", result);
    return result;
  } catch (err) {
    logger.error("License lifecycle automation failed", err);
    throw err;
  }
}
