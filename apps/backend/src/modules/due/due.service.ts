import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";

type DueStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "WAIVED";

export class DueService {
  static async create(gymId: string, data: any) {
    const member = await prisma.member.findFirst({
      where: { id: data.memberId, gymId },
    });

    if (!member) {
      throw new AppError("Member not found in this gym", 404);
    }

    return prisma.due.create({
      data: {
        gymId,
        memberId: data.memberId,
        membershipId: data.membershipId,
        amount: data.amount,
        paidAmount: data.paidAmount || 0,
        balance: data.amount - (data.paidAmount || 0),
        status: data.status || "PENDING",
        dueDate: new Date(data.dueDate),
        notes: data.notes,
      },
      include: {
        member: { include: { user: true } },
        membership: true,
      },
    });
  }

  static async getAll(gymId: string, status?: DueStatus) {
    return prisma.due.findMany({
      where: {
        gymId,
        ...(status ? { status } : {}),
      },
      include: {
        member: { include: { user: true } },
        membership: true,
      },
      orderBy: { dueDate: "asc" },
    });
  }

  static async getSummary(gymId: string) {
  const dues = await prisma.due.findMany({
    where: {
      gymId,
      status: {
        not: "WAIVED",
      },
    },
  });

  const totalDue = dues.reduce(
    (sum, due) => sum + Number(due.balance || 0),
    0
  );

  const overdueDue = dues
    .filter((due) => due.status === "OVERDUE")
    .reduce((sum, due) => sum + Number(due.balance || 0), 0);

  return {
    totalDues: dues.length,
    totalDue,
    overdueDue,
    pendingCount: dues.filter((due) => due.status === "PENDING").length,
    partialCount: dues.filter((due) => due.status === "PARTIAL").length,
    overdueCount: dues.filter((due) => due.status === "OVERDUE").length,
    paidCount: dues.filter((due) => due.status === "PAID").length,
  };
}

  static async markPaid(gymId: string, id: string, amount: number) {
    const due = await prisma.due.findFirst({
      where: { id, gymId },
    });

    if (!due) {
      throw new AppError("Due not found", 404);
    }

    const paidAmount = due.paidAmount + amount;
    const balance = Math.max(due.amount - paidAmount, 0);

    const status: DueStatus =
      balance === 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "PENDING";

    return prisma.due.update({
      where: { id },
      data: {
        paidAmount,
        balance,
        status,
        paidAt: status === "PAID" ? new Date() : null,
      },
      include: {
        member: { include: { user: true } },
        membership: true,
      },
    });
  }

  static async markOverdue(gymId: string) {
    return prisma.due.updateMany({
      where: {
        gymId,
        status: { in: ["PENDING", "PARTIAL"] },
        dueDate: { lt: new Date() },
        balance: { gt: 0 },
      },
      data: {
        status: "OVERDUE",
      },
    });
  }

  static async waive(gymId: string, id: string) {
    const due = await prisma.due.findFirst({
      where: { id, gymId },
    });

    if (!due) {
      throw new AppError("Due not found", 404);
    }

    return prisma.due.update({
      where: { id },
      data: {
        status: "WAIVED",
        balance: 0,
      },
    });
  }

  static async getPendingDues(gymId: string) {
  return prisma.due.findMany({
    where: {
      gymId,
      status: {
        in: ["PENDING", "PARTIAL"],
      },
      balance: {
        gt: 0,
      },
    },
    include: {
      member: {
        include: {
          user: true,
        },
      },
      membership: true,
    },
    orderBy: {
      dueDate: "asc",
    },
  });
}

static async getOverdueDues(gymId: string) {
  return prisma.due.findMany({
    where: {
      gymId,
      status: "OVERDUE",
      balance: {
        gt: 0,
      },
    },
    include: {
      member: {
        include: {
          user: true,
        },
      },
      membership: true,
    },
    orderBy: {
      dueDate: "asc",
    },
  });
}

static async getCollectionDashboard(gymId: string) {
  const dues = await prisma.due.findMany({
    where: {
      gymId,
      status: {
        not: "WAIVED",
      },
    },
    include: {
      member: {
        include: {
          user: true,
        },
      },
    },
  });

  const totalReceivable = dues.reduce(
    (sum, due) => sum + Number(due.amount || 0),
    0
  );

  const totalCollected = dues.reduce(
    (sum, due) => sum + Number(due.paidAmount || 0),
    0
  );

  const totalOutstanding = dues.reduce(
    (sum, due) => sum + Number(due.balance || 0),
    0
  );

  const overdueAmount = dues
    .filter((due) => due.status === "OVERDUE")
    .reduce((sum, due) => sum + Number(due.balance || 0), 0);

  const pendingAmount = dues
    .filter((due) => due.status === "PENDING" || due.status === "PARTIAL")
    .reduce((sum, due) => sum + Number(due.balance || 0), 0);

  return {
    totalReceivable,
    totalCollected,
    totalOutstanding,
    overdueAmount,
    pendingAmount,
    totalDues: dues.length,
    pendingDues: dues.filter((due) => due.status === "PENDING").length,
    partialDues: dues.filter((due) => due.status === "PARTIAL").length,
    overdueDues: dues.filter((due) => due.status === "OVERDUE").length,
    paidDues: dues.filter((due) => due.status === "PAID").length,
    collectionRate:
      totalReceivable > 0
        ? Number(((totalCollected / totalReceivable) * 100).toFixed(2))
        : 0,
  };
}
   static async getOverdueAgingReport(gymId: string) {
  const today = new Date();

  const overdueDues = await prisma.due.findMany({
    where: {
      gymId,
      status: "OVERDUE",
      balance: {
        gt: 0,
      },
    },
    include: {
      member: {
        include: {
          user: true,
        },
      },
      membership: true,
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  const buckets = {
    oneToSevenDays: {
      count: 0,
      amount: 0,
    },
    eightToFifteenDays: {
      count: 0,
      amount: 0,
    },
    sixteenToThirtyDays: {
      count: 0,
      amount: 0,
    },
    aboveThirtyDays: {
      count: 0,
      amount: 0,
    },
  };

  const dues = overdueDues.map((due) => {
    const diffMs = today.getTime() - due.dueDate.getTime();
    const daysOverdue = Math.max(
      0,
      Math.floor(diffMs / (1000 * 60 * 60 * 24))
    );

    const balance = Number(due.balance || 0);

    if (daysOverdue <= 7) {
      buckets.oneToSevenDays.count += 1;
      buckets.oneToSevenDays.amount += balance;
    } else if (daysOverdue <= 15) {
      buckets.eightToFifteenDays.count += 1;
      buckets.eightToFifteenDays.amount += balance;
    } else if (daysOverdue <= 30) {
      buckets.sixteenToThirtyDays.count += 1;
      buckets.sixteenToThirtyDays.amount += balance;
    } else {
      buckets.aboveThirtyDays.count += 1;
      buckets.aboveThirtyDays.amount += balance;
    }

    return {
      ...due,
      daysOverdue,
    };
  });

  return {
    totalOverdue: dues.length,
    totalOverdueAmount: dues.reduce(
      (sum, due) => sum + Number(due.balance || 0),
      0
    ),
    buckets,
    dues,
  };
}

}