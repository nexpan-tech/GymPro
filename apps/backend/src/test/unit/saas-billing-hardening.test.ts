import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock, sendEmailMock, auditMock, pdfMock } = vi.hoisted(() => {
  const prismaMock: any = {
    member: { groupBy: vi.fn() },
    gym: { findMany: vi.fn() },
    user: { findFirst: vi.fn() },
    platformBillingSettings: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    saaSInvoice: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), findMany: vi.fn() },
  };
  return { prismaMock, sendEmailMock: vi.fn(), auditMock: vi.fn(), pdfMock: vi.fn() };
});

vi.mock("../../config/db", () => ({ prisma: prismaMock }));
vi.mock("../../modules/email/email.service", () => ({ sendEmail: sendEmailMock }));
vi.mock("../../utils/audit", () => ({ createAuditLog: auditMock }));
vi.mock("../../modules/reports/pdf.service", () => ({ generateSaaSInvoicePdf: pdfMock }));
vi.mock("../../config/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { SaaSBillingService } from "../../modules/super-admin/saas-billing.service";
import { PlatformSettingsService } from "../../modules/super-admin/platform-settings.service";
import { RevenueSummaryService } from "../../modules/super-admin/revenue.service";

const SETTINGS = {
  id: "set-1", companyName: "Nexpan Tech", invoicePrefix: "NXP", dueDays: 20,
  defaultGstPercent: 18, invoiceFooter: "Thanks", gstNumber: "GSTIN123", isActive: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  sendEmailMock.mockResolvedValue({ skipped: true });
  pdfMock.mockResolvedValue(Buffer.from("PDF"));
  prismaMock.platformBillingSettings.findFirst.mockResolvedValue(SETTINGS);
});

describe("#1 Billing uniqueness — race-safe (P2002)", () => {
  it("treats a parallel duplicate (P2002) as a clean skip, never a crash, and audits it", async () => {
    prismaMock.member.groupBy.mockResolvedValue([{ gymId: "g1", _count: { _all: 20 } }]);
    prismaMock.gym.findMany.mockResolvedValue([
      { id: "g1", name: "Gym One", email: "g1@x.com", gstPercent: 18, pricePerActiveMember: 20, gstNumber: null, users: [] },
    ]);
    prismaMock.saaSInvoice.findFirst.mockResolvedValue(null); // fast-path: none yet
    // ...but the concurrent request wins the unique race:
    prismaMock.saaSInvoice.create.mockRejectedValue(Object.assign(new Error("Unique"), { code: "P2002" }));

    const res = await SaaSBillingService.generateInvoices("2026-07");
    expect(res.created).toBe(0);
    expect(res.skipped).toBe(1);
    const audited = auditMock.mock.calls.map((c: any[]) => c[0].newData.event);
    expect(audited).toContain("INVOICE_DUPLICATE_BLOCKED");
  });
});

describe("#2/#4 Generation uses platform settings + snapshot + PDF url + audit", () => {
  it("uses the settings invoice prefix + due days, freezes a seller snapshot, sets pdfUrl, and audits GENERATED", async () => {
    prismaMock.member.groupBy.mockResolvedValue([{ gymId: "gym-abc123", _count: { _all: 20 } }]);
    prismaMock.gym.findMany.mockResolvedValue([
      { id: "gym-abc123", name: "Gym One", email: "g1@x.com", gstPercent: 18, pricePerActiveMember: 20, gstNumber: null, users: [{ email: "a@g1.com" }] },
    ]);
    prismaMock.saaSInvoice.findFirst.mockResolvedValue(null);
    prismaMock.saaSInvoice.create.mockImplementation(({ data }: any) => Promise.resolve({ id: "inv1", ...data }));
    prismaMock.saaSInvoice.update.mockImplementation(({ data }: any) => Promise.resolve({ id: "inv1", ...data }));

    const res = await SaaSBillingService.generateInvoices("2026-07");
    expect(res.created).toBe(1);
    const createData = prismaMock.saaSInvoice.create.mock.calls[0][0].data;
    expect(createData.invoiceNumber).toMatch(/^NXP-202607-/); // settings prefix
    expect(createData.sellerSnapshot.companyName).toBe("Nexpan Tech"); // frozen identity
    // due date ≈ +20 days (settings.dueDays)
    const days = Math.round((new Date(createData.dueDate).getTime() - Date.now()) / 86400000);
    expect(days).toBeGreaterThanOrEqual(19);
    // pdfUrl stored on the follow-up update
    expect(prismaMock.saaSInvoice.update.mock.calls[0][0].data.pdfUrl).toContain("/billing/invoices/inv1/pdf");
    const events = auditMock.mock.calls.map((c: any[]) => c[0].newData.event);
    expect(events).toContain("INVOICE_GENERATED");
  });
});

