import { describe, it, expect, vi, beforeEach } from "vitest";
import { Role } from "@prisma/client";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    member: { findFirst: vi.fn() },
    dietPlan: { findFirst: vi.fn() },
  } as any,
}));

vi.mock("../../config/db", () => ({ prisma: prismaMock }));
vi.mock("../../modules/gamification/engagement-events.service", () => ({ GamificationEvents: {} }));

import { DietService } from "../../modules/diet/diet.service";

const member = { id: "m1", userId: "u1", gymId: "g1" };
const user = { id: "u1", role: Role.MEMBER, gymId: "g1" };

const plan = {
  id: "dp1",
  goal: "Cutting",
  monday: "Legacy Monday plan text",
  tuesday: null,
  meals: [
    { id: "x1", dayOfWeek: "monday", mealType: "BREAKFAST", title: "Oats", time: "08:00" },
    { id: "x2", dayOfWeek: "Monday", mealType: "LUNCH", title: "Chicken & rice", time: "13:00" },
    { id: "x3", dayOfWeek: "tuesday", mealType: "BREAKFAST", title: "Eggs", time: "08:00" },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.member.findFirst.mockResolvedValue(member);
  prismaMock.dietPlan.findFirst.mockResolvedValue(plan);
});

describe("DietService.getMyToday — day-of-week 'today' view", () => {
  it("returns only the requested day's meals (case-insensitive match)", async () => {
    const res = await DietService.getMyToday(user, "monday");
    expect(res.day).toBe("monday");
    expect(res.mealCount).toBe(2);
    expect(res.meals.map((m: any) => m.title)).toEqual(["Oats", "Chicken & rice"]);
    expect(res.dayPlanText).toBe("Legacy Monday plan text");
  });

  it("accepts a 3-letter weekday abbreviation from the client", async () => {
    const res = await DietService.getMyToday(user, "Tue");
    expect(res.day).toBe("tuesday");
    expect(res.mealCount).toBe(1);
    expect(res.meals[0].title).toBe("Eggs");
    expect(res.dayPlanText).toBeNull();
  });

  it("returns an empty day (no meals) without throwing when the member has no plan", async () => {
    prismaMock.dietPlan.findFirst.mockResolvedValue(null);
    const res = await DietService.getMyToday(user, "monday");
    expect(res).toMatchObject({ day: "monday", plan: null, meals: [], mealCount: 0 });
  });

  it("falls back to the server weekday when no day is supplied", async () => {
    const res = await DietService.getMyToday(user);
    const expected = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][new Date().getDay()];
    expect(res.day).toBe(expected);
  });
});
