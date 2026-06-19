import { AuditAction } from "@prisma/client";
import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import { sendEmail } from "../../modules/email/email.service";
import { logger } from "../../config/logger";
import { createAuditLog } from "../../utils/audit";
import { PlatformSettingsService } from "./platform-settings.service";
import { RevenueSummaryService } from "./revenue.service";
import { generateSaaSInvoicePdf } from "../../modules/reports/pdf.service";

/** Who/what triggered a billing action — threaded into audit logs. */
export interface BillingActor {
  userId?: string | null;
  role?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  source?: "manual" | "auto";
}

/**
 * Per-active-member SaaS billing (GymPro → Gyms).
 *
 *   monthlyAmount = activeMemberCount × gym.pricePerActiveMember
 *   gstAmount     = monthlyAmount × gym.gstPercent / 100
 *   total         = monthlyAmount + gstAmount
 *
 * Each gym carries its OWN price (Gym.pricePerActiveMember). All figures are
 * computed from real DB relations — there are no hardcoded amounts anywhere.
 * SUPER_ADMIN only (enforced at the route layer).
 */

function round(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Current billing month as "YYYY-MM". */
export function currentBillingMonth(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function computeBill(activeMembers: number, pricePerMember: number, gstPercent: number) {
  const subtotal = round(activeMembers * pricePerMember);
  const gstAmount = round((subtotal * gstPercent) / 100);
  const total = round(subtotal + gstAmount);
  return { subtotal, gstAmount, total };
}

/** Active member counts per gym in a single query (status = ACTIVE only). */
async function activeMemberCounts(): Promise<Map<string, number>> {
  const rows = await prisma.member.groupBy({
    by: ["gymId"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.gymId, r._count._all]));
}

function effectiveStatus(inv: { status: string; dueDate: Date }): string {
  if (inv.status === "PAID" || inv.status === "CANCELLED") return inv.status;
  if (inv.dueDate < new Date() && inv.status !== "PAID") return "OVERDUE";
  return inv.status;
}

export class SaaSBillingService {
  /** Every gym with its real active-member count + calculated monthly bill. */
  static async subscriptions() {
    const [gyms, counts, invoices] = await Promise.all([
      prisma.gym.findMany({
        orderBy: { name: "asc" },
        include: {
          users: { where: { role: "ADMIN" }, select: { email: true, name: true }, take: 1 },
        },
      }),
      activeMemberCounts(),
      prisma.saaSInvoice.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    // Group invoices per gym (already desc by createdAt).
    const byGym = new Map<string, typeof invoices>();
    for (const inv of invoices) {
      const list = byGym.get(inv.gymId) ?? [];
      list.push(inv);
      byGym.set(inv.gymId, list);
    }

    const month = currentBillingMonth();

    return gyms.map((g) => {
      const activeMemberCount = counts.get(g.id) ?? 0;
      const price = g.pricePerActiveMember ?? 0;
      const { subtotal, gstAmount, total } = computeBill(activeMemberCount, price, g.gstPercent);
      const gymInvoices = byGym.get(g.id) ?? [];
      const latest = gymInvoices[0] ?? null;
      const lastPaid = gymInvoices.find((i) => i.status === "PAID") ?? null;
      const pendingAmount = round(
        gymInvoices
          .filter((i) => i.status !== "PAID" && i.status !== "CANCELLED")
          .reduce((s, i) => s + i.totalAmount, 0),
      );

      return {
        gymId: g.id,
        gymName: g.name,
        ownerEmail: g.users[0]?.email ?? g.email,
        subscriptionStatus: g.isActive ? "ACTIVE" : "SUSPENDED",
        activeMemberCount,
        pricePerActiveMember: price,
        gstPercent: g.gstPercent,
        subtotal,
        gstAmount,
        monthlyAmount: total,
        currentBillingMonth: month,
        billingStatus: latest ? effectiveStatus(latest) : "NOT_BILLED",
        lastBilledDate: latest?.createdAt ?? null,
        lastPaidDate: lastPaid?.paidAt ?? null,
        pendingAmount,
        latestInvoice: latest
          ? {
              id: latest.id,
              invoiceNumber: latest.invoiceNumber,
              billingMonth: latest.billingMonth,
              status: effectiveStatus(latest),
              totalAmount: latest.totalAmount,
              dueDate: latest.dueDate,
              sentAt: latest.sentAt,
              paidAt: latest.paidAt,
            }
          : null,
      };
    });
  }

  /**
   * Generate one GST invoice per eligible gym for the month.
   *
   * Idempotent + race-safe: a DB unique constraint (gymId, billingMonth) is the
   * source of truth, so two admins generating at once can never duplicate — the
   * loser's create raises P2002 and is recorded as "skipped". Used by both the
   * manual super-admin action and the monthly cron.
   */
  static async generateInvoices(month?: string, actor: BillingActor = {}) {
    const billingMonth = month || currentBillingMonth();
    const settings = await PlatformSettingsService.get();
    const seller = PlatformSettingsService.snapshot(settings);
    const counts = await activeMemberCounts();
    const gyms = await prisma.gym.findMany({
      where: { isActive: true },
      include: { users: { where: { role: "ADMIN" }, select: { email: true, name: true }, take: 1 } },
    });

    let created = 0;
    let skipped = 0;
    let totalBilled = 0;
    const results: any[] = [];

    for (const gym of gyms) {
      const members = counts.get(gym.id) ?? 0;
      const price = gym.pricePerActiveMember ?? 0;

      // Skip: no active members or no price set yet (rule from the spec).
      if (members === 0 || price <= 0) {
        skipped++;
        continue;
      }

      // Fast path idempotency (avoids a wasted create most of the time).
      const existing = await prisma.saaSInvoice.findFirst({ where: { gymId: gym.id, billingMonth } });
      if (existing) {
        skipped++;
        continue;
      }

      const { subtotal, gstAmount, total } = computeBill(members, price, gym.gstPercent);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (settings.dueDays ?? 15));
      const invoiceNumber = `${settings.invoicePrefix || "SAAS"}-${billingMonth.replace("-", "")}-${gym.id.slice(-6).toUpperCase()}`;

      let invoice;
      try {
        invoice = await prisma.saaSInvoice.create({
          data: {
            gymId: gym.id,
            invoiceNumber,
            amount: subtotal,
            gstAmount,
            totalAmount: total,
            status: "PENDING",
            dueDate,
            billingMonth,
            activeMemberCount: members,
            pricePerMember: price,
            gstPercent: gym.gstPercent,
            sellerSnapshot: seller as any,
            pdfUrl: null,
          },
        });
      } catch (err: any) {
        // P2002 = the (gymId, billingMonth) unique constraint fired → a parallel
        // request already created it. Treat as a clean skip, never a crash.
        if (err?.code === "P2002") {
          skipped++;
          await createAuditLog({
            gymId: gym.id, userId: actor.userId ?? null, action: AuditAction.CREATE,
            entity: "SaaSInvoice", entityId: `${gym.id}:${billingMonth}`,
            newData: { event: "INVOICE_DUPLICATE_BLOCKED", billingMonth, source: actor.source ?? "manual" },
            ipAddress: actor.ip ?? null, userAgent: actor.userAgent ?? null,
          });
          continue;
        }
        throw err;
      }

      // pdfUrl points at the on-demand download endpoint (always reflects the
      // frozen snapshot). Best-effort email with the PDF attached.
      const pdfUrl = `/api/v1/super-admin/billing/invoices/${invoice.id}/pdf`;
      const email = gym.users[0]?.email ?? gym.email;
      const delivery = await this.emailInvoice(gym, invoice, email, seller);
      invoice = await prisma.saaSInvoice.update({
        where: { id: invoice.id },
        data: {
          pdfUrl,
          emailStatus: delivery.status,
          sentAt: delivery.status === "SENT" ? new Date() : null,
          status: delivery.status === "SENT" ? "SENT" : "PENDING",
        },
      });

      await createAuditLog({
        gymId: gym.id, userId: actor.userId ?? null, action: AuditAction.CREATE,
        entity: "SaaSInvoice", entityId: invoice.id,
        newData: { event: "INVOICE_GENERATED", invoiceNumber, billingMonth, totalAmount: total, emailStatus: delivery.status, source: actor.source ?? "manual" },
        ipAddress: actor.ip ?? null, userAgent: actor.userAgent ?? null,
      });

      created++;
      totalBilled = round(totalBilled + total);
      results.push({ gymId: gym.id, gymName: gym.name, invoiceNumber, activeMemberCount: members, totalAmount: total, emailStatus: delivery.status });
    }

    return { billingMonth, created, skipped, totalBilled, invoices: results };
  }

  /**
   * Build + send a GST invoice email with the PDF attached. HTML always renders
   * as the fallback if PDF generation fails. Returns SENT | SKIPPED | FAILED.
   */
  private static async emailInvoice(
    gym: { name: string; gstNumber?: string | null; email?: string | null; address?: string | null },
    invoice: any,
    to: string,
    seller?: Record<string, unknown>,
  ): Promise<{ status: "SENT" | "SKIPPED" | "FAILED"; reason?: string }> {
    if (!to) return { status: "SKIPPED", reason: "No billing email on file" };
    const html = `
      <h2>${(seller?.companyName as string) ?? "GymPro"} — SaaS Invoice ${invoice.billingMonth}</h2>
      <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
      <p><strong>Gym:</strong> ${gym.name}${gym.gstNumber ? ` (GSTIN ${gym.gstNumber})` : ""}</p>
      <table cellpadding="6" style="border-collapse:collapse" border="1">
        <tr><td>Active members</td><td>${invoice.activeMemberCount}</td></tr>
        <tr><td>Price / active member</td><td>₹${invoice.pricePerMember}</td></tr>
        <tr><td>Subtotal</td><td>₹${invoice.amount}</td></tr>
        <tr><td>GST (${invoice.gstPercent}%)</td><td>₹${invoice.gstAmount}</td></tr>
        <tr><td><strong>Total payable</strong></td><td><strong>₹${invoice.totalAmount}</strong></td></tr>
        <tr><td>Due date</td><td>${new Date(invoice.dueDate).toLocaleDateString("en-IN")}</td></tr>
      </table>
      <p style="color:#666">${(seller?.invoiceFooter as string) ?? "Thank you for your business."}</p>`;

    // PDF attachment is best-effort; the HTML email is the guaranteed fallback.
    let attachments: { filename: string; content: Buffer }[] | undefined;
    try {
      const pdf = await generateSaaSInvoicePdf(invoice, seller ?? {}, gym);
      attachments = [{ filename: `${invoice.invoiceNumber}.pdf`, content: pdf }];
    } catch (err) {
      logger.warn("SaaS invoice PDF attach failed, sending HTML only", { invoice: invoice.invoiceNumber, err: String(err) });
    }

    // Retry transient send failures up to 3× with exponential backoff.
    const subject = `${(seller?.companyName as string) ?? "GymPro"} Invoice ${invoice.invoiceNumber} — ₹${invoice.totalAmount}`;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result: any = await sendEmail({ to, subject, html, attachments });
        if (result?.skipped) return { status: "SKIPPED", reason: "Email provider not configured" };
        return { status: "SENT" };
      } catch (err) {
        logger.warn(`SaaS invoice email attempt ${attempt}/3 failed`, { invoice: invoice.invoiceNumber, err: String(err) });
        if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt)); // 1s, 2s
      }
    }
    return { status: "FAILED", reason: "Email send error after 3 attempts" };
  }

  /**
   * Render the GST PDF for an invoice on demand (always reflects the frozen
   * sellerSnapshot). `gymUserId` restricts a gym admin to their own gym's
   * invoices; omit for SUPER_ADMIN.
   */
  static async getInvoicePdf(id: string, gymUserId?: string): Promise<{ buffer: Buffer; filename: string }> {
    const inv = await prisma.saaSInvoice.findUnique({
      where: { id },
      include: { gym: { select: { id: true, name: true, email: true, gstNumber: true, address: true } } },
    });
    if (!inv) throw new AppError("Invoice not found", 404);

    if (gymUserId) {
      const member = await prisma.user.findFirst({ where: { id: gymUserId } });
      if (!member || member.gymId !== inv.gymId || (member.role !== "ADMIN" && member.role !== "SUPER_ADMIN")) {
        throw new AppError("You can only download your own gym's invoices", 403);
      }
    }

    const seller = (inv.sellerSnapshot as Record<string, unknown>) ?? PlatformSettingsService.snapshot(await PlatformSettingsService.get());
    const buffer = await generateSaaSInvoicePdf(inv, seller, inv.gym);
    return { buffer, filename: `${inv.invoiceNumber}.pdf` };
  }

  /** List invoices with optional month / status / gym filters. */
  static async listInvoices(filters: { month?: string; status?: string; gymId?: string } = {}) {
    const where: any = {};
    if (filters.month) where.billingMonth = filters.month;
    if (filters.gymId) where.gymId = filters.gymId;
    if (filters.status) where.status = filters.status;

    const invoices = await prisma.saaSInvoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { gym: { select: { id: true, name: true, gstNumber: true } } },
    });
    return invoices.map((i) => ({ ...i, effectiveStatus: effectiveStatus(i) }));
  }

  /** Full GST invoice detail (for the invoice view / PDF follow-up). */
  static async getInvoice(id: string) {
    const inv = await prisma.saaSInvoice.findUnique({
      where: { id },
      include: { gym: { select: { id: true, name: true, email: true, gstNumber: true, stateCode: true } } },
    });
    if (!inv) throw new AppError("Invoice not found", 404);
    return { ...inv, effectiveStatus: effectiveStatus(inv) };
  }

  /** Super-admin records a settled payment against an invoice. */
  static async recordPayment(invoiceId: string, actor: BillingActor = {}) {
    const inv = await prisma.saaSInvoice.findUnique({ where: { id: invoiceId } });
    if (!inv) throw new AppError("Invoice not found", 404);
    if (inv.status === "CANCELLED") throw new AppError("Cannot pay a cancelled invoice", 400);
    if (inv.status === "PAID") return inv; // idempotent
    const updated = await prisma.saaSInvoice.update({
      where: { id: invoiceId },
      data: { status: "PAID", paidAt: new Date() },
    });
    await createAuditLog({
      gymId: inv.gymId, userId: actor.userId ?? null, action: AuditAction.PAYMENT,
      entity: "SaaSInvoice", entityId: inv.id,
      newData: { event: "PAYMENT_RECORDED", invoiceNumber: inv.invoiceNumber, totalAmount: inv.totalAmount },
      ipAddress: actor.ip ?? null, userAgent: actor.userAgent ?? null,
    });
    return updated;
  }

  /** Cancel an unpaid invoice. */
  static async cancelInvoice(invoiceId: string, actor: BillingActor = {}) {
    const inv = await prisma.saaSInvoice.findUnique({ where: { id: invoiceId } });
    if (!inv) throw new AppError("Invoice not found", 404);
    if (inv.status === "PAID") throw new AppError("Cannot cancel a paid invoice", 400);
    const updated = await prisma.saaSInvoice.update({ where: { id: invoiceId }, data: { status: "CANCELLED" } });
    await createAuditLog({
      gymId: inv.gymId, userId: actor.userId ?? null, action: AuditAction.UPDATE,
      entity: "SaaSInvoice", entityId: inv.id,
      newData: { event: "INVOICE_CANCELLED", invoiceNumber: inv.invoiceNumber },
      ipAddress: actor.ip ?? null, userAgent: actor.userAgent ?? null,
    });
    return updated;
  }

  /** Platform SaaS revenue summary — delegates to the single source of truth. */
  static async revenueSummary() {
    return RevenueSummaryService.summary();
  }
}
