import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => {
  const prismaMock: any = {
    gym: { findMany: vi.fn(), count: vi.fn() },
    member: { groupBy: vi.fn(), count: vi.fn() },
    branch: { groupBy: vi.fn() },
    user: { groupBy: vi.fn(), count: vi.fn() },
  };
  return { prismaMock };
});

vi.mock("../../config/db", () => ({ prisma: prismaMock }));
// Stub heavy side-effect imports pulled in transitively by platform.service.
vi.mock("../../queues/notification.queue", () => ({ notificationQueue: {} }));
vi.mock("../../queues/sms.queue", () => ({ smsQueue: {} }));
vi.mock("../../queues/dlq", () => ({ deadLetterQueue: {} }));
vi.mock("../../queues/queueMonitor", () => ({ getQueueStats: vi.fn() }));
vi.mock("../../modules/email/email.service", () => ({ sendEmail: vi.fn() }));
vi.mock("../../config/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { PlatformService } from "../../modules/super-admin/platform.service";

beforeEach(() => vi.clearAllMocks());

describe("PlatformService.gyms — real counts + pricing (no dummy data)", () => {
  it("counts only ACTIVE members as active, with total separately, and bills active × price", async () => {
    prismaMock.gym.findMany.mockResolvedValue([
      { id: "g1", name: "Gym One", email: "g1@x.com", isActive: true, pricePerActiveMember: 20, gstPercent: 18, createdAt: new Date() },
    ]);
    // member.groupBy is called for ACTIVE (filtered) and for TOTAL (unfiltered).
    prismaMock.member.groupBy.mockImplementation((args: any) => {
      if (args?.where?.status === "ACTIVE") return Promise.resolve([{ gymId: "g1", _count: { _all: 20 } }]);
      return Promise.resolve([{ gymId: "g1", _count: { _all: 25 } }]); // total
    });
    prismaMock.branch.groupBy.mockResolvedValue([{ gymId: "g1", _count: { _all: 3 } }]);
    prismaMock.user.groupBy.mockResolvedValue([
      { gymId: "g1", role: "TRAINER", _count: { _all: 4 } },
      { gymId: "g1", role: "ADMIN", _count: { _all: 1 } },
    ]);

    const rows = await PlatformService.gyms();
    const g1 = rows[0];
    expect(g1.activeMemberCount).toBe(20);
    expect(g1.totalMemberCount).toBe(25);
    expect(g1.branchCount).toBe(3);
    expect(g1.trainerCount).toBe(4);
    expect(g1.gymAdminCount).toBe(1);
    expect(g1.pricePerActiveMember).toBe(20);
    // 20 × 20 = 400 subtotal + 18% GST = 472 monthly.
    expect(g1.monthlyAmount).toBe(472);
    expect(g1.subscriptionStatus).toBe("ACTIVE");
  });
});
