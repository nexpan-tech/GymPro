import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import { requireGym } from "../../utils/tenant";
import type { Role } from "@prisma/client";
import type { CreatePersonalWorkoutInput, UpdatePersonalWorkoutInput } from "./personal-workout.validation";

interface AuthUser { id: string; role: Role; gymId: string | null }

interface ListFilters { category?: string; search?: string; archived?: boolean; favorite?: boolean; template?: boolean }

const workoutInclude = { exercises: { orderBy: { order: "asc" as const } } };
const ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/**
 * Personal (member-owned) workouts — independent of trainer WorkoutPlan/Assignment.
 * Create / edit / duplicate / archive / template / favourite / schedule / complete
 * / track. Every operation is strictly scoped to the caller's own member record.
 */
export class PersonalWorkoutService {
  private static async myMemberId(user: AuthUser): Promise<string> {
    const gymId = requireGym(user);
    const member = await prisma.member.findFirst({ where: { userId: user.id, gymId }, select: { id: true } });
    if (!member) throw new AppError("Member profile not found", 404);
    return member.id;
  }

  private static async owned(user: AuthUser, id: string) {
    const gymId = requireGym(user);
    const memberId = await this.myMemberId(user);
    const wo = await prisma.personalWorkout.findFirst({ where: { id, gymId, memberId }, include: workoutInclude });
    if (!wo) throw new AppError("Personal workout not found", 404);
    return wo;
  }

