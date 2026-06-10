import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    member: { findMany: vi.fn(), update: vi.fn() },
    membership: { findMany: vi.fn() },
    lead: { findMany: vi.fn() },
    trialMembership: { findMany: vi.fn() },
    gym: { findMany: vi.fn() },
  },
}))

vi.mock('../../config/db', () => ({ prisma: prismaMock }))

import { RetentionService } from '../../modules/retention/retention.service'

const user = { id: 'u1', role: 'ADMIN', gymId: 'gym1' }

beforeEach(() => vi.clearAllMocks())

describe('RetentionService.getOverview (Stage 7)', () => {
  it('computes retention/churn/lead/trial conversion rates', async () => {
    prismaMock.member.findMany.mockResolvedValue([
      { riskLevel: 'LOW', riskScore: 10, retentionScore: 80 },
      { riskLevel: 'HIGH', riskScore: 60, retentionScore: 30 },
      { riskLevel: 'CRITICAL', riskScore: 90, retentionScore: 10 },
      { riskLevel: 'MEDIUM', riskScore: 30, retentionScore: 50 },
    ])
    const now = Date.now()
    prismaMock.membership.findMany.mockResolvedValue([
      { endDate: new Date(now + 1e9) }, // active
      { endDate: new Date(now + 1e9) }, // active
      { endDate: new Date(now - 1e9) }, // expired
    ])
    prismaMock.lead.findMany.mockResolvedValue([
      { status: 'CONVERTED' }, { status: 'NEW' }, { status: 'LOST' }, { status: 'CONVERTED' },
    ])
    prismaMock.trialMembership.findMany.mockResolvedValue([
      { status: 'CONVERTED' }, { status: 'ACTIVE' },
    ])

    const o = await RetentionService.getOverview(user)
    expect(o.totalMembers).toBe(4)
    expect(o.atRiskMembers).toBe(2) // HIGH + CRITICAL
    expect(o.riskBreakdown.CRITICAL).toBe(1)
    expect(o.retentionRate).toBe(66.67) // 2/3
    expect(o.churnRate).toBe(50) // 2/4
    expect(o.leadConversionRate).toBe(50) // 2/4
    expect(o.trialConversionRate).toBe(50) // 1/2
  })

  it('rejects calls without gym context', async () => {
    await expect(RetentionService.getOverview({ id: 'x', role: 'ADMIN', gymId: null })).rejects.toThrow()
  })
})

describe('RetentionService.recomputeGym (Stage 7)', () => {
  it('persists a score + scoredAt for each member', async () => {
    prismaMock.member.findMany.mockResolvedValue([
      {
        id: 'm1',
        attendances: [{ date: new Date() }],
        workoutCompletions: [{ id: 'w' }],
        dietCompletions: [],
        bodyMeasurements: [],
        dues: [],
        memberships: [{ endDate: new Date(Date.now() + 1e9) }],
      },
    ])
    const res = await RetentionService.recomputeGym('gym1')
    expect(res.updated).toBe(1)
    expect(prismaMock.member.update).toHaveBeenCalledTimes(1)
    const arg = prismaMock.member.update.mock.calls[0][0]
    expect(arg.where).toEqual({ id: 'm1' })
    expect(arg.data).toHaveProperty('riskLevel')
    expect(arg.data).toHaveProperty('retentionScore')
    expect(arg.data.scoredAt).toBeInstanceOf(Date)
  })
})
