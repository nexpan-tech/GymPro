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