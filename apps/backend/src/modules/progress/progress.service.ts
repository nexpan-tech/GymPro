import { prisma } from "../../config/db";
import { GamificationEvents } from "../gamification/engagement-events.service";
import { AppError } from "../../utils/response";
import type {
  CreateProgressEntryInput,
  CreateProgressGoalInput,
  UpdateProgressGoalInput,
} from "./progress.validation";

type AuthUser = {
  id: string;
  role: string;
  gymId: string | null;
};

// Numeric metric fields tracked per entry (used for charts/summary/trends).
const METRICS = [
  "weight",
  "height",
  "bmi",
  "bodyFatPercentage",
  "muscleMass",
  "chest",
  "waist",
  "hips",
  "arms",
  "thighs",
] as const;
type Metric = (typeof METRICS)[number];

type EntryRow = Record<Metric, number | null> & {
  id: string;
  recordedAt: Date;
  notes: string | null;
};

function calculateBmi(weight?: number | null, height?: number | null) {
  if (!weight || !height) return null;
  const m = height / 100;
  return Number((weight / (m * m)).toFixed(2));
}

function round(n: number, d = 2) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function trendOf(change: number): "UP" | "DOWN" | "FLAT" {
  if (change > 0.0001) return "UP";
  if (change < -0.0001) return "DOWN";
  return "FLAT";
}

function dayKey(d: Date) {
  // UTC date portion — stable regardless of server timezone.
  return new Date(d).toISOString().slice(0, 10);
}

export class ProgressService {
  // ── Access control ─────────────────────────────────────────────────────────
  private static async getMemberForAccess(user: AuthUser, memberId: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);

    const member = await prisma.member.findFirst({
      where: { id: memberId, gymId: user.gymId },
      include: { user: true },
    });

    if (!member) throw new AppError("Member not found in this gym", 404);

