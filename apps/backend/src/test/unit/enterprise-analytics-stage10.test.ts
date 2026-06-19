import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock, billingMock, retentionMock, gamificationMock, revenueMock } = vi.hoisted(() => ({
  prismaMock: {
    deliveryLog: { findMany: vi.fn() },
    announcement: { count: vi.fn() },
    membership: { findMany: vi.fn() },
  },
  billingMock: { overview: vi.fn(), revenueTrend: vi.fn() },
  retentionMock: { getPlatformOverview: vi.fn() },
  gamificationMock: { getPlatformEngagement: vi.fn() },
  revenueMock: { summary: vi.fn(), revenueTrend: vi.fn() },
}))

vi.mock('../../config/db', () => ({ prisma: prismaMock }))
vi.mock('../../modules/billing/billing.analytics.service', () => ({ BillingAnalyticsService: billingMock }))
vi.mock('../../modules/retention/retention.service', () => ({ RetentionService: retentionMock }))
vi.mock('../../modules/gamification/gamification.service', () => ({ GamificationService: gamificationMock }))
// Stage 12 — revenue (MRR/ARR/trend) now comes from the single source of truth.
vi.mock('../../modules/super-admin/revenue.service', () => ({ RevenueSummaryService: revenueMock }))

import { EnterpriseService } from '../../modules/enterprise/enterprise.service'

beforeEach(() => {
  vi.clearAllMocks()
  billingMock.overview.mockResolvedValue({ mrr: 50000, arr: 600000, activeGyms: 12, trialGyms: 3, churnRate: 4 })
  billingMock.revenueTrend.mockResolvedValue([{ month: '2026-06', revenue: 50000 }])
  revenueMock.summary.mockResolvedValue({ mrr: 50000, arr: 600000, paid: 0, pending: 0, overdue: 0 })
  revenueMock.revenueTrend.mockResolvedValue([{ month: '2026-06', revenue: 50000 }])
  retentionMock.getPlatformOverview.mockResolvedValue({
    totalGyms: 15, totalMembers: 800, atRiskMembers: 40, retentionRate: 82, churnRate: 5,
    leadConversionRate: 30, trialConversionRate: 45, perGym: [{ gymId: 'g1', name: 'Gym A', members: 100, atRisk: 5, leadConversionRate: 40 }],
  })
  gamificationMock.getPlatformEngagement.mockResolvedValue({
    totalChallengeParticipations: 120, totalRedemptions: 30, totalReferrals: 25,
    referralConversionRate: 60, avgLevel: 3.2, totalPoints: 100000,
  })
  prismaMock.deliveryLog.findMany.mockResolvedValue([{ status: 'SENT' }, { status: 'SENT' }, { status: 'FAILED' }, { status: 'SKIPPED' }])
  prismaMock.announcement.count.mockResolvedValue(7)
  prismaMock.membership.findMany.mockResolvedValue([{ memberId: 'a' }, { memberId: 'b' }])
})

describe('EnterpriseService.overview (Stage 10 unified analytics)', () => {
  it('aggregates billing + retention + engagement + communication (reusing existing services)', async () => {
    const o = await EnterpriseService.overview()

    expect(o.revenue).toMatchObject({ mrr: 50000, arr: 600000, churnRate: 4 })
    expect(o.revenue.revenueTrend).toHaveLength(1)
    expect(o.members).toMatchObject({ activeGyms: 12, trialGyms: 3, totalGyms: 15, totalMembers: 800, activeMembers: 2 })
    expect(o.retention).toMatchObject({ retentionRate: 82, atRiskMembers: 40, leadConversionRate: 30 })
    expect(o.engagement).toMatchObject({ challengeParticipations: 120, rewardRedemptions: 30, referrals: 25 })
    expect(o.communication).toMatchObject({ messagesSent: 2, messagesFailed: 1, announcementsSent: 7 })
    expect(o.topGyms[0].name).toBe('Gym A')

    // It delegates rather than recomputing.
    expect(billingMock.overview).toHaveBeenCalled()
    expect(retentionMock.getPlatformOverview).toHaveBeenCalled()
    expect(gamificationMock.getPlatformEngagement).toHaveBeenCalled()
  })
})
