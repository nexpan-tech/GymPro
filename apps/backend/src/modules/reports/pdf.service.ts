import PDFDocument from "pdfkit";

/** Stage-refinement — structured monthly gym report (sections of label/value). */
export function generateMonthlySummaryPdf(input: {
  gymName: string;
  month: string; // e.g. "June 2026"
  sections: { heading: string; items: { label: string; value: string | number }[] }[];
}) {
  return new Promise<Buffer>((resolve) => {
    const doc = new PDFDocument({ margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(22).fillColor("#002F49").text(input.gymName, { align: "center" });
    doc.moveDown(0.2);
    doc.fontSize(14).fillColor("#C1121F").text(`Monthly Report — ${input.month}`, { align: "center" });
    doc.moveDown(0.2);
    doc.fontSize(9).fillColor("#666666").text(`Generated ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown(1.2);

    for (const section of input.sections) {
      doc.fontSize(13).fillColor("#002F49").text(section.heading);
      doc.moveTo(48, doc.y + 2).lineTo(547, doc.y + 2).strokeColor("#C1121F").stroke();
      doc.moveDown(0.6);
      for (const item of section.items) {
        const y = doc.y;
        doc.fontSize(10).fillColor("#333333").text(item.label, 56, y, { width: 320 });
        doc.fontSize(10).fillColor("#111111").text(String(item.value), 380, y, { width: 167, align: "right" });
        doc.moveDown(0.4);
      }
      doc.moveDown(0.8);
    }

    doc.end();
  });
}

/**
 * Stage 12 — professional, GST-compliant SaaS invoice PDF (Nexpan Tech → Gym).
 * Reads the platform billing identity from `seller` (the invoice's frozen
 * snapshot, so historical PDFs never change) and the gym from `gym`.
 * Uses "Rs." rather than the ₹ glyph (not in pdfkit's standard fonts).
 */
export function generateSaaSInvoicePdf(
  invoice: any,
  seller: Record<string, any>,
  gym: { name?: string | null; email?: string | null; address?: string | null; gstNumber?: string | null } | null | undefined,
) {
  return new Promise<Buffer>((resolve) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const RED = "#E73725", BLACK = "#010000", GRAY = "#666666", LINE = "#E1E1E1";
    const rs = (n: any) => `Rs. ${Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    const X = 48, R = 547, W = R - X;

    // ── Header: seller identity + TAX INVOICE ──
    doc.fontSize(22).fillColor(BLACK).text(seller.companyName ?? "Nexpan Tech", X, 48, { continued: false });
    doc.fontSize(9).fillColor(GRAY);
    if (seller.companyAddress) doc.text(String(seller.companyAddress), X);
    const contact = [seller.companyEmail, seller.companyPhone, seller.companyWebsite].filter(Boolean).join("  ·  ");
    if (contact) doc.text(contact, X);
    const tax = [
      seller.gstNumber && `GSTIN: ${seller.gstNumber}`,
      seller.panNumber && `PAN: ${seller.panNumber}`,
      seller.cinNumber && `CIN: ${seller.cinNumber}`,
    ].filter(Boolean).join("   |   ");
    if (tax) doc.text(tax, X);
    doc.fontSize(16).fillColor(RED).text("TAX INVOICE", 360, 52, { width: W - 312, align: "right" });

    let y = doc.y + 10;
    doc.moveTo(X, y).lineTo(R, y).lineWidth(2).strokeColor(RED).stroke();
    y += 18;

    // ── Bill-to + invoice meta ──
    const top = y;
    doc.fontSize(11).fillColor(BLACK).text("Billed To", X, top);
    doc.fontSize(9).fillColor(GRAY);
    doc.text(gym?.name ?? "—", X);
    if (gym?.email) doc.text(gym.email, X);
    if (gym?.address) doc.text(gym.address, X);
    if (gym?.gstNumber) doc.text(`GSTIN: ${gym.gstNumber}`, X);

    const meta: [string, string][] = [
      ["Invoice #", invoice.invoiceNumber ?? "—"],
      ["Billing Month", invoice.billingMonth ?? "—"],
      ["Issue Date", new Date(invoice.createdAt ?? Date.now()).toLocaleDateString("en-IN")],
      ["Due Date", new Date(invoice.dueDate).toLocaleDateString("en-IN")],
    ];
    let my = top;
    for (const [k, v] of meta) {
      doc.fontSize(9).fillColor(GRAY).text(k, 340, my, { width: 90 });
      doc.fillColor(BLACK).text(v, 432, my, { width: 115, align: "right" });
      my += 15;
    }

    y = Math.max(doc.y, my) + 18;

    // ── Calculation table ──
    doc.rect(X, y, W, 22).fill(RED);
    doc.fillColor("#FFFFFF").fontSize(10).text("Description", X + 8, y + 6);
    doc.text("Amount", R - 140, y + 6, { width: 132, align: "right" });
    y += 22;
    const rows: [string, string][] = [
      ["Active Members", String(invoice.activeMemberCount ?? "—")],
      ["Price / Active Member / Month", rs(invoice.pricePerMember)],
      ["Subtotal", rs(invoice.amount)],
      [`GST (${invoice.gstPercent ?? 0}%)`, rs(invoice.gstAmount)],
    ];
    for (const [label, val] of rows) {
      doc.fillColor(BLACK).fontSize(10).text(label, X + 8, y + 6, { width: W - 160 });
      doc.text(val, R - 140, y + 6, { width: 132, align: "right" });
      doc.moveTo(X, y + 22).lineTo(R, y + 22).lineWidth(0.5).strokeColor(LINE).stroke();
      y += 24;
    }
    doc.rect(X, y, W, 26).fillAndStroke("#F4F4F4", LINE);
    doc.fillColor(BLACK).fontSize(12).text("Total Payable", X + 8, y + 7);
    doc.fillColor(RED).fontSize(12).text(rs(invoice.totalAmount), R - 160, y + 7, { width: 152, align: "right" });
    y += 42;

    // ── Bank / payment details ──
    const bank = [
      seller.accountName && `A/c Name: ${seller.accountName}`,
      seller.accountNumber && `A/c No: ${seller.accountNumber}`,
      seller.bankName && `Bank: ${seller.bankName}`,
      seller.ifscCode && `IFSC: ${seller.ifscCode}`,
      seller.upiId && `UPI: ${seller.upiId}`,
    ].filter(Boolean) as string[];
    if (bank.length) {
      doc.fontSize(10).fillColor(BLACK).text("Payment Details", X, y);
      doc.fontSize(9).fillColor(GRAY);
      bank.forEach((b) => doc.text(b, X));
    }
    if (seller.paymentTerms) doc.fontSize(9).fillColor(GRAY).text(`Terms: ${seller.paymentTerms}`, X, doc.y + 4);

    // ── Footer ──
    doc.fontSize(9).fillColor(GRAY).text(
      seller.invoiceFooter ?? "Thank you for your business. For support contact support@nexpan.in",
      X, 770, { align: "center", width: W },
    );

    doc.end();
  });
}

export function generateSimplePdfReport(input: {
  title: string;
  subtitle?: string;
  rows: Record<string, any>[];
}) {
  return new Promise<Buffer>((resolve) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(20).text(input.title, { align: "center" });

    if (input.subtitle) {
      doc.moveDown(0.5);
      doc.fontSize(11).text(input.subtitle, { align: "center" });
    }

    doc.moveDown();

    doc.fontSize(10).text(`Generated At: ${new Date().toLocaleString()}`);
    doc.moveDown();

    if (input.rows.length === 0) {
      doc.text("No data available.");
      doc.end();
      return;
    }

    input.rows.forEach((row, index) => {
      doc.fontSize(12).text(`${index + 1}. Report Item`, { underline: true });

      Object.entries(row).forEach(([key, value]) => {
        doc.fontSize(10).text(`${key}: ${value ?? ""}`);
      });

      doc.moveDown();
    });

    doc.end();
  });
}