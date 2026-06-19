import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import { GamificationEvents } from "../gamification/engagement-events.service";

type AuthUser = { id: string; role: string; gymId: string | null };

function startOfDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function parseDay(value?: string): Date {
  if (!value) return startOfDay();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new AppError("Invalid date", 400);
  return startOfDay(d);
}

const MAX_ASSIGNMENTS = 1000; // safety cap on a single bulk assignment call

export interface AssignInput {
  workoutPlanId: string;
  memberIds?: string[];
  assignToAll?: boolean;
  dayNumber?: number;
  // Provide exactly one scheduling shape:
  scheduledDate?: string;                                   // one-day
  dates?: string[];                                         // explicit multiple days
  weekly?: { weekdays: number[]; startDate: string; weeks: number }; // recurring weekly
}

/**
 * Calendar-day workout scheduling. This is the source of truth for "today's
 * workout" — web and mobile both read GET /workout/today, so a card can never
 * show the wrong day.
 */
export class WorkoutAssignmentService {
  private static gym(user: AuthUser): string {
    if (!user.gymId) throw new AppError("Gym context missing", 403);
    return user.gymId;
  }

  /** Resolve + access-check the target members (TRAINER → own members only). */
  private static async resolveMembers(user: AuthUser, input: AssignInput): Promise<string[]> {
    const gymId = this.gym(user);

    if (input.assignToAll) {
      const where = user.role === "TRAINER"
        ? { gymId, trainerId: user.id, status: "ACTIVE" as const }
        : { gymId, status: "ACTIVE" as const };
      const members = await prisma.member.findMany({ where, select: { id: true } });
      return members.map((m) => m.id);
    }

    const ids = (input.memberIds ?? []).filter((id): id is string => typeof id === "string" && !!id);
    if (ids.length === 0) throw new AppError("No members selected", 400);

    const members = await prisma.member.findMany({
      where: { id: { in: ids }, gymId },
      select: { id: true, trainerId: true },
    });
    if (members.length !== ids.length) throw new AppError("Some members were not found in this gym", 404);
    if (user.role === "TRAINER") {
      const foreign = members.find((m) => m.trainerId !== user.id);
      if (foreign) throw new AppError("You can only assign to your assigned members", 403);
    }
    return members.map((m) => m.id);
  }

  /** Build the list of scheduled calendar days from the scheduling shape. */
  private static resolveDates(input: AssignInput): Date[] {
    if (input.weekly) {
      const { weekdays, startDate, weeks } = input.weekly;
      if (!Array.isArray(weekdays) || weekdays.length === 0) throw new AppError("weekly.weekdays required", 400);
      if (!weeks || weeks < 1 || weeks > 53) throw new AppError("weekly.weeks must be 1..53", 400);
      const start = parseDay(startDate);
      const out: Date[] = [];
      const total = weeks * 7;
      for (let i = 0; i < total; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        if (weekdays.includes(d.getDay())) out.push(startOfDay(d));
      }
      return out;
    }
    if (input.dates && input.dates.length > 0) {
      return input.dates.map((s) => parseDay(s));
    }
    return [parseDay(input.scheduledDate)];
  }

  /** Trainer/Admin: assign a plan to members across one or more days. Idempotent. */
  static async assign(user: AuthUser, input: AssignInput) {
    const gymId = this.gym(user);
    if (user.role !== "ADMIN" && user.role !== "TRAINER") {
      throw new AppError("Only trainers or admins can assign workouts", 403);
    }

    const plan = await prisma.workoutPlan.findFirst({ where: { id: input.workoutPlanId, gymId } });
    if (!plan) throw new AppError("Workout plan not found", 404);

    const memberIds = await this.resolveMembers(user, input);
    const dates = this.resolveDates(input);

    if (memberIds.length * dates.length > MAX_ASSIGNMENTS) {
      throw new AppError(`Too many assignments (${memberIds.length * dates.length}); narrow the range`, 400);
    }

    const rows = memberIds.flatMap((memberId) =>
      dates.map((scheduledDate) => ({
        gymId,
        memberId,
        workoutPlanId: plan.id,
        trainerId: user.role === "TRAINER" ? user.id : plan.trainerId,
        scheduledDate,
        dayNumber: input.dayNumber ?? null,
        status: "SCHEDULED" as const,
      })),
    );

    // Idempotent: the @@unique([memberId, scheduledDate, workoutPlanId]) makes
    // re-assigning the same plan/day/member a no-op rather than a duplicate.
    const result = await prisma.workoutAssignment.createMany({ data: rows, skipDuplicates: true });
    return { assigned: result.count, members: memberIds.length, days: dates.length };
  }

  /** Resolve the caller's own member id (MEMBER self-service). */
  private static async myMemberId(user: AuthUser): Promise<string> {
    const gymId = this.gym(user);
    const member = await prisma.member.findFirst({ where: { userId: user.id, gymId }, select: { id: true } });
    if (!member) throw new AppError("Member profile not found", 404);
    return member.id;
  }

  /** Lazily flag past, still-SCHEDULED assignments as EXPIRED (best-effort). */
  private static async expireStale(gymId: string, memberId: string, today: Date) {
    await prisma.workoutAssignment.updateMany({
      where: { gymId, memberId, status: "SCHEDULED", scheduledDate: { lt: today } },
      data: { status: "EXPIRED" },
    });
  }

  private static planInclude(dayNumber: number | null) {
    return {
      workoutPlan: {
        include: {
          exercises: {
            ...(dayNumber != null ? { where: { dayNumber } } : {}),
            include: { exercise: true },
            orderBy: [{ dayNumber: "asc" as const }, { createdAt: "asc" as const }],
          },
          trainer: { select: { id: true, name: true } },
        },
      },
    };
  }