describe("#2 Invoice PDF retrieval", () => {
  it("renders a PDF buffer from the frozen sellerSnapshot", async () => {
    prismaMock.saaSInvoice.findUnique.mockResolvedValue({
      id: "inv1", invoiceNumber: "NXP-202607-ABC", dueDate: new Date(),
      sellerSnapshot: { companyName: "Nexpan Tech" },
      gym: { id: "g1", name: "Gym One", email: "g1@x.com", gstNumber: null, address: null },
    });
    const { buffer, filename } = await SaaSBillingService.getInvoicePdf("inv1");
    expect(buffer).toBeInstanceOf(Buffer);
    expect(filename).toBe("NXP-202607-ABC.pdf");
    // PDF rendered from the snapshot, not live settings.
    expect(pdfMock.mock.calls[0][1].companyName).toBe("Nexpan Tech");
  });

  it("blocks a gym admin from another gym's invoice PDF", async () => {
    prismaMock.saaSInvoice.findUnique.mockResolvedValue({ id: "inv1", invoiceNumber: "X", dueDate: new Date(), gymId: "g1", sellerSnapshot: {}, gym: {} });
    prismaMock.user.findFirst.mockResolvedValue({ id: "u1", gymId: "OTHER", role: "ADMIN" });
    await expect(SaaSBillingService.getInvoicePdf("inv1", "u1")).rejects.toThrow(/your own gym/i);
  });
});

describe("#4 PlatformSettingsService", () => {
  it("creates a default singleton when none exists", async () => {
    prismaMock.platformBillingSettings.findFirst.mockResolvedValue(null);
    prismaMock.platformBillingSettings.create.mockResolvedValue({ id: "new", companyName: "Nexpan Tech" });
    const s = await PlatformSettingsService.get();
    expect(s.companyName).toBe("Nexpan Tech");
    expect(prismaMock.platformBillingSettings.create).toHaveBeenCalled();
  });

  it("only writes editable fields and ignores unknown/immutable ones", async () => {
    prismaMock.platformBillingSettings.update.mockImplementation(({ data }: any) => Promise.resolve({ id: "set-1", ...data }));
    await PlatformSettingsService.update({ gstNumber: "NEWGST", defaultGstPercent: "12", id: "hack", isActive: false } as any);
    const data = prismaMock.platformBillingSettings.update.mock.calls[0][0].data;
    expect(data.gstNumber).toBe("NEWGST");
    expect(data.defaultGstPercent).toBe(12); // coerced to number
    expect(data.id).toBeUndefined(); // immutable
    expect(data.isActive).toBeUndefined(); // not in editable allow-list
  });
});

describe("#5 RevenueSummaryService — single source of truth", () => {
  it("MRR = Σ(active members × price); ARR = MRR × 12", async () => {
    prismaMock.member.groupBy.mockResolvedValue([
      { gymId: "g1", _count: { _all: 20 } },
      { gymId: "g2", _count: { _all: 5 } },
    ]);
    prismaMock.gym.findMany.mockResolvedValue([
      { id: "g1", pricePerActiveMember: 20 },
      { id: "g2", pricePerActiveMember: 50 },
    ]);
    prismaMock.saaSInvoice.findMany.mockResolvedValue([]);
    const s = await RevenueSummaryService.summary();
    expect(s.mrr).toBe(650);
    expect(s.arr).toBe(7800);
  });

  it("SaaSBillingService.revenueSummary delegates to the SSOT (same numbers everywhere)", async () => {
    prismaMock.member.groupBy.mockResolvedValue([{ gymId: "g1", _count: { _all: 10 } }]);
    prismaMock.gym.findMany.mockResolvedValue([{ id: "g1", pricePerActiveMember: 30 }]);
    prismaMock.saaSInvoice.findMany.mockResolvedValue([]);
    const a = await RevenueSummaryService.summary();
    const b = await SaaSBillingService.revenueSummary();
    expect(b).toEqual(a);
  });
});
