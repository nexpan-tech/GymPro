import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

type PaymentStatus = "PAID" | "PENDING" | "OVERDUE";

export const createPayment = async (
  gymId: string,
  payload: any
) => {
  const member = await prisma.member.findFirst({
    where: {
      id: payload.memberId,
      gymId,
    },
  });

  if (!member) {
    throw new AppError("Member not found in this gym", 404);
  }

  return prisma.payment.create({
    data: {
      gymId,
      memberId: payload.memberId,
      amount: payload.amount,
      method: payload.method,
      status: (payload.status as PaymentStatus) || "PAID",
    },
    include: {
      member: {
        include: {
          user: true,
        },
      },
    },
  });
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

export const getPaymentById = async (
  gymId: string,
  id: string
) => {
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

export const deletePayment = async (
  gymId: string,
  id: string
) => {
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