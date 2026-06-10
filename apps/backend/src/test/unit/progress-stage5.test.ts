import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Role } from '@prisma/client'

const { prismaMock } = vi.hoisted(() => {
  // Stage 8 engagement-engine surface so the points event hook fired by
  // production code (progressUpdated) runs silently in unit tests.
  const engagement = {
    pointTransaction: { create: vi.fn().mockResolvedValue({}), aggregate: vi.fn().mockResolvedValue({ _sum: { points: 0 } }) },
    memberXP: { findUnique: vi.fn().mockResolvedValue(null), upsert: vi.fn().mockResolvedValue({ xp: 0, level: 1 }) },
    memberStreak: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ current: 1, longest: 1 }),
      update: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
    },
    rewardRedemption: { create: vi.fn(), findMany: vi.fn() },
    referral: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    notification: { create: vi.fn().mockResolvedValue({ id: 'n', type: 'GENERAL' }) },
  }
  const prismaMock: any = {
    member: { findFirst: vi.fn() },
    bodyMeasurement: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), delete: vi.fn() },
    goal: { findMany: vi.fn(), create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    ...engagement,
  }
  prismaMock.$transaction = vi.fn(async (fn: any) => fn(prismaMock))
  return { prismaMock }
})

vi.mock('../../config/db', () => ({ prisma: prismaMock }))

import { ProgressService } from '../../modules/progress/progress.service'

const GYM = 'gym-1'
const admin = { id: 'admin-1', role: Role.ADMIN, gymId: GYM }
const trainer = { id: 'tr-1', role: Role.TRAINER, gymId: GYM }
const member = { id: 'u-mem-1', role: Role.MEMBER, gymId: GYM }

const memberA = { id: 'm-A', gymId: GYM, userId: member.id, trainerId: trainer.id, height: 180, user: { name: 'A' } }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ProgressService.createEntry — BMI + scoping', () => {
  it('auto-calculates BMI from weight + member height, scoped to gym', async () => {
    prismaMock.member.findFirst.mockResolvedValue(memberA)
    prismaMock.bodyMeasurement.create.mockImplementation(async ({ data }: any) => ({ id: 'e1', ...data }))

    await ProgressService.createEntry(member, 'm-A', { weight: 81 } as any)

    const arg = prismaMock.bodyMeasurement.create.mock.calls[0][0].data
    expect(arg.gymId).toBe(GYM)
    expect(arg.memberId).toBe('m-A')
    expect(arg.recordedById).toBe(member.id)
    // BMI = 81 / (1.8^2) = 25
    expect(arg.bmi).toBe(25)
  })

  it('no photo/image fields are ever written', async () => {
    prismaMock.member.findFirst.mockResolvedValue(memberA)
    prismaMock.bodyMeasurement.create.mockImplementation(async ({ data }: any) => ({ id: 'e1', ...data }))
    await ProgressService.createEntry(member, 'm-A', { weight: 70 } as any)
    const arg = prismaMock.bodyMeasurement.create.mock.calls[0][0].data
    expect(arg).not.toHaveProperty('imageUrl')
    expect(arg).not.toHaveProperty('photoUrl')
  })
})

describe('ProgressService — permissions', () => {
  it('trainer can create for assigned member', async () => {
    prismaMock.member.findFirst.mockResolvedValue(memberA)
    prismaMock.bodyMeasurement.findFirst.mockResolvedValue(null)
    prismaMock.bodyMeasurement.create.mockResolvedValue({ id: 'e1' })
    await expect(ProgressService.createEntry(trainer, 'm-A', { weight: 80 } as any)).resolves.toBeTruthy()
  })

  it('trainer cannot access an unassigned member (403)', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ ...memberA, trainerId: 'other-trainer' })
    await expect(ProgressService.getSummary(trainer, 'm-A')).rejects.toThrow(/assigned member/i)
  })

  it('member cannot access another member (403)', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ ...memberA, userId: 'someone-else' })
    await expect(ProgressService.getTimeline(member, 'm-A')).rejects.toThrow(/your own/i)
  })

  it('admin can access any member in the gym', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ ...memberA, trainerId: null })
    prismaMock.bodyMeasurement.findMany.mockResolvedValue([])
    await expect(ProgressService.getTimeline(admin, 'm-A')).resolves.toEqual([])
    // tenant isolation: query scoped to caller gym
    expect(prismaMock.bodyMeasurement.findMany.mock.calls[0][0].where).toEqual({ gymId: GYM, memberId: 'm-A' })
  })

  it('rejects access when a member belongs to another gym (tenant isolation)', async () => {
    prismaMock.member.findFirst.mockResolvedValue(null) // not found in caller gym
    await expect(ProgressService.getSummary(admin, 'm-OTHER')).rejects.toThrow(/not found in this gym/i)
  })
})

