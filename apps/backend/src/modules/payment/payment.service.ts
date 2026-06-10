import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import { InvoiceService } from "../invoice/invoice.service";
import { sendInvoiceEmail } from "../invoice/invoiceEmail.service";
import { emitToGym } from "../../realtime/socket";
import { SOCKET_EVENTS } from "../../realtime/socket-events";

type PaymentStatus = "PAID" | "PENDING" | "OVERDUE";
type DueStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "WAIVED";

export const createPayment = async (gymId: string, payload: any) => {
  const member = await prisma.member.findFirst({
    where: {
      id: payload.memberId,
      gymId,
    },
    include: { user: true },
  });

  if (!member) {
    throw new AppError("Member not found in this gym", 404);
  }

  const { payment, invoice } = await prisma.$transaction(async (tx) => {
    const status: PaymentStatus = (payload.status as PaymentStatus) || "PAID";
    const payment = await tx.payment.create({
      data: {
        gymId,
        memberId: payload.memberId,
        membershipId: payload.membershipId ?? undefined,
        amount: Number(payload.amount),
        method: payload.method,
        status,
        gateway: "MANUAL",
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
    });

    // Generate a GST invoice for fully-paid, non-due (i.e. membership/one-off)
    // payments. Partial due settlements are tracked on the Due, not invoiced here.
    let invoice = null;
    if (status === "PAID" && !payload.dueId) {
      invoice = await InvoiceService.generate(
        {
          gymId,
          memberId: payload.memberId,
          membershipId: payload.membershipId ?? undefined,
          paymentId: payment.id,
          amount: Number(payload.amount),
          customerName: member.user?.name ?? "Member",
          status: "PAID",
        },
        tx as never,
      );
    }

    if (payload.dueId) {
      const due = await tx.due.findFirst({
        where: {
          id: payload.dueId,
          gymId,
          memberId: payload.memberId,
        },
      });

      if (!due) {
        throw new AppError("Due not found for this member", 404);
      }

      if (due.status === "WAIVED") {
        throw new AppError("Cannot pay a waived due", 400);
      }

      if (due.status === "PAID") {
        throw new AppError("Due is already fully paid", 400);
      }

      const paymentAmount = Number(payload.amount);

      if (!paymentAmount || paymentAmount <= 0) {
        throw new AppError("Payment amount must be greater than zero", 400);
      }

      const paidAmount = due.paidAmount + paymentAmount;
      const balance = Math.max(due.amount - paidAmount, 0);

      const status: DueStatus =
        balance === 0
          ? "PAID"
          : paidAmount > 0
            ? "PARTIAL"
            : "PENDING";

      await tx.due.update({
        where: {
          id: due.id,
        },
        data: {
          paidAmount,
          balance,
          status,
          paidAt: status === "PAID" ? new Date() : null,
        },
      });
    }

    return { payment, invoice };
  });

  // Best-effort invoice email, sent post-commit so mail issues never roll back.
  if (invoice) {
    await sendInvoiceEmail({
      to: payment.member.user?.email,
      memberName: payment.member.user?.name ?? "Member",
      invoice,
    });
  }

  // Stage 9 — realtime payment update for admin dashboards.
  emitToGym(gymId, SOCKET_EVENTS.PAYMENT_UPDATED, { paymentId: payment.id, memberId: payload.memberId, amount: payment.amount, status: payment.status });

  return payment;
};

export const getPayments = async (gymId: string) => {
  return prisma.payment.findMany({
    where: {
      gymId,
    },
    include: {
      member: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

// Member self-service — the caller's own payment history.
export const getMyPayments = async (gymId: string, userId: string) => {
  const member = await prisma.member.findFirst({
    where: { userId, gymId },
  });
  if (!member) return [];

  return prisma.payment.findMany({
    where: { gymId, memberId: member.id },
    include: {
      member: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getPaymentById = async (gymId: string, id: string) => {
  const payment = await prisma.payment.findFirst({
    where: {
      id,
      gymId,
    },
    include: {
      member: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  return payment;
};

export const deletePayment = async (gymId: string, id: string) => {
  const payment = await prisma.payment.findFirst({
    where: {
      id,
      gymId,
    },
  });

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  return prisma.payment.delete({
    where: {
      id,
    },
  });
};