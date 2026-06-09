import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

type AuthUser = { id: string; role: string; gymId: string | null };

// Minimal prisma-like surface so this works inside a $transaction too.
type Db = {
  invoice: { create: Function; count: Function; findMany: Function; findFirst: Function };
  gym: { findUnique: Function };
  member: { findFirst: Function };
};

export interface GstBreakdown {
  subtotal: number;
  gstPercent: number;
  cgst: number;
  sgst: number;
  igst: number;
  gstAmount: number;
  totalAmount: number;
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Treats `total` as the GROSS amount the member pays (GST-inclusive) so the
 * invoice total always equals the payment amount. Splits CGST+SGST for
 * intra-state, IGST for inter-state.
 */
export function computeGst(total: number, gstPercent: number, interState = false): GstBreakdown {
  const pct = gstPercent || 0;
  const subtotal = round(total / (1 + pct / 100));
  const gstAmount = round(total - subtotal);
  if (interState) {
    return { subtotal, gstPercent: pct, cgst: 0, sgst: 0, igst: gstAmount, gstAmount, totalAmount: round(total) };
  }
  const half = round(gstAmount / 2);
  return { subtotal, gstPercent: pct, cgst: half, sgst: round(gstAmount - half), igst: 0, gstAmount, totalAmount: round(total) };
}

export interface GenerateInvoiceInput {
  gymId: string;
  memberId: string;
  amount: number; // gross / total
  membershipId?: string;
  paymentId?: string;
  customerName: string;
  customerGST?: string;
  customerStateCode?: string;
  status?: "ISSUED" | "PAID";
}

export class InvoiceService {
  /** Per-gym sequential, globally-unique invoice number. */
  static async nextInvoiceNumber(db: Db, gymId: string) {
    const count = await db.invoice.count({ where: { gymId } });
    const seq = String(count + 1).padStart(5, "0");
    return `INV-${gymId.slice(-6).toUpperCase()}-${seq}`;
  }

  /**
   * Create a member invoice with GST. Can run inside a transaction (pass tx as db).
   * GST % + gym state come from the Gym record.
   */
  static async generate(input: GenerateInvoiceInput, db: Db = prisma as unknown as Db) {
    const gym = await db.gym.findUnique({ where: { id: input.gymId } });
    if (!gym) throw new AppError("Gym not found", 404);

    const interState = Boolean(
      gym.stateCode && input.customerStateCode && gym.stateCode !== input.customerStateCode,
    );
    const gst = computeGst(input.amount, gym.gstPercent ?? 0, interState);
    const invoiceNumber = await this.nextInvoiceNumber(db, input.gymId);

    return db.invoice.create({
      data: {
        gymId: input.gymId,
        memberId: input.memberId,
        membershipId: input.membershipId,
        paymentId: input.paymentId,
        invoiceNumber,
        customerName: input.customerName,
        customerGST: input.customerGST,
        subtotal: gst.subtotal,
        gstPercent: gst.gstPercent,
        cgst: gst.cgst,
        sgst: gst.sgst,
        igst: gst.igst,
        gstAmount: gst.gstAmount,
        totalAmount: gst.totalAmount,
        status: input.status ?? "ISSUED",
      },
    });
  }

  // ── Read APIs ───────────────────────────────────────────────────────────────
  static async listForGym(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    return prisma.invoice.findMany({
      where: { gymId: user.gymId },
      include: { member: { include: { user: true } } },
      orderBy: { invoiceDate: "desc" },
    });
  }

  static async listMine(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const member = await prisma.member.findFirst({
      where: { userId: user.id, gymId: user.gymId },
    });
    if (!member) throw new AppError("Member profile not found", 404);
    return prisma.invoice.findMany({
      where: { gymId: user.gymId, memberId: member.id },
      orderBy: { invoiceDate: "desc" },
    });
  }

  static async getById(user: AuthUser, id: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const invoice = await prisma.invoice.findFirst({
      where: { id, gymId: user.gymId },
      include: { member: { include: { user: true } }, payment: true },
    });
    if (!invoice) throw new AppError("Invoice not found", 404);
    if (user.role === "MEMBER" && invoice.member.userId !== user.id) {
      throw new AppError("You can only access your own invoices", 403);
    }
    return invoice;
  }
}
