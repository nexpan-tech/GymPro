import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import { getPaymentGateway } from "./gateways";
import { InvoiceService } from "../invoice/invoice.service";
import { sendInvoiceEmail } from "../invoice/invoiceEmail.service";

type AuthUser = { id: string; role: string; gymId: string | null };

async function resolveMember(user: AuthUser, memberId?: string) {
  if (!user.gymId) throw new AppError("Gym context missing", 403);
  if (user.role === "MEMBER") {
    const m = await prisma.member.findFirst({
      where: { userId: user.id, gymId: user.gymId },
      include: { user: true },
    });
    if (!m) throw new AppError("Member profile not found", 404);
    return m;
  }
  if (!memberId) throw new AppError("memberId is required", 400);
  const m = await prisma.member.findFirst({
    where: { id: memberId, gymId: user.gymId },
    include: { user: true },
  });
  if (!m) throw new AppError("Member not found in this gym", 404);
  return m;
}

export const PaymentCheckoutService = {
  /**
   * Start a gateway checkout: creates a PENDING Payment + a gateway order the
   * client uses to open Razorpay checkout.
   */
  async createOrder(
    user: AuthUser,
    payload: { amount: number; membershipId?: string; memberId?: string },
  ) {
    const member = await resolveMember(user, payload.memberId);
    const amount = Number(payload.amount);
    if (!amount || amount <= 0) throw new AppError("Amount must be greater than zero", 400);

    const gateway = getPaymentGateway();
    const order = await gateway.createOrder({
      amountInPaise: Math.round(amount * 100),
      receipt: `gym_${user.gymId}_mem_${member.id}_${Date.now()}`,
      notes: { gymId: user.gymId!, memberId: member.id },
    });

    const payment = await prisma.payment.create({
      data: {
        gymId: user.gymId!,
        memberId: member.id,
        membershipId: payload.membershipId,
        amount,
        method: gateway.name,
        status: "PENDING",
        gateway: gateway.name,
        gatewayOrderId: order.orderId,
      },
    });

    return { order, paymentId: payment.id };
  },

  /**
   * Verify the checkout handshake signature, mark the payment PAID, activate the
   * linked membership, and generate a GST invoice — all in one transaction.
   */
  async verifyPayment(
    user: AuthUser,
    payload: { orderId: string; paymentId: string; signature: string },
  ) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const payment = await prisma.payment.findFirst({
      where: { gymId: user.gymId, gatewayOrderId: payload.orderId },
      include: { member: { include: { user: true } } },
    });
    if (!payment) throw new AppError("Payment order not found", 404);

    const gateway = getPaymentGateway(payment.gateway ?? undefined);
    const valid = gateway.verifyPayment({
      orderId: payload.orderId,
      paymentId: payload.paymentId,
      signature: payload.signature,
    });
    if (!valid) throw new AppError("Payment signature verification failed", 400);

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: { status: "PAID", paidAt: new Date(), gatewayPaymentId: payload.paymentId },
      });

      if (payment.membershipId) {
        await tx.membership.updateMany({
          where: { id: payment.membershipId, gymId: user.gymId! },
          data: { paymentStatus: "PAID" },
        });
      }

      const invoice = await InvoiceService.generate(
        {
          gymId: user.gymId!,
          memberId: payment.memberId,
          membershipId: payment.membershipId ?? undefined,
          paymentId: payment.id,
          amount: payment.amount,
          customerName: payment.member.user?.name ?? "Member",
          status: "PAID",
        },
        tx as never,
      );

      return { payment: updated, invoice };
    });

    // Best-effort invoice email (post-commit so a mail failure never rolls back).
    await sendInvoiceEmail({
      to: payment.member.user?.email,
      memberName: payment.member.user?.name ?? "Member",
      invoice: result.invoice,
    });

    return result;
  },
};

/**
 * Webhook event processor. Idempotently reconciles a gateway event with our
 * Payment + generates an invoice on capture. Called after signature verification.
 */
export async function processWebhookEvent(event: string, payloadEntity: {
  order_id?: string;
  id?: string;
}) {
  const orderId = payloadEntity.order_id;
  if (!orderId) return { handled: false };

  const payment = await prisma.payment.findFirst({
    where: { gatewayOrderId: orderId },
    include: { member: { include: { user: true } } },
  });
  if (!payment) return { handled: false };

  if (event === "payment.captured" && payment.status !== "PAID") {
    const generatedInvoice = await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "PAID", paidAt: new Date(), gatewayPaymentId: payloadEntity.id },
      });
      if (payment.membershipId) {
        await tx.membership.updateMany({
          where: { id: payment.membershipId },
          data: { paymentStatus: "PAID" },
        });
      }
      const existing = await tx.invoice.findFirst({ where: { paymentId: payment.id } });
      if (existing) return null;
      return InvoiceService.generate(
        {
          gymId: payment.gymId,
          memberId: payment.memberId,
          membershipId: payment.membershipId ?? undefined,
          paymentId: payment.id,
          amount: payment.amount,
          customerName: payment.member.user?.name ?? "Member",
          status: "PAID",
        },
        tx as never,
      );
    });

    if (generatedInvoice) {
      await sendInvoiceEmail({
        to: payment.member.user?.email,
        memberName: payment.member.user?.name ?? "Member",
        invoice: generatedInvoice,
      });
    }
    return { handled: true };
  }

  if (event === "payment.failed" && payment.status === "PENDING") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "OVERDUE" },
    });
    return { handled: true };
  }

  return { handled: false };
}
