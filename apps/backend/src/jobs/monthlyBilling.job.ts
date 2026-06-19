import { AuditAction } from "@prisma/client";
import { logger } from "../config/logger";
import { SaaSBillingService } from "../modules/super-admin/saas-billing.service";
import { createAuditLog } from "../utils/audit";

/**
 * Automated monthly SaaS billing. Runs on the 1st at 00:05. Generates one GST
 * invoice per eligible active gym (active members > 0, price > 0), with PDFs +
 * email (3× retry). Fully idempotent: the (gymId, billingMonth) unique
 * constraint guarantees a rerun — or a parallel manual generation — never
 * duplicates. Writes a summary audit entry for the run.
 */
export async function processMonthlyBilling() {
  try {
    const result = await SaaSBillingService.generateInvoices(undefined, { source: "auto" });
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
