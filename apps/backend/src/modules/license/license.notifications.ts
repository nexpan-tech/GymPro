import { prisma } from "../../config/db";
import { logger } from "../../config/logger";
import { sendEmail } from "../email/email.service";
import { PlatformSettingsService } from "../super-admin/platform-settings.service";

/**
 * License lifecycle notification hooks.
 *
 * Uses the EXISTING email infrastructure (modules/email/email.service →
 * sendEmail). sendEmail gracefully returns `{ skipped: true }` when no provider
 * is configured (SMTP/Resend keys absent), so these hooks never throw and the
 * lifecycle/billing flows always succeed. Recipients are the gym's ADMIN (the
 * license owner), not members — license events are a B2B (GymPro → gym) concern.
 *
 * Delivery channels NOT wired here (would require provider configuration / new
 * infra): SMS, WhatsApp, and admin in-app notifications (the in-app
 * NotificationService is member-scoped). Email is the single B2B channel.
 */

export type LicenseEvent =
  | "TRIAL_ENDING_SOON"
  | "TRIAL_EXPIRED"
  | "RENEWAL_DUE_SOON"
  | "RENEWAL_DUE"
  | "LICENSE_EXPIRED"
  | "LICENSE_SUSPENDED"
  | "PAYMENT_OVERDUE"
  | "INVOICE_GENERATED";

interface EventCtx {
  planName?: string | null;
  date?: Date | null;
  amount?: number | null;
  invoiceNumber?: string | null;
  extra?: string;
}

const fmtDate = (d?: Date | null) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

function content(event: LicenseEvent, gymName: string, brand: string, ctx: EventCtx): { subject: string; body: string } {
  const plan = ctx.planName ? ` (${ctx.planName} plan)` : "";
  switch (event) {
    case "TRIAL_ENDING_SOON":
      return { subject: `${brand}: your free trial ends ${fmtDate(ctx.date)}`, body: `Your ${brand} trial${plan} for <strong>${gymName}</strong> ends on <strong>${fmtDate(ctx.date)}</strong>. Convert to a paid plan to keep all features active.` };
    case "TRIAL_EXPIRED":
      return { subject: `${brand}: your trial has expired`, body: `The ${brand} trial${plan} for <strong>${gymName}</strong> expired on ${fmtDate(ctx.date)}. Assign a paid plan from your dashboard to restore full access.` };
    case "RENEWAL_DUE_SOON":
      return { subject: `${brand}: license renews ${fmtDate(ctx.date)}`, body: `Your ${brand} license${plan} for <strong>${gymName}</strong> renews on <strong>${fmtDate(ctx.date)}</strong>.` };
    case "RENEWAL_DUE":
      return { subject: `${brand}: license renewal due`, body: `Your ${brand} license${plan} for <strong>${gymName}</strong> is due for renewal (term ended ${fmtDate(ctx.date)}). Please complete payment to avoid suspension.` };
    case "LICENSE_EXPIRED":
      return { subject: `${brand}: license expired`, body: `The ${brand} license${plan} for <strong>${gymName}</strong> has expired. Renew to restore access.` };
    case "LICENSE_SUSPENDED":
      return { subject: `${brand}: license suspended`, body: `The ${brand} license${plan} for <strong>${gymName}</strong> has been suspended due to non-payment past the grace period. Settle the outstanding invoice to reactivate.` };
    case "PAYMENT_OVERDUE":
      return { subject: `${brand}: payment overdue`, body: `An invoice${ctx.invoiceNumber ? ` (${ctx.invoiceNumber})` : ""} for <strong>${gymName}</strong> is overdue${ctx.amount ? ` — ₹${ctx.amount}` : ""}. Please pay to keep your license active.` };
    case "INVOICE_GENERATED":
      return { subject: `${brand}: invoice ${ctx.invoiceNumber ?? ""}`, body: `A new ${brand} invoice${ctx.invoiceNumber ? ` (${ctx.invoiceNumber})` : ""}${ctx.amount ? ` for ₹${ctx.amount}` : ""} has been generated for <strong>${gymName}</strong>. Due ${fmtDate(ctx.date)}.` };
  }
}

/**
 * Best-effort B2B email to a gym's admin/owner for a license event. Never
 * throws — returns the delivery status so callers can record it.
 */
export async function notifyLicenseEvent(gymId: string, event: LicenseEvent, ctx: EventCtx = {}): Promise<"SENT" | "SKIPPED" | "FAILED"> {
  try {
    const [gym, settings] = await Promise.all([
      prisma.gym.findUnique({
        where: { id: gymId },
        select: { name: true, email: true, users: { where: { role: "ADMIN", isActive: true }, select: { email: true }, take: 1 } },
      }),
      PlatformSettingsService.get().catch(() => null),
    ]);
    if (!gym) return "SKIPPED";
    const to = gym.users[0]?.email ?? gym.email;
    if (!to) return "SKIPPED";

    const brand = (settings?.companyName as string) || "GymPro";
    const { subject, body } = content(event, gym.name, brand, ctx);
    const html = `<div style="font-family:system-ui,sans-serif"><h2>${subject}</h2><p>${body}</p><p style="color:#888;font-size:12px">${(settings?.invoiceFooter as string) || "This is an automated message from GymPro."}</p></div>`;

    const result = (await sendEmail({ to, subject, html })) as { skipped?: boolean } | undefined;
    return result?.skipped ? "SKIPPED" : "SENT";
  } catch (err) {
    logger.warn(`[license-notify] ${event} for gym ${gymId} failed`, { err: String(err) });
    return "FAILED";
  }
}
