import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Role } from '@prisma/client'

const { prismaMock } = vi.hoisted(() => {
  const prismaMock: any = {
    member: { findFirst: vi.fn() },
    workoutPlan: { findMany: vi.fn() },
    dietPlan: { findFirst: vi.fn() },
  }
  return { prismaMock }
})

vi.mock('../../config/db', () => ({ prisma: prismaMock }))

import { WorkoutService } from '../../modules/workout/workout.service'
import { DietService } from '../../modules/diet/diet.service'

const GYM = 'gym-1'
const member = { id: 'u-mem-1', role: Role.MEMBER, gymId: GYM }

beforeEach(() => {
  vi.clearAllMocks()
})

/**
 * Guards the mobile "assigned plans not consistently visible" bug: the `/my`
 * endpoints must return ALL of a member's active plans (every day), never a
 * single day or a single plan.
 */
describe('Member mobile — assigned plans visibility', () => {
  it('workouts/my returns every plan for the member (all days, with exercises + completions)', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: 'm1', gymId: GYM, userId: member.id })
    prismaMock.workoutPlan.findMany.mockResolvedValue([
      { id: 'p1', exercises: [{ dayNumber: 1 }, { dayNumber: 3 }], completions: [] },
      { id: 'p2', exercises: [{ dayNumber: 5 }], completions: [] },
    ])

    const plans = await WorkoutService.getMyPlans(member)

    const call = prismaMock.workoutPlan.findMany.mock.calls[0][0]
    // Scoped to the member, NOT filtered by day.
    expect(call.where).toEqual({ gymId: GYM, memberId: 'm1' })
    expect(call.include.exercises).toBeTruthy()
    expect(call.include.completions).toBe(true)
    // All plans + all their days are returned.
    expect(plans).toHaveLength(2)
    const days = plans.flatMap((p: any) => p.exercises.map((e: any) => e.dayNumber))
    expect(days.sort()).toEqual([1, 3, 5])
  })

  it('diets/my returns the member’s plan with ALL structured meals (all weekdays)', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: 'm1', gymId: GYM, userId: member.id })
    prismaMock.dietPlan.findFirst.mockResolvedValue({
      id: 'dp1',
      meals: [
        { id: 'meal-mon', dayOfWeek: 'monday' },
        { id: 'meal-fri', dayOfWeek: 'friday' },
      ],
    })

    const plan: any = await DietService.getMyPlan(member)

    const call = prismaMock.dietPlan.findFirst.mock.calls[0][0]
    expect(call.where).toEqual({ gymId: GYM, memberId: 'm1' })
    expect(call.include.meals).toBeTruthy()
    // Meals from every assigned weekday come back, not just "today".
    expect(plan.meals.map((m: any) => m.dayOfWeek)).toEqual(['monday', 'friday'])
  })
})
