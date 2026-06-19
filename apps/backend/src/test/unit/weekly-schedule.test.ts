import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    member: { findFirst: vi.fn() },
    workoutAssignment: { findMany: vi.fn(), updateMany: vi.fn() },
    dietPlan: { findFirst: vi.fn() },
  } as any,
}));

vi.mock("../../config/db", () => ({ prisma: prismaMock }));
vi.mock("../../modules/gamification/engagement-events.service", () => ({ GamificationEvents: {} }));

import { WorkoutAssignmentService } from "../../modules/workout/workout-assignment.service";
import { DietService } from "../../modules/diet/diet.service";
import type { Role } from "@prisma/client";

const user = { id: "u1", role: "MEMBER" as Role, gymId: "g1" };

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.member.findFirst.mockResolvedValue({ id: "m1", userId: "u1", gymId: "g1" });
  prismaMock.workoutAssignment.updateMany.mockResolvedValue({ count: 0 });
});

describe("Phase D — GET /workout/week", () => {
  it("returns a Mon–Sun week with assigned days and REST days", async () => {
    // Assign Tuesday of the week containing 2026-01-07 (a Wednesday → week Mon 01-05..Sun 01-11).
    prismaMock.workoutAssignment.findMany.mockResolvedValue([
      {
        id: "a1", status: "SCHEDULED", scheduledDate: new Date("2026-01-06T00:00:00.000Z"),
        workoutPlan: { id: "wp1", title: "Push Day", difficulty: "INTERMEDIATE", exercises: [
          { exercise: { muscleGroup: "Chest" } }, { exercise: { muscleGroup: "Triceps" } },
        ] },
      },
    ]);
    const res = await WorkoutAssignmentService.getWeek(user, "2026-01-07");
    expect(res.days).toHaveLength(7);
    expect(res.days[0].weekday).toBe("monday");
    const tue = res.days[1];
    expect(tue.weekday).toBe("tuesday");
    expect(tue.status).toBe("SCHEDULED");
    expect(tue.plan?.title).toBe("Push Day");
    expect(tue.plan?.exerciseCount).toBe(2);
    expect(tue.plan?.muscles).toEqual(["Chest", "Triceps"]);
    // A day with no assignment is a REST day.
    expect(res.days[0].status).toBe("REST");
    expect(res.days[0].plan).toBeNull();
  });

  it("maps EXPIRED assignments to MISSED", async () => {
    prismaMock.workoutAssignment.findMany.mockResolvedValue([
      { id: "a1", status: "EXPIRED", scheduledDate: new Date("2026-01-05T00:00:00.000Z"), workoutPlan: { id: "wp1", title: "Legs", difficulty: "HARD", exercises: [] } },
    ]);
    const res = await WorkoutAssignmentService.getWeek(user, "2026-01-07");
    expect(res.days[0].status).toBe("MISSED");
  });
});

describe("Phase D — GET /diet/my/week", () => {
  it("groups meals into a Mon–Sun week with macro totals", async () => {
    prismaMock.dietPlan.findFirst.mockResolvedValue({
      id: "dp1", goal: "Cut",
      meals: [
        { id: "x1", dayOfWeek: "monday", mealType: "BREAKFAST", title: "Oats", calories: 300, protein: 20, carbs: 40, fats: 5 },
        { id: "x2", dayOfWeek: "monday", mealType: "LUNCH", title: "Chicken", calories: 500, protein: 45, carbs: 30, fats: 12 },
        { id: "x3", dayOfWeek: "wednesday", mealType: "DINNER", title: "Salmon", calories: 600, protein: 40, carbs: 10, fats: 30 },
      ],
    });
    const res = await DietService.getMyWeek(user);
    expect(res.days).toHaveLength(7);
    const mon = res.days[0];
    expect(mon.day).toBe("monday");
    expect(mon.mealCount).toBe(2);
    expect(mon.totals).toEqual({ kcal: 800, protein: 65, carbs: 70, fats: 17 });
    expect(mon.source).toBe("TRAINER");
    // Tuesday has no meals.
    expect(res.days[1].mealCount).toBe(0);
    expect(res.days[1].source).toBeNull();
  });
});
