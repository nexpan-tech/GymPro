import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

type AuthUser = {
  id: string;
  role: string;
  gymId: string | null;
};

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function addYears(date: Date, years: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function generateInvoiceNumber() {
  return `INV-${Date.now()}`;
}

export class BillingService {
  static async createPlan(data: any) {
    return prisma.saaSPlan.create({
      data: {
        name: data.name,
        description: data.description,
        interval: data.interval,
        price: data.price,
        maxBranches: data.maxBranches,
        maxMembers: data.maxMembers,
        maxStaff: data.maxStaff,
      },
    });
  }

  static async getPlans() {
    return prisma.saaSPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });
  }

  static async subscribeGym(user: AuthUser, data: any) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const plan = await prisma.saaSPlan.findFirst({
      where: {
        id: data.planId,
        isActive: true,
      },
    });

    if (!plan) throw new AppError("SaaS plan not found", 404);

    const startDate = new Date();
    const endDate =
      plan.interval === "YEARLY"
        ? addYears(startDate, 1)
        : addMonths(startDate, 1);

    const subscription = await prisma.gymSubscription.create({
      data: {
        gymId: user.gymId,
        planId: plan.id,
        status: "ACTIVE",
        startDate,
        endDate,
        autoRenew: data.autoRenew ?? true,
      },
      include: {
        plan: true,
      },
    });

    const gstAmount = Number((plan.price * 0.18).toFixed(2));
    const totalAmount = Number((plan.price + gstAmount).toFixed(2));

    const invoice = await prisma.saaSInvoice.create({
      data: {
        gymId: user.gymId,
        subscriptionId: subscription.id,
        invoiceNumber: generateInvoiceNumber(),
        amount: plan.price,
        gstAmount,
        totalAmount,
        status: "ISSUED",
        dueDate: endDate,
      },
    });

    return {
      subscription,
      invoice,
    };
  }

  static async getMySubscription(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    return prisma.gymSubscription.findFirst({
      where: { gymId: user.gymId },
      include: {
        plan: true,
        invoices: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getInvoices(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    return prisma.saaSInvoice.findMany({
      where: { gymId: user.gymId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async markInvoicePaid(user: AuthUser, invoiceId: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const invoice = await prisma.saaSInvoice.findFirst({
      where: {
        id: invoiceId,
        gymId: user.gymId,
      },
    });

    if (!invoice) throw new AppError("Invoice not found", 404);

    return prisma.saaSInvoice.update({
      where: { id: invoiceId },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });
  }

  static async markInvoiceFailed(user: AuthUser, invoiceId: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const invoice = await prisma.saaSInvoice.findFirst({
      where: {
        id: invoiceId,
        gymId: user.gymId,
      },
    });

    if (!invoice) throw new AppError("Invoice not found", 404);

    return prisma.saaSInvoice.update({
      where: { id: invoiceId },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        retryCount: invoice.retryCount + 1,
        lastRetryAt: new Date(),
      },
    });
  }

  static async failedPaymentRecovery(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const failedInvoices = await prisma.saaSInvoice.findMany({
      where: {
        gymId: user.gymId,
        status: "FAILED",
      },
    });

    const recoveryQueue = failedInvoices.map((invoice: any) => ({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      retryCount: invoice.retryCount,
      nextAction:
        invoice.retryCount >= 3
          ? "ESCALATE_TO_ADMIN"
          : "RETRY_PAYMENT_AND_SEND_REMINDER",
    }));

    return {
      failedCount: failedInvoices.length,
      recoveryQueue,
    };
  }
}