    if (user.role === "MEMBER" && member.userId !== user.id) {
      throw new AppError("You can only access your own progress", 403);
    }
    if (user.role === "TRAINER" && member.trainerId !== user.id) {
      throw new AppError("You can only access assigned member progress", 403);
    }
    return member;
  }

  /** Resolve the caller's own member record (MEMBER self endpoints). */
  private static async resolveMyMember(user: AuthUser) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const member = await prisma.member.findFirst({
      where: { userId: user.id, gymId: user.gymId },
    });
    if (!member) throw new AppError("Member profile not found", 404);
    return member;
  }

  // ── Entries ──────────────────────────────────────────────────────────────
  static async createEntry(
    user: AuthUser,
    memberId: string,
    data: CreateProgressEntryInput,
  ) {
    const member = await this.getMemberForAccess(user, memberId);

    // BMI from this entry's height, else the member's stored height, else the
    // most recent recorded height.
    let height = data.height ?? member.height ?? null;
    if (!height) {
      const last = await prisma.bodyMeasurement.findFirst({
        where: { gymId: user.gymId!, memberId, height: { not: null } },
        orderBy: { recordedAt: "desc" },
      });
      height = last?.height ?? null;
    }
    const bmi = calculateBmi(data.weight ?? null, height);

    const measurement = await prisma.bodyMeasurement.create({
      data: {
        gymId: user.gymId!,
        memberId,
        recordedById: user.id,
        recordedAt: data.recordedAt ? new Date(data.recordedAt) : new Date(),
        weight: data.weight,
        height: data.height,
        chest: data.chest,
        waist: data.waist,
        hips: data.hips,
        arms: data.arms,
        thighs: data.thighs,
        bodyFatPercentage: data.bodyFatPercentage,
        muscleMass: data.muscleMass,
        bmi: bmi ?? undefined,
        notes: data.notes,
      },
    });

    // Stage 8 — points for logging progress (best-effort, idempotent per entry).
    await GamificationEvents.progressUpdated({ gymId: user.gymId!, memberId, measurementId: measurement.id });

    return measurement;
  }

  private static async fetchEntries(gymId: string, memberId: string) {
    return prisma.bodyMeasurement.findMany({
      where: { gymId, memberId },
      orderBy: { recordedAt: "asc" },
    }) as unknown as Promise<EntryRow[]>;
  }

  /** Timeline (newest first) — raw rows for tables. */
  static async getTimeline(user: AuthUser, memberId: string) {
    await this.getMemberForAccess(user, memberId);
    const rows = await this.fetchEntries(user.gymId!, memberId);
    return [...rows].reverse(); // newest first
  }

  /** Chart-ready per-metric series: { metric, points[], trend, change }. */
  static async getCharts(user: AuthUser, memberId: string) {
    await this.getMemberForAccess(user, memberId);
    const rows = await this.fetchEntries(user.gymId!, memberId);

    return METRICS.map((metric) => {
      const points = rows
        .filter((r) => r[metric] != null)
        .map((r) => ({ date: dayKey(r.recordedAt), value: r[metric] as number }));
      const change =
        points.length >= 2
          ? round(points[points.length - 1].value - points[0].value)
          : 0;
      return { metric, points, trend: trendOf(change), change };
    }).filter((s) => s.points.length > 0);
  }

  /** Summary: latest/previous/first, deltas, monthly average, trend per metric. */
  static async getSummary(user: AuthUser, memberId: string) {
    await this.getMemberForAccess(user, memberId);
    const rows = await this.fetchEntries(user.gymId!, memberId);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const metrics: Record<string, unknown> = {};
    for (const metric of METRICS) {
      const series = rows.filter((r) => r[metric] != null);
      if (series.length === 0) continue;
      const values = series.map((r) => r[metric] as number);
      const first = values[0];
      const latest = values[values.length - 1];
      const previous = values.length >= 2 ? values[values.length - 2] : null;
      const monthVals = series
        .filter((r) => r.recordedAt >= monthStart)
        .map((r) => r[metric] as number);
      const monthlyAverage =
        monthVals.length > 0
          ? round(monthVals.reduce((a, b) => a + b, 0) / monthVals.length)
          : null;

      metrics[metric] = {
        latest,
        previous,
        first,
        changeSincePrevious: previous != null ? round(latest - previous) : null,
        changeSinceFirst: round(latest - first),
        monthlyAverage,
        trend: trendOf(latest - first),
      };
    }

    return {
      entryCount: rows.length,
      firstEntryAt: rows[0]?.recordedAt ?? null,
      lastEntryAt: rows[rows.length - 1]?.recordedAt ?? null,
      consistencyScore: this.consistencyScore(rows),
      metrics,
    };
  }

  /**
   * Consistency = share of the last 8 weeks that have ≥1 entry (0–100). A simple,
   * AI-ready signal for adherence to logging.
   */
  private static consistencyScore(rows: EntryRow[]) {
    if (rows.length === 0) return 0;
    const now = Date.now();
    const weeksWithEntry = new Set<number>();
    for (const r of rows) {
      const weeksAgo = Math.floor(
        (now - new Date(r.recordedAt).getTime()) / (7 * 24 * 60 * 60 * 1000),
      );
      if (weeksAgo >= 0 && weeksAgo < 8) weeksWithEntry.add(weeksAgo);
    }
    return Math.round((weeksWithEntry.size / 8) * 100);
  }

  /** Monthly report for the given month (defaults to current). */
  static async getMonthlyReport(
    user: AuthUser,
    memberId: string,
    month?: string,
  ) {
    const member = await this.getMemberForAccess(user, memberId);
    const rows = await this.fetchEntries(user.gymId!, memberId);

    const ref = month ? new Date(month + "-01T00:00:00Z") : new Date();
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);

    const monthRows = rows.filter(
      (r) => r.recordedAt >= start && r.recordedAt < end,
    );
    const headline = (["weight", "bmi", "bodyFatPercentage", "waist"] as Metric[]).reduce(
      (acc, metric) => {
        const series = rows.filter((r) => r[metric] != null);
        const inMonth = monthRows.filter((r) => r[metric] != null);
        const latest = series.length ? (series[series.length - 1][metric] as number) : null;
        const startOfMonth =
          inMonth.length ? (inMonth[0][metric] as number) : null;
        acc[metric] = {
          latest,
          changeFromMonthStart:
            latest != null && startOfMonth != null
              ? round(latest - startOfMonth)
              : null,
        };
        return acc;
      },
      {} as Record<string, { latest: number | null; changeFromMonthStart: number | null }>,
    );

    const goals = await this.listGoals(user, memberId);
    const trainerNotes = monthRows
      .filter((r) => r.notes)
      .map((r) => ({ date: dayKey(r.recordedAt), note: r.notes as string }));

    return {
      month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
      memberId,
      memberName: member.user?.name ?? null,
      entriesThisMonth: monthRows.length,
      consistencyScore: this.consistencyScore(rows),
      headline,
      goals,
      trainerNotes,
    };
  }

  static async deleteEntry(user: AuthUser, id: string) {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    const entry = await prisma.bodyMeasurement.findFirst({
      where: { id, gymId: user.gymId },
    });
    if (!entry) throw new AppError("Progress entry not found", 404);
    // Reuse access check (member self / trainer assigned / admin gym).
    await this.getMemberForAccess(user, entry.memberId);
    if (user.role === "RECEPTIONIST") {
      throw new AppError("Receptionists cannot delete progress entries", 403);
    }
    await prisma.bodyMeasurement.delete({ where: { id } });
    return { id };
  }

  // ── Goals ──────────────────────────────────────────────────────────────────
  static async listGoals(user: AuthUser, memberId: string) {
    await this.getMemberForAccess(user, memberId);
    const goals = await prisma.goal.findMany({
      where: { gymId: user.gymId!, memberId },
      orderBy: { createdAt: "desc" },
    });

    // Latest metric values to auto-derive currentValue for metric-bound goals.
    const latest = await prisma.bodyMeasurement.findFirst({
      where: { gymId: user.gymId!, memberId },
      orderBy: { recordedAt: "desc" },
    });

    return goals.map((g) => {
      const metricCurrent =
        g.metric && latest
          ? ((latest as unknown as Record<string, number | null>)[g.metric] ?? null)
          : null;
      const current = metricCurrent ?? g.currentValue ?? null;
      const startV = g.startValue ?? null;
      const target = g.targetValue ?? null;

      let progress = 0;
      if (current != null && target != null) {
        if (startV != null && target !== startV) {
          progress = Math.round(
            Math.min(100, Math.max(0, ((current - startV) / (target - startV)) * 100)),
          );
        } else {
          progress = target !== 0 ? Math.round(Math.min(100, (current / target) * 100)) : 0;
        }
      }
      return { ...g, currentValue: current, progressPercent: progress };
    });
  }

  static async createGoal(
    user: AuthUser,
    memberId: string,
    data: CreateProgressGoalInput,
  ) {
    await this.getMemberForAccess(user, memberId);
    if (user.role === "RECEPTIONIST") {
      throw new AppError("Receptionists cannot create goals", 403);
    }
    return prisma.goal.create({
      data: {
        gymId: user.gymId!,
        memberId,
        title: data.title,
        metric: data.metric,
        startValue: data.startValue,
        targetValue: data.targetValue,
        currentValue: data.currentValue,
        unit: data.unit,
        startDate: new Date(),
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      },
    });
  }

  static async updateGoal(
    user: AuthUser,
    memberId: string,
    goalId: string,
    data: UpdateProgressGoalInput,
  ) {
    await this.getMemberForAccess(user, memberId);
    if (user.role === "RECEPTIONIST") {
      throw new AppError("Receptionists cannot update goals", 403);
    }
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, gymId: user.gymId!, memberId },
    });
    if (!goal) throw new AppError("Goal not found", 404);

    return prisma.goal.update({
      where: { id: goalId },
      data: {
        title: data.title,
        metric: data.metric,
        startValue: data.startValue,
        targetValue: data.targetValue,
        currentValue: data.currentValue,
        unit: data.unit,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
        status: data.status,
      },
    });
  }

  // ── Self (MEMBER) wrappers ──────────────────────────────────────────────────
  static async myMemberId(user: AuthUser) {
    return (await this.resolveMyMember(user)).id;
  }
}
