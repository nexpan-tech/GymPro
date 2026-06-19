import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    workoutPlan: { findFirst: vi.fn() },
    member: { findMany: vi.fn() },
    workoutAssignment: { createMany: vi.fn() },
  } as any,
}));

vi.mock("../../config/db", () => ({ prisma: prismaMock }));
vi.mock("../../modules/gamification/engagement-events.service", () => ({
  GamificationEvents: { workoutCompleted: vi.fn() },
}));

import { WorkoutAssignmentService } from "../../modules/workout/workout-assignment.service";

const admin = { id: "a1", role: "ADMIN", gymId: "g1" };
const trainer = (id: string) => ({ id, role: "TRAINER", gymId: "g1" });

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.workoutPlan.findFirst.mockResolvedValue({ id: "wp1", trainerId: "t1", gymId: "g1" });
  prismaMock.workoutAssignment.createMany.mockImplementation(({ data }: any) => Promise.resolve({ count: data.length }));
});

describe("WorkoutAssignmentService.assign", () => {
  it("expands a weekly recurrence across members (2 members × Mon/Wed/Fri × 2 weeks = 12)", async () => {
    prismaMock.member.findMany.mockResolvedValue([
      { id: "m1", trainerId: "t1" },
      { id: "m2", trainerId: "t1" },
    ]);
    // 2026-01-05 is a Monday.
    const res = await WorkoutAssignmentService.assign(admin, {
      workoutPlanId: "wp1",
      memberIds: ["m1", "m2"],
      weekly: { weekdays: [1, 3, 5], startDate: "2026-01-05", weeks: 2 },
    });
    expect(res).toEqual({ assigned: 12, members: 2, days: 6 });
    const rows = prismaMock.workoutAssignment.createMany.mock.calls[0][0].data;
    expect(rows).toHaveLength(12);
    expect(prismaMock.workoutAssignment.createMany.mock.calls[0][0].skipDuplicates).toBe(true);
  });

  it("assigns a single one-day workout", async () => {
    prismaMock.member.findMany.mockResolvedValue([{ id: "m1", trainerId: "t1" }]);
    const res = await WorkoutAssignmentService.assign(admin, {
      workoutPlanId: "wp1",
      memberIds: ["m1"],
      scheduledDate: "2026-01-05",
    });
    expect(res).toEqual({ assigned: 1, members: 1, days: 1 });
  });

  it("blocks a trainer from assigning to a member who isn't theirs", async () => {
    prismaMock.member.findMany.mockResolvedValue([{ id: "m1", trainerId: "t1" }]); // owned by t1
    await expect(
      WorkoutAssignmentService.assign(trainer("t2"), {
        workoutPlanId: "wp1",
        memberIds: ["m1"],
        scheduledDate: "2026-01-05",
      }),
    ).rejects.toThrow(/assigned members/i);
  });

  it("rejects when some members aren't in the gym", async () => {
    prismaMock.member.findMany.mockResolvedValue([{ id: "m1", trainerId: "t1" }]); // only 1 of 2 found
    await expect(
      WorkoutAssignmentService.assign(admin, {
        workoutPlanId: "wp1",
        memberIds: ["m1", "ghost"],
        scheduledDate: "2026-01-05",
      }),
    ).rejects.toThrow(/not found/i);
  });

  it("404s when the plan isn't in the gym", async () => {
    prismaMock.workoutPlan.findFirst.mockResolvedValue(null);
    await expect(
      WorkoutAssignmentService.assign(admin, { workoutPlanId: "nope", memberIds: ["m1"], scheduledDate: "2026-01-05" }),
    ).rejects.toThrow(/plan not found/i);
  });
});
