import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import { generateSimplePdfReport, generateMonthlySummaryPdf } from "./pdf.service";

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

  /**
   * Monthly gym report — aggregates every section from existing data for the
   * given YYYY-MM. Returns structured JSON, or a PDF when format === "pdf".
   */
  static async monthlyReport(user: AuthUser, monthStr?: string, format: "json" | "pdf" = "json") {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const gymId = user.gymId;

    const now = new Date();
    const [y, m] = (monthStr || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
      .split("-").map(Number);
    const start = new Date(y, (m || 1) - 1, 1);
    const end = new Date(y, (m || 1), 1);
    const inMonth = { gte: start, lt: end };

    const [gym, members, memberships, payments, dues, attendance, workouts, diets, leads, trainerMsgs, redemptions, referrals, riskRows, challengeParts] =
      await Promise.all([
        prisma.gym.findUnique({ where: { id: gymId }, select: { name: true } }),
        prisma.member.findMany({ where: { gymId }, select: { createdAt: true } }),
        prisma.membership.findMany({ where: { gymId }, select: { endDate: true, createdAt: true, renewedFromId: true } }),
        prisma.payment.findMany({ where: { gymId, status: "PAID", paidAt: inMonth }, select: { amount: true } }),
        prisma.due.findMany({ where: { gymId }, select: { balance: true } }),
        prisma.attendance.count({ where: { gymId, date: inMonth } }),
        prisma.workoutCompletion.count({ where: { gymId, createdAt: inMonth } }),
        prisma.dietCompletion.count({ where: { gymId, createdAt: inMonth } }),
        prisma.lead.findMany({ where: { gymId }, select: { status: true, createdAt: true, convertedAt: true } }),
        prisma.trainerMessage.count({ where: { gymId, createdAt: inMonth } }),
        prisma.rewardRedemption.count({ where: { gymId, createdAt: inMonth } }),
        prisma.referral.findMany({ where: { gymId }, select: { status: true, convertedAt: true } }),
        prisma.member.findMany({ where: { gymId }, select: { riskLevel: true, retentionScore: true } }),
        prisma.challengeParticipant.count({ where: { challenge: { gymId }, joinedAt: inMonth } }),
      ]);

    const activeMembers = memberships.filter((ms) => ms.endDate >= now).length;
    const newMembers = members.filter((mm) => mm.createdAt >= start && mm.createdAt < end).length;
    const expired = memberships.filter((ms) => ms.endDate >= start && ms.endDate < end).length;
    const renewals = memberships.filter((ms) => ms.renewedFromId && ms.createdAt >= start && ms.createdAt < end).length;
    const revenue = payments.reduce((s, p) => s + Number(p.amount), 0);
    const outstanding = dues.reduce((s, d) => s + Number(d.balance ?? 0), 0);
    const convertedLeads = leads.filter((l) => l.convertedAt && l.convertedAt >= start && l.convertedAt < end).length;
    const leadConversion = leads.length ? Number(((convertedLeads / leads.length) * 100).toFixed(1)) : 0;
    const atRisk = riskRows.filter((r) => r.riskLevel === "HIGH" || r.riskLevel === "CRITICAL").length;
    const scored = riskRows.filter((r) => r.retentionScore != null);
    const avgRetention = scored.length ? Math.round(scored.reduce((s, r) => s + (r.retentionScore ?? 0), 0) / scored.length) : 0;
    const convertedReferrals = referrals.filter((r) => r.status === "CONVERTED" || r.status === "REWARDED").length;

    const monthLabel = start.toLocaleString("en-US", { month: "long", year: "numeric" });
    const report = {
      gymName: gym?.name ?? "Gym",
      month: monthLabel,
      membership: { activeMembers, newMembers, expired, renewals },
      revenue: { revenue, payments: payments.length, outstandingDues: outstanding },
      attendance: { total: attendance },
      trainerActivity: { messages: trainerMsgs },
      training: { workoutCompletions: workouts, dietCompletions: diets },
      retention: { avgRetentionScore: avgRetention, atRiskMembers: atRisk },
      leads: { totalLeads: leads.length, converted: convertedLeads, conversionRate: leadConversion },
      engagement: { challengeParticipations: challengeParts, rewardRedemptions: redemptions, referrals: referrals.length, referralConversions: convertedReferrals },
    };

    if (format === "pdf") {
      const content = await generateMonthlySummaryPdf({
        gymName: report.gymName,
        month: report.month,
        sections: [
          { heading: "Membership", items: [
            { label: "Active members", value: activeMembers },
            { label: "New members", value: newMembers },
            { label: "Expired", value: expired },
            { label: "Renewals", value: renewals },
          ]},
          { heading: "Revenue", items: [
            { label: "Revenue (paid)", value: `INR ${revenue.toLocaleString("en-IN")}` },
            { label: "Payments", value: payments.length },
            { label: "Outstanding dues", value: `INR ${outstanding.toLocaleString("en-IN")}` },
          ]},
          { heading: "Attendance", items: [{ label: "Total check-ins", value: attendance }] },
          { heading: "Trainer activity", items: [{ label: "Messages sent", value: trainerMsgs }] },
          { heading: "Training", items: [
            { label: "Workout completions", value: workouts },
            { label: "Diet completions", value: diets },
          ]},
          { heading: "Retention", items: [
            { label: "Avg retention score", value: avgRetention },
            { label: "At-risk members", value: atRisk },
          ]},
          { heading: "Lead conversion", items: [
            { label: "Total leads", value: leads.length },
            { label: "Converted", value: convertedLeads },
            { label: "Conversion rate", value: `${leadConversion}%` },
          ]},
          { heading: "Engagement", items: [
            { label: "Challenge participations", value: challengeParts },
            { label: "Reward redemptions", value: redemptions },
            { label: "Referrals (converted)", value: `${referrals.length} (${convertedReferrals})` },
          ]},
        ],
      });
      return { format: "pdf" as const, filename: `monthly-report-${monthStr || ""}.pdf`, content };
    }

    return { format: "json" as const, data: report };
  }
}

