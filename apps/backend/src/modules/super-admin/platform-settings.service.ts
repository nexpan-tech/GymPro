import { prisma } from "../../config/db";

/**
 * Platform (Nexpan Tech) billing identity — a singleton. Drives invoice
 * branding, GST defaults, bank details, numbering, and due terms. SUPER_ADMIN
 * only (enforced at the route layer). Editing never mutates already-issued
 * invoices (those carry their own frozen `sellerSnapshot`).
 */

const EDITABLE = [
  "companyName", "companyLogo", "companyAddress", "companyEmail", "companyPhone", "companyWebsite",
  "gstNumber", "defaultGstPercent", "panNumber", "cinNumber",
  "accountName", "accountNumber", "bankName", "ifscCode", "upiId",
  "invoicePrefix", "invoiceFooter", "paymentTerms", "dueDays",
] as const;

export class PlatformSettingsService {
  /** The active settings row, lazily created with defaults on first read. */
  static async get() {
    const existing = await prisma.platformBillingSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    if (existing) return existing;
    return prisma.platformBillingSettings.create({ data: {} }); // schema defaults
  }

  static async update(input: Record<string, unknown>) {
    const current = await this.get();
    const data: Record<string, unknown> = {};
    for (const key of EDITABLE) {
      if (input[key] !== undefined) {
        data[key] = key === "defaultGstPercent" || key === "dueDays" ? Number(input[key]) : input[key];
      }
    }
    return prisma.platformBillingSettings.update({ where: { id: current.id }, data });
  }

  /** A plain seller snapshot frozen onto an invoice at issue time. */
  static snapshot(s: Awaited<ReturnType<typeof PlatformSettingsService.get>>) {
    return {
      companyName: s.companyName,
      companyLogo: s.companyLogo,
      companyAddress: s.companyAddress,
      companyEmail: s.companyEmail,
      companyPhone: s.companyPhone,
      companyWebsite: s.companyWebsite,
      gstNumber: s.gstNumber,
      panNumber: s.panNumber,
      cinNumber: s.cinNumber,
      accountName: s.accountName,
      accountNumber: s.accountNumber,
      bankName: s.bankName,
      ifscCode: s.ifscCode,
      upiId: s.upiId,
      invoiceFooter: s.invoiceFooter,
      paymentTerms: s.paymentTerms,
    };
  }
}
