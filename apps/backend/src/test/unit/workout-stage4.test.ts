import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Role } from '@prisma/client'

const { prismaMock } = vi.hoisted(() => {
  // Stage 8 engagement-engine surface so the points/streak event hooks fired by
  // production code run silently in unit tests.
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
    workoutPlan: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    workoutCompletion: { create: vi.fn(), findMany: vi.fn() },
    ...engagement,
  }
  prismaMock.$transaction = vi.fn(async (fn: any) => fn(prismaMock))
  return { prismaMock }
})

vi.mock('../../config/db', () => ({ prisma: prismaMock }))

import { WorkoutService } from '../../modules/workout/workout.service'

const GYM = 'gym-1'
const admin = { id: 'admin-1', role: Role.ADMIN, gymId: GYM }
const trainer = { id: 'tr-1', role: Role.TRAINER, gymId: GYM }
const member = { id: 'u-mem-1', role: Role.MEMBER, gymId: GYM }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('WorkoutService.createPlan', () => {
  it('creates a plan scoped to the gym with the caller as trainer', async () => {
    prismaMock.workoutPlan.create.mockResolvedValue({ id: 'plan-1' })
    await WorkoutService.createPlan(trainer, { title: 'Push', difficulty: 'BEGINNER' })
    const arg = prismaMock.workoutPlan.create.mock.calls[0][0]
    expect(arg.data.gymId).toBe(GYM)
    expect(arg.data.trainerId).toBe(trainer.id)
    expect(arg.data.title).toBe('Push')
  })
})

describe('WorkoutService.getByMember (trainer assignment isolation)', () => {
  it('lets ADMIN read any member in the gym', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: 'm-1', gymId: GYM, trainerId: 'other', userId: 'x' })
    prismaMock.workoutPlan.findMany.mockResolvedValue([])
    await WorkoutService.getByMember(admin, 'm-1')
    expect(prismaMock.workoutPlan.findMany.mock.calls[0][0].where).toEqual({ gymId: GYM, memberId: 'm-1' })
  })

  it('blocks a TRAINER from an unassigned member', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: 'm-1', gymId: GYM, trainerId: 'someone-else', userId: 'x' })
    await expect(WorkoutService.getByMember(trainer, 'm-1')).rejects.toThrow(/assigned members/i)
    expect(prismaMock.workoutPlan.findMany).not.toHaveBeenCalled()
  })

  it('allows a TRAINER for their assigned member', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: 'm-1', gymId: GYM, trainerId: trainer.id, userId: 'x' })
    prismaMock.workoutPlan.findMany.mockResolvedValue([])
    await expect(WorkoutService.getByMember(trainer, 'm-1')).resolves.toEqual([])
  })

  it('blocks a MEMBER from another member', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: 'm-2', gymId: GYM, trainerId: null, userId: 'someone-else' })
    await expect(WorkoutService.getByMember(member, 'm-2')).rejects.toThrow(/your own/i)
  })
})

describe('WorkoutService.completeWorkout', () => {
  it('lets a MEMBER complete only their own plan', async () => {
    prismaMock.workoutPlan.findFirst.mockResolvedValue({ id: 'plan-1', gymId: GYM, memberId: 'm-1' })
    prismaMock.member.findFirst.mockResolvedValue({ id: 'm-1', gymId: GYM, userId: member.id })
    prismaMock.workoutCompletion.create.mockResolvedValue({ id: 'wc-1' })
    await WorkoutService.completeWorkout(member, { workoutPlanId: 'plan-1' })
    expect(prismaMock.workoutCompletion.create.mock.calls[0][0].data.memberId).toBe('m-1')
  })

  it('rejects a MEMBER completing a plan that is not theirs', async () => {
    prismaMock.workoutPlan.findFirst.mockResolvedValue({ id: 'plan-9', gymId: GYM, memberId: 'm-OTHER' })
    prismaMock.member.findFirst.mockResolvedValue({ id: 'm-1', gymId: GYM, userId: member.id })
    await expect(WorkoutService.completeWorkout(member, { workoutPlanId: 'plan-9' })).rejects.toThrow(/your own/i)
  })
})

describe('WorkoutService.getAnalytics', () => {
  it('computes completion percentage and stays gym-scoped', async () => {
    prismaMock.workoutPlan.findMany.mockResolvedValue([
      { exercises: [{}, {}, {}, {}], completions: [{ completedAt: new Date() }, { completedAt: new Date() }] },
    ])
    const result = await WorkoutService.getAnalytics(admin)
    expect(prismaMock.workoutPlan.findMany.mock.calls[0][0].where.gymId).toBe(GYM)
    expect(result.totalExercises).toBe(4)
    expect(result.totalCompletions).toBe(2)
    expect(result.completionPercentage).toBe(50)
    expect(result.weeklyTrend).toHaveLength(7)
  })

  it('scopes a MEMBER to their own plans', async () => {
    prismaMock.workoutPlan.findMany.mockResolvedValue([])
    await WorkoutService.getAnalytics(member)
    expect(prismaMock.workoutPlan.findMany.mock.calls[0][0].where).toEqual({
      gymId: GYM,
      member: { userId: member.id },
    })
  })
})
