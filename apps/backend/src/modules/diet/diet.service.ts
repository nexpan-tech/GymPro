import { prisma } from "../../config/db";
import { GamificationEvents } from "../gamification/engagement-events.service";
import { Role } from "@prisma/client";
import {
  CreateDietPlanInput,
  UpdateDietPlanInput,
  CreateDietCompletionInput,
} from "./diet.validation";
import { AppError } from "../../utils/response";
import { requireGym } from "../../utils/tenant";

interface AuthUser {
  id: string;
  role: Role;
  gymId: string | null;
}

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function dayKey(date: Date) {
  return startOfDay(date).toISOString().slice(0, 10);
}

// Canonical weekday vocabulary used across diet (lowercase English day names),
// matching DietMeal.dayOfWeek and the legacy monday..sunday plan fields.
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

function serverWeekday(date = new Date()): string {
  return WEEKDAYS[date.getDay()];
}

/** Accept a client-supplied weekday (any case / 3-letter form) → canonical name, or null. */
function normalizeWeekday(day?: string): string | null {
  if (!day) return null;
  const d = day.trim().toLowerCase();
  const exact = WEEKDAYS.find((w) => w === d);
  if (exact) return exact;
  const abbrev = WEEKDAYS.find((w) => w.slice(0, 3) === d.slice(0, 3));
  return abbrev ?? null;
}

/**
 * Builds the last `days` calendar-day buckets (oldest → newest, ending today)
 * with a completion count per day, plus the current consecutive-day streak.
 */
function buildTrend(completedAts: Date[], days = 7) {
  const counts = new Map<string, number>();
  for (const d of completedAts) {
    const key = dayKey(new Date(d));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const trend: { date: string; count: number }[] = [];
  const today = startOfDay();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    trend.push({ date: key, count: counts.get(key) ?? 0 });
  }

  let streak = 0;
  for (let i = 0; ; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if ((counts.get(dayKey(d)) ?? 0) > 0) streak++;
    else break;
  }

  return { trend, streak };
}

