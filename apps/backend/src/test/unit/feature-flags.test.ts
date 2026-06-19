import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => {
  const prismaMock: any = {
    featureFlag: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  };
  return { prismaMock };
});
vi.mock("../../config/db", () => ({ prisma: prismaMock }));

import { FeatureFlagService } from "../../modules/feature-flag/feature-flag.service";

beforeEach(() => vi.clearAllMocks());

describe("FeatureFlagService CRUD", () => {
  it("creates a flag with a valid slug key", async () => {
    prismaMock.featureFlag.findUnique.mockResolvedValue(null);
    prismaMock.featureFlag.create.mockImplementation(({ data }: any) => Promise.resolve({ id: "f1", ...data }));
    const flag = await FeatureFlagService.createFlag({ key: "New-Onboarding", label: "New Onboarding" });
    // Key is normalised to lowercase slug.
    expect(prismaMock.featureFlag.create.mock.calls[0][0].data.key).toBe("new-onboarding");
    expect(flag.label).toBe("New Onboarding");
  });

  it("rejects a non-slug key", async () => {
    await expect(FeatureFlagService.createFlag({ key: "Bad Key!", label: "X" })).rejects.toThrow(/slug/i);
    expect(prismaMock.featureFlag.create).not.toHaveBeenCalled();
  });

  it("rejects a duplicate key", async () => {
    prismaMock.featureFlag.findUnique.mockResolvedValue({ key: "ai" });
    await expect(FeatureFlagService.createFlag({ key: "ai", label: "AI" })).rejects.toThrow(/already exists/i);
  });

  it("requires a label", async () => {
    await expect(FeatureFlagService.createFlag({ key: "x", label: "" })).rejects.toThrow(/label/i);
  });

  it("clamps rollout percentage to 0..100 on create", async () => {
    prismaMock.featureFlag.findUnique.mockResolvedValue(null);
    prismaMock.featureFlag.create.mockImplementation(({ data }: any) => Promise.resolve({ id: "f1", ...data }));
    await FeatureFlagService.createFlag({ key: "x", label: "Experiment", rolloutPercentage: 250 });
    expect(prismaMock.featureFlag.create.mock.calls[0][0].data.rolloutPercentage).toBe(100);
  });

  it("updates an existing flag's default toggle", async () => {
    prismaMock.featureFlag.findUnique.mockResolvedValue({ key: "ai", defaultEnabled: true });
    prismaMock.featureFlag.update.mockResolvedValue({ key: "ai", defaultEnabled: false });
    await FeatureFlagService.updateFlag("ai", { defaultEnabled: false });
    expect(prismaMock.featureFlag.update.mock.calls[0][0].data.defaultEnabled).toBe(false);
  });

  it("404s when updating a missing flag", async () => {
    prismaMock.featureFlag.findUnique.mockResolvedValue(null);
    await expect(FeatureFlagService.updateFlag("ghost", { label: "x" })).rejects.toThrow(/not found/i);
  });

  it("soft-deactivates on delete (isActive=false), never hard-deletes", async () => {
    prismaMock.featureFlag.findUnique.mockResolvedValue({ key: "ai" });
    prismaMock.featureFlag.update.mockResolvedValue({ key: "ai", isActive: false });
    await FeatureFlagService.deleteFlag("ai");
    expect(prismaMock.featureFlag.update.mock.calls[0][0].data.isActive).toBe(false);
  });

  it("listAll surfaces per-flag override counts", async () => {
    prismaMock.featureFlag.findMany.mockResolvedValue([
      { id: "f1", key: "ai", label: "AI", description: null, category: "Intelligence", defaultEnabled: true, createdAt: new Date(), updatedAt: new Date(), assignments: [{ enabled: true }, { enabled: false }] },
    ]);
    const rows = await FeatureFlagService.listAll();
    expect(rows[0].overrides).toBe(2);
    expect(rows[0].enabledOverrides).toBe(1);
    expect(rows[0].disabledOverrides).toBe(1);
  });
});
