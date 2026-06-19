import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Role } from '@prisma/client'

const { prismaMock } = vi.hoisted(() => {
  const prismaMock: any = {
    member: { findFirst: vi.fn() },
    dietPlan: { upsert: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
  }
  return { prismaMock }
})

vi.mock('../../config/db', () => ({ prisma: prismaMock }))

import { DietBuilderService } from '../../modules/diet-builder/diet-builder.service'

const GYM = 'gym-1'
const trainer = { id: 'tr-1', role: Role.TRAINER, gymId: GYM }

const members: Record<string, any> = {
  m1: { id: 'm1', gymId: GYM, trainerId: 'tr-1', userId: 'u1' },
  m2: { id: 'm2', gymId: GYM, trainerId: 'tr-1', userId: 'u2' },
  mX: { id: 'mX', gymId: GYM, trainerId: 'other-trainer', userId: 'uX' },
}

beforeEach(() => {
  vi.clearAllMocks()
  prismaMock.member.findFirst.mockImplementation(({ where }: any) =>
    Promise.resolve(members[where.id] ?? null),
  )
  prismaMock.dietPlan.upsert.mockImplementation(({ where, create }: any) =>
    Promise.resolve({ id: `dp-${where.memberId}`, ...create, meals: [] }),
  )
})

describe('DietBuilderService.createPlan — multi-member assignment', () => {
  it('upserts one diet plan per selected assigned member (memberIds[])', async () => {
    const result: any = await DietBuilderService.createPlan(trainer, {
      memberIds: ['m1', 'm2'],
      goal: 'Cut',
    })
    expect(prismaMock.dietPlan.upsert).toHaveBeenCalledTimes(2)
    expect(result.count).toBe(2)
    expect(result.plans).toHaveLength(2)
  })

  it('blocks a TRAINER from an unassigned member and writes nothing', async () => {
    await expect(
      DietBuilderService.createPlan(trainer, { memberIds: ['m1', 'mX'], goal: 'Cut' }),
    ).rejects.toThrow(/assigned clients/i)
    expect(prismaMock.dietPlan.upsert).not.toHaveBeenCalled()
  })

  it('rejects an empty selection', async () => {
    await expect(
      DietBuilderService.createPlan(trainer, { memberIds: [], goal: 'Cut' }),
    ).rejects.toThrow(/at least one member/i)
  })

  it('remains backward-compatible with a single memberId', async () => {
    const result: any = await DietBuilderService.createPlan(trainer, { memberId: 'm1', goal: 'Cut' })
    expect(prismaMock.dietPlan.upsert).toHaveBeenCalledTimes(1)
    expect(result.count).toBe(1)
  })
})

describe('DietBuilderService.deletePlan — trainer isolation', () => {
  it('blocks deleting an unassigned member’s plan', async () => {
    prismaMock.dietPlan.findFirst.mockResolvedValue({ id: 'dp-x', gymId: GYM, member: members.mX })
    await expect(DietBuilderService.deletePlan(trainer, 'dp-x')).rejects.toThrow(/assigned client/i)
    expect(prismaMock.dietPlan.delete).not.toHaveBeenCalled()
  })

  it('deletes an assigned member’s plan', async () => {
    prismaMock.dietPlan.findFirst.mockResolvedValue({ id: 'dp-1', gymId: GYM, member: members.m1 })
    prismaMock.dietPlan.delete.mockResolvedValue({ id: 'dp-1' })
    await expect(DietBuilderService.deletePlan(trainer, 'dp-1')).resolves.toEqual({ id: 'dp-1' })
    expect(prismaMock.dietPlan.delete).toHaveBeenCalledWith({ where: { id: 'dp-1' } })
  })
})
