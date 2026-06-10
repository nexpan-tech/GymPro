import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import { monthlySeries, projectNext, type TrendResult } from "./trend";

type AuthUser = { id: string; role: string; gymId: string | null };

export interface Forecast extends TrendResult {
  metric: string;
  unit: string;
}

/**
 * Stage 10 — trend-based forecast engine (no external AI). Reuses the same
 * member/payment/attendance/lead data the analytics modules already store.
 */
export class ForecastEngine {
  static async forGym(user: AuthUser): Promise<Forecast[]> {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const gymId = user.gymId;
    const now = new Date();

    const [members, payments, attendances, leads, memberships] = await Promise.all([
      prisma.member.findMany({ where: { gymId }, select: { createdAt: true } }),
      prisma.payment.findMany({ where: { gymId, status: "PAID" }, select: { amount: true, paidAt: true, createdAt: true } }),
      prisma.attendance.findMany({ where: { gymId }, select: { date: true } }),
      prisma.lead.findMany({ where: { gymId }, select: { status: true, createdAt: true } }),
      prisma.membership.findMany({ where: { gymId }, select: { endDate: true } }),
    ]);

    // Membership growth — new members per month.
    const memberSeries = monthlySeries(members.map((m) => ({ date: m.createdAt })), 6, now);
    const membershipGrowth = projectNext(memberSeries);

    // Revenue growth — paid amount per month.
    const revSeries = monthlySeries(payments.map((p) => ({ date: p.paidAt ?? p.createdAt, value: Number(p.amount) })), 6, now);
    const revenueGrowth = projectNext(revSeries);

    // Attendance forecast — visits per month (proxy for weekly trend direction).
    const attSeries = monthlySeries(attendances.map((a) => ({ date: a.date })), 6, now);
    const attendanceForecast = projectNext(attSeries);

    // Lead conversion forecast — converted per month / total leads per month.
    const convSeries = monthlySeries(leads.filter((l) => l.status === "CONVERTED").map((l) => ({ date: l.createdAt })), 6, now);
    const leadConversionForecast = projectNext(convSeries);

    // Churn forecast — memberships expiring next 30 days that aren't active beyond.
    const in30 = new Date(now);
    in30.setDate(in30.getDate() + 30);
    const expiringSoon = memberships.filter((m) => m.endDate >= now && m.endDate <= in30).length;
    const activeNow = memberships.filter((m) => m.endDate >= now).length;
    const churnRate = activeNow ? Number(((expiringSoon / activeNow) * 100).toFixed(1)) : 0;

    return [
      { metric: "membershipGrowth", unit: "members/mo", ...membershipGrowth },
      { metric: "revenueGrowth", unit: "₹/mo", ...revenueGrowth },
      { metric: "attendanceForecast", unit: "visits/mo", ...attendanceForecast },
      { metric: "leadConversionForecast", unit: "conversions/mo", ...leadConversionForecast },
      {
        metric: "churnForecast",
        unit: "% next 30d",
        current: activeNow,
        projected: expiringSoon,
        changePercent: churnRate,
        direction: churnRate > 10 ? "up" : churnRate > 0 ? "flat" : "down",
        confidence: 0.6,
      },
    ];
  }
}
