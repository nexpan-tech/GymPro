import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    lead: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), create: vi.fn() },
    leadActivity: { create: vi.fn(), findMany: vi.fn() },
  },
}))

vi.mock('../../config/db', () => ({ prisma: prismaMock }))

import { LeadService } from '../../modules/lead/lead.service'

const admin = { id: 'u1', role: 'ADMIN', gymId: 'gym1' }

beforeEach(() => vi.clearAllMocks())

describe('LeadService CRM activity log (Stage 7)', () => {
  it('addActivity records an entry against an owned lead', async () => {
    prismaMock.lead.findFirst.mockResolvedValue({ id: 'l1', gymId: 'gym1', status: 'NEW' })
    prismaMock.leadActivity.create.mockResolvedValue({ id: 'a1' })

    await LeadService.addActivity(admin, 'l1', { type: 'CALL', note: 'Called, interested' })
    expect(prismaMock.leadActivity.create).toHaveBeenCalledTimes(1)
    const data = prismaMock.leadActivity.create.mock.calls[0][0].data
    expect(data).toMatchObject({ gymId: 'gym1', leadId: 'l1', type: 'CALL', createdById: 'u1' })
  })

  it('TENANT ISOLATION: cannot add activity to another gym’s lead', async () => {
    prismaMock.lead.findFirst.mockResolvedValue(null) // not found in this gym
    await expect(LeadService.addActivity(admin, 'other-gym-lead', { note: 'x' })).rejects.toThrow()
    expect(prismaMock.leadActivity.create).not.toHaveBeenCalled()
  })

  it('changeStatus records a STATUS_CHANGE transition with from/to', async () => {
    prismaMock.lead.findFirst.mockResolvedValue({ id: 'l1', gymId: 'gym1', status: 'NEW', convertedAt: null })
    prismaMock.lead.update.mockResolvedValue({ id: 'l1', status: 'CONTACTED' })

    await LeadService.changeStatus(admin, 'l1', 'CONTACTED')
    const act = prismaMock.leadActivity.create.mock.calls[0][0].data
    expect(act.type).toBe('STATUS_CHANGE')
    expect(act.fromStatus).toBe('NEW')
    expect(act.toStatus).toBe('CONTACTED')
  })

  it('changeStatus to CONVERTED stamps convertedAt + CONVERSION activity', async () => {
    prismaMock.lead.findFirst.mockResolvedValue({ id: 'l1', gymId: 'gym1', status: 'TRIAL', convertedAt: null })
    prismaMock.lead.update.mockResolvedValue({ id: 'l1', status: 'CONVERTED' })

    await LeadService.changeStatus(admin, 'l1', 'CONVERTED')
    const updateData = prismaMock.lead.update.mock.calls[0][0].data
    expect(updateData.status).toBe('CONVERTED')
    expect(updateData.convertedAt).toBeInstanceOf(Date)
    expect(prismaMock.leadActivity.create.mock.calls[0][0].data.type).toBe('CONVERSION')
  })
})

describe('LeadService funnel includes Stage 7 stages', () => {
  it('counts INTERESTED/TRIAL without NaN and computes conversion rate', async () => {
    prismaMock.lead.findMany.mockResolvedValue([
      { status: 'NEW', source: 'WALK_IN' },
      { status: 'INTERESTED', source: 'REFERRAL' },
      { status: 'TRIAL', source: 'INSTAGRAM' },
      { status: 'CONVERTED', source: 'WEBSITE' },
    ])
    const f = await LeadService.getFunnelAnalytics(admin)
    expect(f.funnel.INTERESTED).toBe(1)
    expect(f.funnel.TRIAL).toBe(1)
    expect(f.conversionRate).toBe(25) // 1/4
    expect(Number.isNaN(f.funnel.NEW)).toBe(false)
  })
})