export class DietService {
  private static async assertMemberAccess(user: AuthUser, memberId: string) {
    const gymId = requireGym(user);

    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        gymId,
      },
    });

    if (!member) {
      throw new AppError("Member not found in this gym", 404);
    }

    if (user.role === "TRAINER" && member.trainerId !== user.id) {
      throw new AppError("You can only manage assigned members", 403);
    }

    if (user.role === "MEMBER" && member.userId !== user.id) {
      throw new AppError("You can only access your own diet plan", 403);
    }

    return member;
  }

  static async create(user: AuthUser, data: CreateDietPlanInput) {
    const gymId = requireGym(user);

    await this.assertMemberAccess(user, data.memberId);

    const existing = await prisma.dietPlan.findUnique({
      where: {
        memberId: data.memberId,
      },
    });

    if (existing) {
      throw new AppError("Diet plan already exists for this member", 400);
    }

    return prisma.dietPlan.create({
      data: {
        gymId,
        memberId: data.memberId,
        goal: data.goal,
        notes: data.notes,
        monday: data.monday,
        tuesday: data.tuesday,
        wednesday: data.wednesday,
        thursday: data.thursday,
        friday: data.friday,
        saturday: data.saturday,
        sunday: data.sunday,
      },
    });
  }

  static async getAll(user: AuthUser) {
    const gymId = requireGym(user);

    return prisma.dietPlan.findMany({
      where: {
        gymId,
        ...(user.role === "TRAINER"
          ? { member: { trainerId: user.id } }
          : {}),
        ...(user.role === "MEMBER"
          ? { member: { userId: user.id } }
          : {}),
      },
      include: {
        member: {
          include: {
            user: true,
            trainer: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getByMember(user: AuthUser, memberId: string) {
    const gymId = requireGym(user);

    await this.assertMemberAccess(user, memberId);

    return prisma.dietPlan.findFirst({
      where: {
        gymId,
        memberId,
      },
      include: {
        // Include structured meals so trainer-built (diet-builder) plans are
        // visible — they store DietMeal rows, not the legacy day-string fields.
        meals: { orderBy: [{ dayOfWeek: "asc" }, { createdAt: "asc" }] },
        member: {
          include: {
            user: true,
            trainer: true,
          },
        },
      },
    });
  }

  /** The logged-in member's own diet plan, with structured meals. */
  static async getMyPlan(user: AuthUser) {
    const gymId = requireGym(user);

    const member = await prisma.member.findFirst({
      where: { userId: user.id, gymId },
    });

    if (!member) {
      throw new AppError("Member profile not found", 404);
    }

    return prisma.dietPlan.findFirst({
      where: { gymId, memberId: member.id },
      include: {
        meals: { orderBy: [{ dayOfWeek: "asc" }, { createdAt: "asc" }] },
        member: { include: { user: true, trainer: true } },
      },
    });
  }

  /**
   * The logged-in member's full Mon–Sun diet week — each day with its meals
   * (breakfast/lunch/dinner/snacks) and macro totals. Source = TRAINER for now;
   * PERSONAL diets land in a later phase. (Phase D — does not touch /diet/my/today.)
   */
  static async getMyWeek(user: AuthUser) {
    const gymId = requireGym(user);
    const member = await prisma.member.findFirst({ where: { userId: user.id, gymId } });
    if (!member) throw new AppError("Member profile not found", 404);

    const plan = await prisma.dietPlan.findFirst({
      where: { gymId, memberId: member.id },
      include: { meals: { orderBy: [{ mealType: "asc" }, { time: "asc" }] } },
    });

    const ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const today = serverWeekday();

    const days = ORDER.map((day) => {
      const meals = (plan?.meals ?? []).filter((m) => (m.dayOfWeek ?? "").toLowerCase() === day);
      const dayPlanText = (plan as Record<string, unknown> | null)?.[day] as string | null | undefined;
      const totals = meals.reduce(
        (a, m) => ({
          kcal: a.kcal + (m.calories ?? 0),
          protein: a.protein + (m.protein ?? 0),
          carbs: a.carbs + (m.carbs ?? 0),
          fats: a.fats + (m.fats ?? 0),
        }),
        { kcal: 0, protein: 0, carbs: 0, fats: 0 },
      );
      return {
        day,
        isToday: day === today,
        mealCount: meals.length,
        meals,
        totals,
        dayPlanText: dayPlanText ?? null,
        source: meals.length > 0 || dayPlanText ? "TRAINER" : null,
      };
    });

    return { planId: plan?.id ?? null, goal: plan?.goal ?? null, days };
  }

  /**
   * The logged-in member's meals for a single day of the week — the "today"
   * view (#4/#8). The client passes its LOCAL weekday via `day` (lowercase, e.g.
   * "monday") so the view matches the member's local date regardless of server
   * timezone; it falls back to the server's weekday. Returns both the structured
   * DietMeal rows for that day and the legacy day-string field, plus the full
   * week's day list so the client can offer history/upcoming navigation.
   */
  static async getMyToday(user: AuthUser, day?: string) {
    const gymId = requireGym(user);

    const member = await prisma.member.findFirst({
      where: { userId: user.id, gymId },
    });
    if (!member) {
      throw new AppError("Member profile not found", 404);
    }

    const plan = await prisma.dietPlan.findFirst({
      where: { gymId, memberId: member.id },
      include: { meals: { orderBy: [{ mealType: "asc" }, { time: "asc" }] } },
    });

    const today = normalizeWeekday(day) ?? serverWeekday();

    if (!plan) {
      return { day: today, plan: null, meals: [], dayPlanText: null, mealCount: 0, goal: null };
    }

    const meals = plan.meals.filter((m) => (m.dayOfWeek ?? "").toLowerCase() === today);
    const dayPlanText = (plan as Record<string, unknown>)[today] as string | null | undefined;

    return {
      day: today,
      planId: plan.id,
      goal: plan.goal ?? null,
      meals,
      dayPlanText: dayPlanText ?? null,
      mealCount: meals.length,
    };
  }

  static async update(
    user: AuthUser,
    memberId: string,
    data: UpdateDietPlanInput
  ) {
    const gymId = requireGym(user);

    await this.assertMemberAccess(user, memberId);

    const plan = await prisma.dietPlan.findFirst({
      where: {
        gymId,
        memberId,
      },
    });

    if (!plan) {
      throw new AppError("Diet plan not found", 404);
    }

    return prisma.dietPlan.update({
      where: {
        id: plan.id,
      },
      data: {
        goal: data.goal,
        notes: data.notes,
        monday: data.monday,
        tuesday: data.tuesday,
        wednesday: data.wednesday,
        thursday: data.thursday,
        friday: data.friday,
        saturday: data.saturday,
        sunday: data.sunday,
      },
    });
  }

  static async delete(user: AuthUser, memberId: string) {
    const gymId = requireGym(user);

    await this.assertMemberAccess(user, memberId);

    const plan = await prisma.dietPlan.findFirst({
      where: {
        gymId,
        memberId,
      },
    });

    if (!plan) {
      throw new AppError("Diet plan not found", 404);
    }

    return prisma.dietPlan.delete({
      where: {
        id: plan.id,
      },
    });
  }

  /**
   * Record a meal/day completion. MEMBER may only complete their own plan;
   * TRAINER may log for assigned members; ADMIN for any member in the gym.
   */
  static async completeMeal(user: AuthUser, data: CreateDietCompletionInput) {
    const gymId = requireGym(user);

    const plan = await prisma.dietPlan.findFirst({
      where: { id: data.dietPlanId, gymId },
      include: { member: true },
    });

    if (!plan) {
      throw new AppError("Diet plan not found", 404);
    }

    // Resolve the member the completion belongs to + enforce access.
    let member = plan.member;
    if (user.role === "MEMBER") {
      if (member.userId !== user.id) {
        throw new AppError("You can only complete your own diet plan", 403);
      }
    } else if (user.role === "TRAINER") {
      if (member.trainerId !== user.id) {
        throw new AppError("You can only manage assigned members", 403);
      }
    }

    if (data.dietMealId) {
      const meal = await prisma.dietMeal.findFirst({
        where: { id: data.dietMealId, dietPlanId: plan.id },
      });
      if (!meal) {
        throw new AppError("Meal not found in this diet plan", 404);
      }
    }

    const completion = await prisma.dietCompletion.create({
      data: {
        gymId,
        memberId: member.id,
        dietPlanId: plan.id,
        dietMealId: data.dietMealId ?? null,
        dayOfWeek: data.dayOfWeek ?? null,
        notes: data.notes,
      },
      include: {
        dietMeal: true,
        member: { include: { user: true } },
      },
    });

    // Stage 8 — points + diet streak (best-effort).
    await GamificationEvents.dietCompleted({ gymId, memberId: member.id, completionId: completion.id });

    return completion;
  }

  static async getCompletions(user: AuthUser, memberId?: string) {
    const gymId = requireGym(user);

    if (memberId) {
      await this.assertMemberAccess(user, memberId);
    }

    return prisma.dietCompletion.findMany({
      where: {
        gymId,
        ...(memberId ? { memberId } : {}),
        ...(user.role === "TRAINER" && !memberId
          ? { member: { trainerId: user.id } }
          : {}),
        ...(user.role === "MEMBER" ? { member: { userId: user.id } } : {}),
      },
      include: {
        dietMeal: true,
        member: { include: { user: true } },
      },
      orderBy: { completedAt: "desc" },
    });
  }

  /**
   * Diet adherence analytics. Scoped to a single member when `memberId` is
   * provided (or for MEMBER role, always self); otherwise aggregated across the
   * caller's visible members (TRAINER → assigned, ADMIN → whole gym).
   */
  static async getAnalytics(user: AuthUser, memberId?: string) {
    const gymId = requireGym(user);

    let scope: Record<string, unknown> = {};
    if (user.role === "MEMBER") {
      scope = { member: { userId: user.id } };
    } else if (memberId) {
      await this.assertMemberAccess(user, memberId);
      scope = { memberId };
    } else if (user.role === "TRAINER") {
      scope = { member: { trainerId: user.id } };
    }

    const plans = await prisma.dietPlan.findMany({
      where: { gymId, ...scope },
      include: { meals: true, completions: true },
    });

    const totalPlans = plans.length;
    const totalMeals = plans.reduce((sum, p) => sum + p.meals.length, 0);
    const completions = plans.flatMap((p) => p.completions);
    const totalCompletions = completions.length;

    const adherencePercentage =
      totalMeals > 0
        ? Math.min(100, Math.round((totalCompletions / totalMeals) * 100))
        : 0;

    const { trend, streak } = buildTrend(
      completions.map((c) => c.completedAt)
    );

    return {
      totalPlans,
      totalMeals,
      totalCompletions,
      adherencePercentage,
      currentStreak: streak,
      weeklyTrend: trend,
    };
  }
}