  /** Member: today's workout (the assignment scheduled for today). */
  static async getToday(user: AuthUser, date?: string) {
    const gymId = this.gym(user);
    const memberId = await this.myMemberId(user);
    const today = parseDay(date);
    await this.expireStale(gymId, memberId, today);

    const next = new Date(today);
    next.setDate(next.getDate() + 1);

    const assignments = await prisma.workoutAssignment.findMany({
      where: { gymId, memberId, scheduledDate: { gte: today, lt: next } },
      orderBy: { createdAt: "asc" },
    });
    // Fetch each with its plan (filtered by dayNumber) — usually 0 or 1.
    const detailed = await Promise.all(
      assignments.map((a) =>
        prisma.workoutAssignment.findUnique({ where: { id: a.id }, include: this.planInclude(a.dayNumber) }),
      ),
    );
    return { date: today.toISOString().slice(0, 10), assignments: detailed.filter(Boolean) };
  }

  /**
   * Member: the full Mon–Sun week containing `date` (default today). Each day
   * carries its trainer-assigned workout (title, exercise count, target muscles,
   * estimated duration, status) or is a REST day. `weekOffset` shifts whole
   * weeks (−1 previous, +1 next). Source = TRAINER for now; PERSONAL plans land
   * in a later phase. (Phase D — does not touch GET /workout/today.)
   */
  static async getWeek(user: AuthUser, date?: string, weekOffset = 0) {
    const gymId = this.gym(user);
    const memberId = await this.myMemberId(user);

    // Compute the Mon–Sun window in UTC so day-keys are timezone-stable.
    const ref = date ? new Date(`${date}T00:00:00.000Z`) : new Date();
    const baseUTC = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));
    const dow = baseUTC.getUTCDay(); // 0=Sun … 6=Sat
    const weekStart = new Date(baseUTC);
    weekStart.setUTCDate(weekStart.getUTCDate() + (dow === 0 ? -6 : 1 - dow) + weekOffset * 7); // Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
    const now = new Date();
    const todayKey = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString().slice(0, 10);

    const assignments = await prisma.workoutAssignment.findMany({
      where: { gymId, memberId, scheduledDate: { gte: weekStart, lt: weekEnd } },
      include: { workoutPlan: { include: { exercises: { include: { exercise: true } } } } },
      orderBy: { scheduledDate: "asc" },
    });
    const byDay = new Map<string, (typeof assignments)[number]>();
    for (const a of assignments) {
      const k = new Date(a.scheduledDate).toISOString().slice(0, 10);
      if (!byDay.has(k)) byDay.set(k, a);
    }

    const NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setUTCDate(d.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      const a = byDay.get(key) ?? null;
      const ex = a?.workoutPlan.exercises ?? [];
      const muscles = [...new Set(ex.map((e) => e.exercise.muscleGroup).filter(Boolean))].slice(0, 4);
      const status = !a ? "REST" : a.status === "EXPIRED" ? "MISSED" : a.status; // SCHEDULED | COMPLETED | MISSED | SKIPPED | REST
      return {
        date: key,
        weekday: NAMES[d.getUTCDay()],
        isToday: key === todayKey,
        status,
        source: a ? "TRAINER" : null,
        assignmentId: a?.id ?? null,
        plan: a
          ? {
              id: a.workoutPlan.id,
              title: a.workoutPlan.title,
              difficulty: a.workoutPlan.difficulty,
              exerciseCount: ex.length,
              muscles,
              estMinutes: Math.max(15, ex.length * 6),
            }
          : null,
      };
    });

    const lastDay = new Date(weekStart);
    lastDay.setUTCDate(lastDay.getUTCDate() + 6);
    return {
      weekStart: weekStart.toISOString().slice(0, 10),
      weekEnd: lastDay.toISOString().slice(0, 10),
      weekOffset,
      days,
    };
  }

  /** Member: upcoming (future, still-scheduled) workouts. */
  static async getUpcoming(user: AuthUser, date?: string) {
    const gymId = this.gym(user);
    const memberId = await this.myMemberId(user);
    const today = parseDay(date);
    const next = new Date(today);
    next.setDate(next.getDate() + 1);

    return prisma.workoutAssignment.findMany({
      where: { gymId, memberId, status: "SCHEDULED", scheduledDate: { gte: next } },
      include: this.planInclude(null),
      orderBy: { scheduledDate: "asc" },
      take: 30,
    });
  }

  /** Member: history — completed or past assignments. */
  static async getHistory(user: AuthUser, date?: string) {
    const gymId = this.gym(user);
    const memberId = await this.myMemberId(user);
    const today = parseDay(date);
    await this.expireStale(gymId, memberId, today);

    return prisma.workoutAssignment.findMany({
      where: {
        gymId,
        memberId,
        OR: [{ status: "COMPLETED" }, { status: "EXPIRED" }, { status: "SKIPPED" }],
      },
      include: this.planInclude(null),
      orderBy: { scheduledDate: "desc" },
      take: 60,
    });
  }

  /** Member: mark an assignment complete (idempotent). Fires gamification. */
  static async complete(user: AuthUser, assignmentId: string) {
    const gymId = this.gym(user);
    const memberId = await this.myMemberId(user);

    const assignment = await prisma.workoutAssignment.findFirst({ where: { id: assignmentId, gymId, memberId } });
    if (!assignment) throw new AppError("Assignment not found", 404);
    if (assignment.status === "COMPLETED") return assignment; // idempotent

    const updated = await prisma.workoutAssignment.update({
      where: { id: assignment.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    // Best-effort gamification (points + workout streak) — never blocks the response.
    try {
      await GamificationEvents.workoutCompleted({ gymId, memberId, completionId: updated.id });
    } catch { /* non-fatal */ }

    return updated;
  }
}
