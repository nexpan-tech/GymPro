import { sendEmail } from "../email/email.service";
import { logger } from "../../config/logger";

/**
 * Metadata-only invoice email (no PDF — Stage 6 keeps invoices metadata-first).
 * Best-effort: never throws into the payment path. Falls back to a logged
 * warning when SMTP is not configured (sendEmail returns { skipped: true }).
 */
export interface InvoiceEmailInput {
  to?: string | null;
  memberName: string;
  planName?: string | null;
  invoice: {
    invoiceNumber: string;
    invoiceDate: Date | string;
    subtotal: number;
    gstPercent: number;
    cgst: number;
    sgst: number;
    igst: number;
    gstAmount: number;
    totalAmount: number;
  };
}

const inr = (n: number) =>
  `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function buildHtml(input: InvoiceEmailInput): string {
  const { invoice: i, memberName, planName } = input;
  const date = new Date(i.invoiceDate).toLocaleDateString("en-IN");
  const gstRows =
    i.igst > 0
      ? `<tr><td>IGST (${i.gstPercent}%)</td><td align="right">${inr(i.igst)}</td></tr>`
      : `<tr><td>CGST (${i.gstPercent / 2}%)</td><td align="right">${inr(i.cgst)}</td></tr>
         <tr><td>SGST (${i.gstPercent / 2}%)</td><td align="right">${inr(i.sgst)}</td></tr>`;

  return `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
    <h2 style="margin-bottom:4px">Payment Receipt</h2>
    <p style="color:#666;margin-top:0">Invoice ${i.invoiceNumber} · ${date}</p>
    <p>Hi ${memberName},</p>
    <p>Thank you for your payment${planName ? ` for <strong>${planName}</strong>` : ""}. Here is your GST invoice.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tbody>
        <tr><td>Subtotal</td><td align="right">${inr(i.subtotal)}</td></tr>
        ${gstRows}
        <tr><td>GST Total</td><td align="right">${inr(i.gstAmount)}</td></tr>
        <tr style="font-weight:bold;border-top:1px solid #ddd">
          <td style="padding-top:8px">Total Paid</td>
          <td align="right" style="padding-top:8px">${inr(i.totalAmount)}</td>
        </tr>
      </tbody>
    </table>
    <p style="color:#888;font-size:12px;margin-top:24px">This is a system-generated invoice from GymPro.</p>
  </div>`;
}

/** Fire-and-forget invoice email. Logs and swallows all errors. */
export async function sendInvoiceEmail(input: InvoiceEmailInput): Promise<void> {
  try {
    if (!input.to) {
      logger.warn("Invoice email skipped — no recipient address", {
        invoiceNumber: input.invoice.invoiceNumber,
      });
      return;
    }
    await sendEmail({
      to: input.to,
      subject: `Payment Receipt · Invoice ${input.invoice.invoiceNumber}`,
      html: buildHtml(input),
    });
  } catch (err) {
    logger.error("Invoice email failed", {
      invoiceNumber: input.invoice.invoiceNumber,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
