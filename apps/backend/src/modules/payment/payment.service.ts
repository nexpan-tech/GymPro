import { PaymentStatus } from "@prisma/client";
import { prisma } from "../../config/db";

export const createPayment = async (gymId: string, payload: any) => {
  return prisma.payment.create({
    data: {
      gymId,
      memberId: payload.memberId,
      amount: payload.amount,
      method: payload.method,
      status: (payload.status as PaymentStatus) ?? PaymentStatus.PAID,
    },
  });
};

export const getPayments = async (gymId: string) => {
  return prisma.payment.findMany({
    where: { gymId },
    include: {
      member: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getPaymentById = async (gymId: string, id: string) => {
  return prisma.payment.findFirst({
    where: { id, gymId },
    include: {
      member: {
        include: {
          user: true,
        },
      },
    },
  });
};