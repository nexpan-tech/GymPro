import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import { generateSimplePdfReport } from "./pdf.service";

type AuthUser = {
  id: string;
  role: string;
  gymId: string | null;
};

function toCsv(rows: Record<string, any>[]) {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);

  const escape = (value: any) => {
    if (value === null || value === undefined) return "";
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ].join("\n");
}

export class ReportsService {
  static async revenueReport(user: AuthUser, format: "json" | "csv" | "pdf" = "json") {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const payments = await prisma.payment.findMany({
      where: { gymId: user.gymId },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        paidAt: "desc",
      },
    });

    const rows = payments.map((payment) => ({
      paymentId: payment.id,
      memberName: payment.member.user.name,
      memberEmail: payment.member.user.email,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      paidAt: payment.paidAt.toISOString(),
    }));

    if (format === "csv") {
      return {
        format,
        filename: "revenue-report.csv",
        content: toCsv(rows),
      };
    }

    if (format === "pdf") {
        return {
            format,
            filename: "revenue-report.pdf",
            content: await generateSimplePdfReport({
            title: "GymPro Revenue Report",
            subtitle: "Payment and revenue summary",
            rows,
            }),
        };
        }

    return {
      format,
      total: rows.length,
      data: rows,
    };
  }

  static async attendanceReport(user: AuthUser, format: "json" | "csv" | "pdf"  = "json") {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const attendances = await prisma.attendance.findMany({
      where: { gymId: user.gymId },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        checkInAt: "desc",
      },
    });

    const rows = attendances.map((attendance) => ({
      attendanceId: attendance.id,
      memberName: attendance.member.user.name,
      memberEmail: attendance.member.user.email,
      date: attendance.date.toISOString(),
      checkInAt: attendance.checkInAt.toISOString(),
    }));

    if (format === "csv") {
      return {
        format,
        filename: "attendance-report.csv",
        content: toCsv(rows),
      };
    }

    return {
      format,
      total: rows.length,
      data: rows,
    };
  }

  static async memberReport(user: AuthUser, format: "json" | "csv" | "pdf" = "json") {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const members = await prisma.member.findMany({
      where: { gymId: user.gymId },
      include: {
        user: true,
        trainer: true,
        memberships: {
          orderBy: {
            endDate: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const rows = members.map((member) => ({
      memberId: member.id,
      name: member.user.name,
      email: member.user.email,
      phone: member.phone,
      gender: member.gender,
      fitnessGoal: member.fitnessGoal,
      trainerName: member.trainer?.name || "",
      latestMembershipPlan: member.memberships[0]?.plan || "",
      latestMembershipEndDate: member.memberships[0]?.endDate?.toISOString() || "",
      createdAt: member.createdAt.toISOString(),
    }));

    if (format === "csv") {
      return {
        format,
        filename: "member-report.csv",
        content: toCsv(rows),
      };
    }

    return {
      format,
      total: rows.length,
      data: rows,
    };
  }

  static async churnReport(user: AuthUser, format: "json" | "csv" | "pdf" = "json") {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const members = await prisma.member.findMany({
      where: { gymId: user.gymId },
      include: {
        user: true,
        dues: true,
        attendances: {
          orderBy: { date: "desc" },
          take: 1,
        },
        memberships: {
          orderBy: {
            endDate: "desc",
          },
          take: 1,
        },
      },
    });

    const today = new Date();

    const rows = members.map((member) => {
      const lastAttendance = member.attendances[0];
      const daysInactive = lastAttendance
        ? Math.floor(
            (today.getTime() - lastAttendance.date.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 999;

      const pendingDue = member.dues.reduce(
        (sum, due) => sum + Number(due.balance || 0),
        0
      );

      const membershipExpired =
        member.memberships[0] && member.memberships[0].endDate < today;

      let churnScore = 0;
      if (daysInactive >= 30) churnScore += 45;
      else if (daysInactive >= 14) churnScore += 30;
      else if (daysInactive >= 7) churnScore += 15;

      if (pendingDue > 0) churnScore += 25;
      if (membershipExpired) churnScore += 30;

      return {
        memberId: member.id,
        name: member.user.name,
        email: member.user.email,
        daysInactive,
        pendingDue,
        membershipExpired: Boolean(membershipExpired),
        churnScore,
        churnLevel: churnScore >= 70 ? "HIGH" : churnScore >= 40 ? "MEDIUM" : "LOW",
        renewalProbability: Math.max(0, 100 - churnScore),
      };
    });

    if (format === "csv") {
      return {
        format,
        filename: "churn-report.csv",
        content: toCsv(rows),
      };
    }

    return {
      format,
      total: rows.length,
      data: rows,
    };
  }
}

