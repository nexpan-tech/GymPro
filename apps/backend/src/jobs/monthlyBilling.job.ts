import { AuditAction } from "@prisma/client";
import { logger } from "../config/logger";
import { LicenseService } from "../modules/license/license.service";
import { createAuditLog } from "../utils/audit";

/**
 * Automated monthly SaaS billing. Runs on the 1st at 00:05. Generates one flat
 * LICENSE invoice (plan price + GST) per eligible active-licensed gym, with PDFs
 * + email (3× retry). Billing is license-based — NOT per active member. Fully
 * idempotent: the (gymId, billingMonth) unique constraint guarantees a rerun —
 * or a parallel manual generation — never duplicates. Writes a summary audit
 * entry for the run.
 */
export async function processMonthlyBilling() {
  try {
    const result = await LicenseService.generateInvoices(undefined, { source: "auto" });
    logger.info("Automated monthly SaaS billing complete", result);
    await createAuditLog({
      action: AuditAction.CREATE,
      entity: "SaaSBilling",
      entityId: result.billingMonth,
      newData: {
        event: "AUTO_BILLING_RUN",
        billingMonth: result.billingMonth,
        created: result.created,
        skipped: result.skipped,
        totalBilled: result.totalBilled,
        source: "auto",
      },
    });
    return result;
  } catch (err) {
    logger.error("Automated monthly SaaS billing failed", err);
    throw err;
  }
}