describe('ProgressService.getTimeline + getSummary — aggregation', () => {
  const rows = [
    { id: 'e1', recordedAt: new Date('2026-06-01'), weight: 80, bmi: 26, bodyFatPercentage: 25, waist: 90, notes: null },
    { id: 'e2', recordedAt: new Date('2026-06-08'), weight: 78, bmi: 25, bodyFatPercentage: 23, waist: 88, notes: null },
  ]

  it('timeline is newest-first', async () => {
    prismaMock.member.findFirst.mockResolvedValue(memberA)
    prismaMock.bodyMeasurement.findMany.mockResolvedValue(rows) // service fetches asc
    const tl = await ProgressService.getTimeline(member, 'm-A')
    expect(tl[0].id).toBe('e2') // newest first
    expect(tl[1].id).toBe('e1')
  })

  it('summary computes latest/first/change/trend', async () => {
    prismaMock.member.findFirst.mockResolvedValue(memberA)
    prismaMock.bodyMeasurement.findMany.mockResolvedValue(rows)
    const s: any = await ProgressService.getSummary(member, 'm-A')
    expect(s.entryCount).toBe(2)
    expect(s.metrics.weight.latest).toBe(78)
    expect(s.metrics.weight.first).toBe(80)
    expect(s.metrics.weight.changeSinceFirst).toBe(-2)
    expect(s.metrics.weight.trend).toBe('DOWN')
  })

  it('charts return chart-ready series with trend + change', async () => {
    prismaMock.member.findFirst.mockResolvedValue(memberA)
    prismaMock.bodyMeasurement.findMany.mockResolvedValue(rows)
    const charts: any = await ProgressService.getCharts(member, 'm-A')
    const weight = charts.find((c: any) => c.metric === 'weight')
    expect(weight.points).toHaveLength(2)
    expect(weight.points[0]).toEqual({ date: '2026-06-01', value: 80 })
    expect(weight.trend).toBe('DOWN')
    expect(weight.change).toBe(-2)
  })
})

describe('ProgressService — goals + progress %', () => {
  it('computes goal progress % from start→current→target', async () => {
    prismaMock.member.findFirst.mockResolvedValue(memberA)
    prismaMock.goal.findMany.mockResolvedValue([
      { id: 'g1', metric: 'weight', startValue: 90, targetValue: 80, currentValue: null, gymId: GYM, memberId: 'm-A' },
    ])
    // latest weight = 85 → halfway from 90 to 80
    prismaMock.bodyMeasurement.findFirst.mockResolvedValue({ weight: 85 })

    const goals: any = await ProgressService.listGoals(member, 'm-A')
    expect(goals[0].currentValue).toBe(85)
    expect(goals[0].progressPercent).toBe(50)
  })

  it('create goal is scoped + sets startDate', async () => {
    prismaMock.member.findFirst.mockResolvedValue(memberA)
    prismaMock.goal.create.mockImplementation(async ({ data }: any) => ({ id: 'g1', ...data }))
    await ProgressService.createGoal(member, 'm-A', { title: 'Lose weight', metric: 'weight', targetValue: 75 } as any)
    const arg = prismaMock.goal.create.mock.calls[0][0].data
    expect(arg.gymId).toBe(GYM)
    expect(arg.memberId).toBe('m-A')
    expect(arg.startDate).toBeInstanceOf(Date)
  })
})

describe('No progress-photo surface remains', () => {
  it('ProgressService has no photo methods', () => {
    expect((ProgressService as any).createPhoto).toBeUndefined()
    expect((ProgressService as any).getMyPhotos).toBeUndefined()
    expect((ProgressService as any).deletePhoto).toBeUndefined()
  })
})
