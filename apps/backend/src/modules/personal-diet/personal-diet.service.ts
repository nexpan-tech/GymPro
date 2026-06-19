import { prisma } from "../../config/db";
import { AppError } from "../../utils/response";
import { requireGym } from "../../utils/tenant";
import type { Role, MealType } from "@prisma/client";
import type { CreatePersonalDietInput, UpdatePersonalDietInput } from "./personal-diet.validation";

interface AuthUser { id: string; role: Role; gymId: string | null }
interface ListFilters { category?: string; search?: string; archived?: boolean; favorite?: boolean; template?: boolean }

const dietInclude = { meals: { orderBy: [{ mealType: "asc" as const }, { order: "asc" as const }] } };
const ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function utcDay(value?: string): Date {
  const d = value ? new Date(value) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Personal (member-owned) diets + water logging. Independent of the trainer
 * DietPlan — a member can keep multiple personal diets. Strictly self-scoped.
 */
export class PersonalDietService {
  private static async myMemberId(user: AuthUser): Promise<string> {
    const gymId = requireGym(user);
    const member = await prisma.member.findFirst({ where: { userId: user.id, gymId }, select: { id: true } });
    if (!member) throw new AppError("Member profile not found", 404);
    return member.id;
  }

  private static async owned(user: AuthUser, id: string) {
    const gymId = requireGym(user);
    const memberId = await this.myMemberId(user);
    const d = await prisma.personalDiet.findFirst({ where: { id, gymId, memberId }, include: dietInclude });
    if (!d) throw new AppError("Personal diet not found", 404);
    return d;
  }

  static async list(user: AuthUser, filters: ListFilters = {}) {
    const gymId = requireGym(user);
    const memberId = await this.myMemberId(user);
    const where: Record<string, unknown> = { gymId, memberId, isArchived: filters.archived ?? false };
    if (filters.category) where.category = filters.category;
    if (filters.favorite) where.isFavorite = true;
    if (filters.template !== undefined) where.isTemplate = filters.template;
    if (filters.search) where.title = { contains: filters.search, mode: "insensitive" };
    return prisma.personalDiet.findMany({ where, include: dietInclude, orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }] });
  }

  static async get(user: AuthUser, id: string) { return this.owned(user, id); }

  static async create(user: AuthUser, data: CreatePersonalDietInput) {
    const gymId = requireGym(user);
    const memberId = await this.myMemberId(user);
    return prisma.personalDiet.create({
      data: {
        gymId, memberId, title: data.title, category: data.category, tags: data.tags ?? [],
        notes: data.notes, isTemplate: data.isTemplate ?? false, dayOfWeek: data.dayOfWeek?.toLowerCase(),
        meals: data.meals?.length
          ? { create: data.meals.map((m, i) => ({
              mealType: m.mealType as MealType, title: m.title, calories: m.calories, protein: m.protein,
              carbs: m.carbs, fats: m.fats, time: m.time, notes: m.notes, order: m.order ?? i,
            })) }
          : undefined,
      },
      include: dietInclude,
    });
  }

  static async update(user: AuthUser, id: string, data: UpdatePersonalDietInput) {
    const existing = await this.owned(user, id);
    return prisma.$transaction(async (tx) => {
      if (data.meals) await tx.personalMeal.deleteMany({ where: { personalDietId: existing.id } });
      return tx.personalDiet.update({
        where: { id: existing.id },
        data: {
          title: data.title, category: data.category, tags: data.tags, notes: data.notes,
          isTemplate: data.isTemplate, dayOfWeek: data.dayOfWeek?.toLowerCase(),
          ...(data.meals
            ? { meals: { create: data.meals.map((m, i) => ({
                mealType: m.mealType as MealType, title: m.title, calories: m.calories, protein: m.protein,
                carbs: m.carbs, fats: m.fats, time: m.time, notes: m.notes, order: m.order ?? i,
              })) } }
            : {}),
        },
        include: dietInclude,
      });
    });
  }

  static async remove(user: AuthUser, id: string) {
    const existing = await this.owned(user, id);
    await prisma.personalDiet.delete({ where: { id: existing.id } });
    return { id: existing.id };
  }

  static async duplicate(user: AuthUser, id: string) {
    const src = await this.owned(user, id);
    return prisma.personalDiet.create({
      data: {
        gymId: src.gymId, memberId: src.memberId, title: `${src.title} (Copy)`, category: src.category,
        tags: src.tags, notes: src.notes, isTemplate: false,
        meals: { create: src.meals.map((m) => ({
          mealType: m.mealType, title: m.title, calories: m.calories, protein: m.protein,
          carbs: m.carbs, fats: m.fats, time: m.time, notes: m.notes, order: m.order,
        })) },
      },
      include: dietInclude,
    });
  }

  static async setArchived(user: AuthUser, id: string, isArchived: boolean) {
    const existing = await this.owned(user, id);
    return prisma.personalDiet.update({ where: { id: existing.id }, data: { isArchived }, include: dietInclude });
  }

  static async toggleFavorite(user: AuthUser, id: string) {
    const existing = await this.owned(user, id);
    return prisma.personalDiet.update({ where: { id: existing.id }, data: { isFavorite: !existing.isFavorite }, include: dietInclude });
  }

  /** Personal diets grouped into a Mon–Sun week (by dayOfWeek) with macro totals. */
  static async week(user: AuthUser) {
    const gymId = requireGym(user);
    const memberId = await this.myMemberId(user);
    const items = await prisma.personalDiet.findMany({
      where: { gymId, memberId, isArchived: false, dayOfWeek: { not: null } },
      include: dietInclude,
    });
    return {
      days: ORDER.map((day) => {
        const diets = items.filter((d) => (d.dayOfWeek ?? "").toLowerCase() === day);
        const totals = diets.flatMap((d) => d.meals).reduce(
          (a, m) => ({ kcal: a.kcal + (m.calories ?? 0), protein: a.protein + (m.protein ?? 0), carbs: a.carbs + (m.carbs ?? 0), fats: a.fats + (m.fats ?? 0) }),
          { kcal: 0, protein: 0, carbs: 0, fats: 0 },
        );
        return { day, diets, totals };
      }),
    };
  }

  static async stats(user: AuthUser) {
    const gymId = requireGym(user);
    const memberId = await this.myMemberId(user);
    const diets = await prisma.personalDiet.findMany({
      where: { gymId, memberId, isArchived: false },
      include: { meals: { select: { calories: true, protein: true, carbs: true, fats: true } } },
    });
    const totals = diets.flatMap((d) => d.meals).reduce(
      (a, m) => ({ kcal: a.kcal + (m.calories ?? 0), protein: a.protein + (m.protein ?? 0), carbs: a.carbs + (m.carbs ?? 0), fats: a.fats + (m.fats ?? 0) }),
      { kcal: 0, protein: 0, carbs: 0, fats: 0 },
    );
    return { total: diets.length, favorites: diets.filter((d) => d.isFavorite).length, templates: diets.filter((d) => d.isTemplate).length, plannedTotals: totals };
  }

  static async getWater(user: AuthUser, date?: string) {
    const memberId = await this.myMemberId(user);
    const day = utcDay(date);
    const log = await prisma.waterLog.findUnique({ where: { memberId_date: { memberId, date: day } } });
    return { date: day.toISOString().slice(0, 10), glasses: log?.glasses ?? 0 };
  }

  static async setWater(user: AuthUser, glasses: number, date?: string) {
    const gymId = requireGym(user);
    const memberId = await this.myMemberId(user);
    const day = utcDay(date);
    const log = await prisma.waterLog.upsert({
      where: { memberId_date: { memberId, date: day } },
      update: { glasses },
      create: { gymId, memberId, date: day, glasses },
    });
    return { date: day.toISOString().slice(0, 10), glasses: log.glasses };
  }
}
