import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Role } from "@prisma/client";

const { prismaMock } = vi.hoisted(() => {
  const prismaMock: any = {
    member: { findFirst: vi.fn() },
    personalWorkout: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
    personalWorkoutExercise: { deleteMany: vi.fn() },
    personalWorkoutCompletion: { create: vi.fn(), count: vi.fn(), findMany: vi.fn() },
    personalDiet: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
    personalMeal: { deleteMany: vi.fn() },
    waterLog: { findUnique: vi.fn(), upsert: vi.fn() },
  };
  prismaMock.$transaction = vi.fn(async (fn: any) => fn(prismaMock));
  return { prismaMock };
});

vi.mock("../../config/db", () => ({ prisma: prismaMock }));

import { PersonalWorkoutService } from "../../modules/personal-workout/personal-workout.service";
import { PersonalDietService } from "../../modules/personal-diet/personal-diet.service";

const user = { id: "u1", role: "MEMBER" as Role, gymId: "g1" };

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.member.findFirst.mockResolvedValue({ id: "m1" });
});

describe("PersonalWorkoutService", () => {
  it("creates a self-scoped personal workout with exercises", async () => {
    prismaMock.personalWorkout.create.mockImplementation(({ data }: any) => Promise.resolve({ id: "pw1", ...data }));
    await PersonalWorkoutService.create(user, { title: "Weekend Cardio", category: "CARDIO", exercises: [{ name: "Run", sets: 1, reps: "30min" }] });
    const arg = prismaMock.personalWorkout.create.mock.calls[0][0].data;
    expect(arg.gymId).toBe("g1");
    expect(arg.memberId).toBe("m1");
    expect(arg.exercises.create[0]).toMatchObject({ name: "Run", order: 0 });
  });

  it("list defaults to non-archived + favorites first, self-scoped", async () => {
    prismaMock.personalWorkout.findMany.mockResolvedValue([]);
    await PersonalWorkoutService.list(user, {});
    const call = prismaMock.personalWorkout.findMany.mock.calls[0][0];
    expect(call.where).toMatchObject({ gymId: "g1", memberId: "m1", isArchived: false });
    expect(call.orderBy[0]).toEqual({ isFavorite: "desc" });
  });

  it("404s when accessing a workout that isn't the member's", async () => {
    prismaMock.personalWorkout.findFirst.mockResolvedValue(null);
    await expect(PersonalWorkoutService.get(user, "other")).rejects.toThrow(/not found/i);
    expect(prismaMock.personalWorkout.findFirst.mock.calls[0][0].where).toMatchObject({ id: "other", gymId: "g1", memberId: "m1" });
  });

  it("toggles favorite + duplicate resets template + records completion", async () => {
    prismaMock.personalWorkout.findFirst.mockResolvedValue({ id: "pw1", gymId: "g1", memberId: "m1", isFavorite: false, title: "Leg", category: null, tags: [], notes: null, difficulty: null, estMinutes: null, exercises: [{ name: "Squat", sets: 5, reps: "5", order: 0 }] });
    prismaMock.personalWorkout.update.mockResolvedValue({ id: "pw1", isFavorite: true });
    await PersonalWorkoutService.toggleFavorite(user, "pw1");
    expect(prismaMock.personalWorkout.update.mock.calls[0][0].data).toEqual({ isFavorite: true });

    prismaMock.personalWorkout.create.mockImplementation(({ data }: any) => Promise.resolve({ id: "pw2", ...data }));
    await PersonalWorkoutService.duplicate(user, "pw1");
    const dup = prismaMock.personalWorkout.create.mock.calls[0][0].data;
    expect(dup.title).toBe("Leg (Copy)");
    expect(dup.isTemplate).toBe(false);

    prismaMock.personalWorkoutCompletion.create.mockResolvedValue({ id: "c1" });
    await PersonalWorkoutService.complete(user, "pw1", { durationMinutes: 40 });
    expect(prismaMock.personalWorkoutCompletion.create.mock.calls[0][0].data).toMatchObject({ personalWorkoutId: "pw1", durationMinutes: 40 });
  });

  it("groups personal workouts into a Mon–Sun week", async () => {
    prismaMock.personalWorkout.findMany.mockResolvedValue([{ id: "pw1", dayOfWeek: "monday", exercises: [] }]);
    const res = await PersonalWorkoutService.week(user);
    expect(res.days).toHaveLength(7);
    expect(res.days[0].day).toBe("monday");
    expect(res.days[0].workouts).toHaveLength(1);
  });
});

describe("PersonalDietService", () => {
  it("upserts today's water log per member+day", async () => {
    prismaMock.waterLog.upsert.mockResolvedValue({ glasses: 5 });
    const res = await PersonalDietService.setWater(user, 5);
    expect(res.glasses).toBe(5);
    expect(prismaMock.waterLog.upsert.mock.calls[0][0].create).toMatchObject({ gymId: "g1", memberId: "m1", glasses: 5 });
  });

  it("aggregates planned macro totals across non-archived diets", async () => {
    prismaMock.personalDiet.findMany.mockResolvedValue([
      { isFavorite: true, isTemplate: false, meals: [{ calories: 300, protein: 20, carbs: 40, fats: 5 }] },
      { isFavorite: false, isTemplate: true, meals: [{ calories: 500, protein: 45, carbs: 30, fats: 12 }] },
    ]);
    const s = await PersonalDietService.stats(user);
    expect(s.total).toBe(2);
    expect(s.plannedTotals).toEqual({ kcal: 800, protein: 65, carbs: 70, fats: 17 });
  });
});
