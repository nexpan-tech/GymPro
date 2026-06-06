import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Role } from '@prisma/client'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    member: { findFirst: vi.fn() },
    dietPlan: { findFirst: vi.fn(), findMany: vi.fn() },
    dietMeal: { findFirst: vi.fn() },
    dietCompletion: { create: vi.fn(), findMany: vi.fn() },
  },
}))

vi.mock('../../config/db', () => ({ prisma: prismaMock }))

import { DietService } from '../../modules/diet/diet.service'

const GYM = 'gym-1'
const admin = { id: 'admin-1', role: Role.ADMIN, gymId: GYM }
const trainer = { id: 'tr-1', role: Role.TRAINER, gymId: GYM }
const member = { id: 'u-mem-1', role: Role.MEMBER, gymId: GYM }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('DietService.completeMeal', () => {
  it('lets a MEMBER complete their own diet plan', async () => {
    prismaMock.dietPlan.findFirst.mockResolvedValue({
      id: 'dp-1', gymId: GYM, member: { id: 'm-1', userId: member.id, trainerId: null },
    })
    prismaMock.dietCompletion.create.mockResolvedValue({ id: 'dc-1' })
    await DietService.completeMeal(member, { dietPlanId: 'dp-1' })
    const arg = prismaMock.dietCompletion.create.mock.calls[0][0]
    expect(arg.data.gymId).toBe(GYM)
    expect(arg.data.memberId).toBe('m-1')
  })

  it('rejects a MEMBER completing someone else’s plan', async () => {
    prismaMock.dietPlan.findFirst.mockResolvedValue({
      id: 'dp-2', gymId: GYM, member: { id: 'm-2', userId: 'other-user', trainerId: null },
    })
    await expect(DietService.completeMeal(member, { dietPlanId: 'dp-2' })).rejects.toThrow(/your own/i)
    expect(prismaMock.dietCompletion.create).not.toHaveBeenCalled()
  })

  it('rejects a TRAINER logging for an unassigned member', async () => {
    prismaMock.dietPlan.findFirst.mockResolvedValue({
      id: 'dp-3', gymId: GYM, member: { id: 'm-3', userId: 'x', trainerId: 'other-trainer' },
    })
    await expect(DietService.completeMeal(trainer, { dietPlanId: 'dp-3' })).rejects.toThrow(/assigned members/i)
  })

  it('validates the meal belongs to the plan', async () => {
    prismaMock.dietPlan.findFirst.mockResolvedValue({
      id: 'dp-1', gymId: GYM, member: { id: 'm-1', userId: member.id, trainerId: null },
    })
    prismaMock.dietMeal.findFirst.mockResolvedValue(null)
    await expect(
      DietService.completeMeal(member, { dietPlanId: 'dp-1', dietMealId: 'bad-meal' })
    ).rejects.toThrow(/Meal not found/i)
  })
})

describe('DietService.getAnalytics', () => {
  it('computes adherence percentage and stays gym-scoped', async () => {
    prismaMock.dietPlan.findMany.mockResolvedValue([
      { meals: [{}, {}, {}, {}, {}], completions: [{ completedAt: new Date() }, { completedAt: new Date() }, { completedAt: new Date() }] },
    ])
    const result = await DietService.getAnalytics(admin)
    expect(prismaMock.dietPlan.findMany.mock.calls[0][0].where.gymId).toBe(GYM)
    expect(result.totalMeals).toBe(5)
    expect(result.totalCompletions).toBe(3)
    expect(result.adherencePercentage).toBe(60)
    expect(result.weeklyTrend).toHaveLength(7)
  })

  it('scopes a MEMBER to their own plan', async () => {
    prismaMock.dietPlan.findMany.mockResolvedValue([])
    await DietService.getAnalytics(member)
    expect(prismaMock.dietPlan.findMany.mock.calls[0][0].where).toEqual({
      gymId: GYM,
      member: { userId: member.id },
    })
  })
})
