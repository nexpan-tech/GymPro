import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock, queueMock, recomputeAll } = vi.hoisted(() => ({
  prismaMock: {
    member: { findMany: vi.fn() },
    notification: { create: vi.fn() },
    trialMembership: { updateMany: vi.fn(), findMany: vi.fn() },
  },
  queueMock: { add: vi.fn() },
  recomputeAll: vi.fn(),
}))

vi.mock('../../config/db', () => ({ prisma: prismaMock }))
vi.mock('../../config/logger', () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }))
vi.mock('../../queues/notification.queue', () => ({ notificationQueue: queueMock }))
vi.mock('../../modules/retention/retention.service', () => ({
  RetentionService: { recomputeAll },
}))

import { processChurnRiskAlerts } from '../../jobs/churnRisk.job'
import { processTrialConversionReminders } from '../../jobs/trialConversion.job'
import { processScoreRecompute } from '../../jobs/scoreRecompute.job'

beforeEach(() => vi.clearAllMocks())

describe('Churn risk alert job (Stage 7)', () => {
  it('notifies for each HIGH/CRITICAL member and enqueues delivery', async () => {
    prismaMock.member.findMany.mockResolvedValue([
      { id: 'm1', gymId: 'g1', riskLevel: 'CRITICAL', riskScore: 90, user: { name: 'Asha' }, trainer: { name: 'Coach' } },
      { id: 'm2', gymId: 'g1', riskLevel: 'HIGH', riskScore: 60, user: { name: 'Ben' }, trainer: null },
    ])
    prismaMock.notification.create.mockResolvedValue({ id: 'n1', type: 'GENERAL' })

    const res = await processChurnRiskAlerts()
    expect(res.success).toBe(true)
    expect(res.createdCount).toBe(2)
    expect(prismaMock.notification.create).toHaveBeenCalledTimes(2)
    expect(queueMock.add).toHaveBeenCalledTimes(2)
    // Only HIGH/CRITICAL are queried.
    expect(prismaMock.member.findMany.mock.calls[0][0].where.riskLevel).toEqual({ in: ['HIGH', 'CRITICAL'] })
  })
})

describe('Trial conversion reminder job (Stage 7)', () => {
  it('lapses expired trials and reminds for trials ending soon', async () => {
    prismaMock.trialMembership.updateMany.mockResolvedValue({ count: 2 })
    prismaMock.trialMembership.findMany.mockResolvedValue([
      { id: 't1', gymId: 'g1', endDate: new Date(Date.now() + 86_400_000), lead: { name: 'Lead A' }, member: null },
    ])
    prismaMock.notification.create.mockResolvedValue({ id: 'n1' })

    const res = await processTrialConversionReminders()
    expect(res.success).toBe(true)
    expect(res.expired).toBe(2)
    expect(res.createdCount).toBe(1)
    expect(prismaMock.notification.create).toHaveBeenCalledTimes(1)
  })
})

describe('Nightly score recompute job (Stage 7)', () => {
  it('delegates to RetentionService.recomputeAll', async () => {
    recomputeAll.mockResolvedValue({ gyms: 3, membersScored: 42 })
    const res = await processScoreRecompute()
    expect(recomputeAll).toHaveBeenCalledTimes(1)
    expect(res).toMatchObject({ success: true, gyms: 3, membersScored: 42 })
  })

  it('returns a failure envelope when recompute throws', async () => {
    recomputeAll.mockRejectedValue(new Error('db down'))
    const res = await processScoreRecompute()
    expect(res.success).toBe(false)
  })
})
