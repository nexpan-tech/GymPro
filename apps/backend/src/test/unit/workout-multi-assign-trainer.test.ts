import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Role } from '@prisma/client'

const { prismaMock } = vi.hoisted(() => {
  const prismaMock: any = {
    member: { findFirst: vi.fn() },
    workoutPlan: { create: vi.fn() },
  }
  return { prismaMock }
})

vi.mock('../../config/db', () => ({ prisma: prismaMock }))

import { WorkoutService } from '../../modules/workout/workout.service'

const GYM = 'gym-1'
const trainer = { id: 'tr-1', role: Role.TRAINER, gymId: GYM }
const admin = { id: 'admin-1', role: Role.ADMIN, gymId: GYM }

// Member fixtures: m1 + m2 assigned to the trainer, mX assigned to someone else.
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
  // Echo back the created plan so the service can build its plans[] list.
  prismaMock.workoutPlan.create.mockImplementation(({ data }: any) =>
    Promise.resolve({ id: `plan-${data.memberId ?? 'tpl'}`, ...data }),
  )
})

describe('WorkoutService.createPlan — multi-member assignment', () => {
  it('creates one plan per selected assigned member (memberIds[])', async () => {
    const result: any = await WorkoutService.createPlan(trainer, {
      memberIds: ['m1', 'm2'],
      title: 'PPL',
      difficulty: 'BEGINNER',
    })

    expect(prismaMock.workoutPlan.create).toHaveBeenCalledTimes(2)
    expect(result.count).toBe(2)
    expect(result.plans).toHaveLength(2)
    expect(result.plans.map((p: any) => p.memberId).sort()).toEqual(['m1', 'm2'])
    // Backward-compat: the returned object is also the first plan (has .id).
    expect(result.id).toBeTruthy()
  })

  it('de-duplicates repeated member ids', async () => {
    const result: any = await WorkoutService.createPlan(trainer, {
      memberIds: ['m1', 'm1', 'm2'],
      title: 'PPL',
      difficulty: 'BEGINNER',
    })
    expect(prismaMock.workoutPlan.create).toHaveBeenCalledTimes(2)
    expect(result.count).toBe(2)
  })

  it('blocks a TRAINER from assigning to an unassigned member and creates nothing', async () => {
    await expect(
      WorkoutService.createPlan(trainer, {
        memberIds: ['m1', 'mX'],
        title: 'PPL',
        difficulty: 'BEGINNER',
      }),
    ).rejects.toThrow(/assigned members/i)
    // Validation happens up-front, so no plan is created for any member.
    expect(prismaMock.workoutPlan.create).not.toHaveBeenCalled()
  })

  it('lets ADMIN assign to any member in the gym', async () => {
    const result: any = await WorkoutService.createPlan(admin, {
      memberIds: ['m1', 'mX'],
      title: 'PPL',
      difficulty: 'BEGINNER',
    })
    expect(result.count).toBe(2)
  })

  it('remains backward-compatible with a single memberId', async () => {
    const result: any = await WorkoutService.createPlan(trainer, {
      memberId: 'm1',
      title: 'PPL',
      difficulty: 'BEGINNER',
    })
    expect(prismaMock.workoutPlan.create).toHaveBeenCalledTimes(1)
    expect(prismaMock.workoutPlan.create.mock.calls[0][0].data.memberId).toBe('m1')
    expect(result.count).toBe(1)
  })

  it('creates a single unassigned/template plan when no member is given', async () => {
    await WorkoutService.createPlan(trainer, { title: 'Template', difficulty: 'BEGINNER' })
    expect(prismaMock.workoutPlan.create).toHaveBeenCalledTimes(1)
    expect(prismaMock.workoutPlan.create.mock.calls[0][0].data.memberId).toBeNull()
  })
})