  static async list(user: AuthUser, filters: ListFilters = {}) {
    const gymId = requireGym(user);
    const memberId = await this.myMemberId(user);
    const where: Record<string, unknown> = { gymId, memberId, isArchived: filters.archived ?? false };
    if (filters.category) where.category = filters.category;
    if (filters.favorite) where.isFavorite = true;
    if (filters.template !== undefined) where.isTemplate = filters.template;
    if (filters.search) where.title = { contains: filters.search, mode: "insensitive" };
    return prisma.personalWorkout.findMany({ where, include: workoutInclude, orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }] });
  }

  static async get(user: AuthUser, id: string) {
    return this.owned(user, id);
  }

  static async create(user: AuthUser, data: CreatePersonalWorkoutInput) {
    const gymId = requireGym(user);
    const memberId = await this.myMemberId(user);
    return prisma.personalWorkout.create({
      data: {
        gymId, memberId, title: data.title, category: data.category, difficulty: data.difficulty,
        tags: data.tags ?? [], notes: data.notes, isTemplate: data.isTemplate ?? false,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
        dayOfWeek: data.dayOfWeek?.toLowerCase(), estMinutes: data.estMinutes,
        exercises: data.exercises?.length
          ? { create: data.exercises.map((e, i) => ({
              exerciseId: e.exerciseId, name: e.name, sets: e.sets ?? 3, reps: e.reps ?? "10",
              restSeconds: e.restSeconds, notes: e.notes, order: e.order ?? i,
            })) }
          : undefined,
      },
      include: workoutInclude,
    });
  }

  static async update(user: AuthUser, id: string, data: UpdatePersonalWorkoutInput) {
    const existing = await this.owned(user, id);
    return prisma.$transaction(async (tx) => {
      if (data.exercises) await tx.personalWorkoutExercise.deleteMany({ where: { personalWorkoutId: existing.id } });
      return tx.personalWorkout.update({
        where: { id: existing.id },
        data: {
          title: data.title, category: data.category, difficulty: data.difficulty, tags: data.tags, notes: data.notes,
          isTemplate: data.isTemplate, scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
          dayOfWeek: data.dayOfWeek?.toLowerCase(), estMinutes: data.estMinutes,
          ...(data.exercises
            ? { exercises: { create: data.exercises.map((e, i) => ({
                exerciseId: e.exerciseId, name: e.name, sets: e.sets ?? 3, reps: e.reps ?? "10",
                restSeconds: e.restSeconds, notes: e.notes, order: e.order ?? i,
              })) } }
            : {}),
        },
        include: workoutInclude,
      });
    });
  }

  static async remove(user: AuthUser, id: string) {
    const existing = await this.owned(user, id);
    await prisma.personalWorkout.delete({ where: { id: existing.id } });
    return { id: existing.id };
  }

  static async duplicate(user: AuthUser, id: string) {
    const src = await this.owned(user, id);
    return prisma.personalWorkout.create({
      data: {
        gymId: src.gymId, memberId: src.memberId, title: `${src.title} (Copy)`, category: src.category,
        difficulty: src.difficulty, tags: src.tags, notes: src.notes, isTemplate: false, estMinutes: src.estMinutes,
        exercises: { create: src.exercises.map((e) => ({
          exerciseId: e.exerciseId, name: e.name, sets: e.sets, reps: e.reps, restSeconds: e.restSeconds, notes: e.notes, order: e.order,
        })) },
      },
      include: workoutInclude,
    });
  }

  static async setArchived(user: AuthUser, id: string, isArchived: boolean) {
    const existing = await this.owned(user, id);
    return prisma.personalWorkout.update({ where: { id: existing.id }, data: { isArchived }, include: workoutInclude });
  }

  static async toggleFavorite(user: AuthUser, id: string) {
    const existing = await this.owned(user, id);
    return prisma.personalWorkout.update({ where: { id: existing.id }, data: { isFavorite: !existing.isFavorite }, include: workoutInclude });
  }

  static async complete(user: AuthUser, id: string, data: { durationMinutes?: number; notes?: string }) {
    const existing = await this.owned(user, id);
    return prisma.personalWorkoutCompletion.create({
      data: { gymId: existing.gymId, memberId: existing.memberId, personalWorkoutId: existing.id, durationMinutes: data.durationMinutes, notes: data.notes },
    });
  }

  static async history(user: AuthUser, limit = 60) {
    const gymId = requireGym(user);
    const memberId = await this.myMemberId(user);
    return prisma.personalWorkoutCompletion.findMany({
      where: { gymId, memberId },
      include: { personalWorkout: { select: { id: true, title: true, category: true } } },
      orderBy: { completedAt: "desc" },
      take: limit,
    });
  }

  /** Personal workouts grouped into a Mon–Sun week (by dayOfWeek). */
  static async week(user: AuthUser) {
    const gymId = requireGym(user);
    const memberId = await this.myMemberId(user);
    const items = await prisma.personalWorkout.findMany({
      where: { gymId, memberId, isArchived: false, dayOfWeek: { not: null } },
      include: workoutInclude,
    });
    return {
      days: ORDER.map((day) => ({
        day,
        workouts: items.filter((w) => (w.dayOfWeek ?? "").toLowerCase() === day),
      })),
    };
  }

  static async stats(user: AuthUser) {
    const gymId = requireGym(user);
    const memberId = await this.myMemberId(user);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const [total, active, templates, favorites, completionsTotal, completionsThisMonth, byCategory] = await Promise.all([
      prisma.personalWorkout.count({ where: { gymId, memberId } }),
      prisma.personalWorkout.count({ where: { gymId, memberId, isArchived: false, isTemplate: false } }),
      prisma.personalWorkout.count({ where: { gymId, memberId, isTemplate: true } }),
      prisma.personalWorkout.count({ where: { gymId, memberId, isFavorite: true } }),
      prisma.personalWorkoutCompletion.count({ where: { gymId, memberId } }),
      prisma.personalWorkoutCompletion.count({ where: { gymId, memberId, completedAt: { gte: monthStart } } }),
      prisma.personalWorkout.groupBy({ by: ["category"], where: { gymId, memberId, isArchived: false }, _count: { _all: true } }),
    ]);
    return {
      total, active, templates, favorites, completionsTotal, completionsThisMonth,
      byCategory: byCategory.map((c) => ({ category: c.category ?? "OTHER", count: c._count._all })),
    };
  }
}
