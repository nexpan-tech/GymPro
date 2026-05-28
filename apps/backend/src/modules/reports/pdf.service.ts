import PDFDocument from "pdfkit";

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