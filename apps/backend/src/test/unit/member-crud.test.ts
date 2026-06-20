import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Role } from '@prisma/client'

const { prismaMock } = vi.hoisted(() => {
  const tx = {
    user: { create: vi.fn(), update: vi.fn() },
    member: { create: vi.fn(), update: vi.fn() },
  }
  return {
    prismaMock: {
      _tx: tx,
      user: { findUnique: vi.fn(), findFirst: vi.fn() },
      branch: { findFirst: vi.fn() },
      member: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), count: vi.fn() },
      // License enforcement (assertCapacity) runs on create; default = unlicensed (no cap).
      gymSubscription: { findFirst: vi.fn() },
      $transaction: vi.fn(async (fn: any) => fn(tx)),
    },
  }
})

vi.mock('../../config/db', () => ({ prisma: prismaMock }))
vi.mock('../../utils/password', () => ({
  hashPassword: vi.fn(async (p: string) => `hashed:${p}`),
}))

import { MemberService } from '../../modules/member/member.service'

const GYM = 'gym-1'
const admin = { id: 'admin-1', role: Role.ADMIN, gymId: GYM }

beforeEach(() => {
  vi.clearAllMocks()
  prismaMock.user.findUnique.mockResolvedValue(null)
  prismaMock.gymSubscription.findFirst.mockResolvedValue(null) // unlicensed → capacity check is a no-op
  prismaMock._tx.user.create.mockResolvedValue({ id: 'user-1', email: 'm@gym.com' })
  prismaMock._tx.member.create.mockImplementation(async ({ data }: any) => ({ id: 'member-1', ...data }))
})

describe('MemberService.create', () => {
  it('creates a member + linked user scoped to the gym', async () => {
    const member = await MemberService.create(GYM, {
      name: 'Arun',
      email: 'm@gym.com',
      password: 'secret1',
      phone: '9999999999',
    } as any)

    expect(prismaMock._tx.user.create).toHaveBeenCalledOnce()
    expect(prismaMock._tx.user.create.mock.calls[0][0].data.gymId).toBe(GYM)
    expect(member.gymId).toBe(GYM)
  })

  it('blocks duplicate email', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'existing' })
    await expect(
      MemberService.create(GYM, {
        name: 'Dup', email: 'dup@gym.com', password: 'secret1', phone: '9999999999',
      } as any)
    ).rejects.toThrow(/already exists/i)
    expect(prismaMock._tx.member.create).not.toHaveBeenCalled()
  })

  it('rejects a branch from another gym (branch isolation)', async () => {
    prismaMock.branch.findFirst.mockResolvedValue(null)
    await expect(
      MemberService.create(GYM, {
        name: 'X', email: 'x@gym.com', password: 'secret1', phone: '9999999999',
        branchId: 'other-branch',
      } as any)
    ).rejects.toThrow(/Branch not found in this gym/i)
  })

  it('persists health profile fields', async () => {
    await MemberService.create(GYM, {
      name: 'H', email: 'h@gym.com', password: 'secret1', phone: '9999999999',
      healthNotes: 'asthma', injuryNotes: 'knee', medicalConditions: 'none',
      emergencyContactName: 'Mom', emergencyContactPhone: '8888888888',
    } as any)
    const data = prismaMock._tx.member.create.mock.calls[0][0].data
    expect(data.healthNotes).toBe('asthma')
    expect(data.injuryNotes).toBe('knee')
    expect(data.emergencyContactName).toBe('Mom')
  })
})

describe('MemberService.delete (soft delete)', () => {
  it('marks the member INACTIVE and deactivates the login', async () => {
    prismaMock.member.findFirst.mockResolvedValue({ id: 'member-1', userId: 'user-1', gymId: GYM })
    prismaMock._tx.member.update.mockResolvedValue({})
    prismaMock._tx.user.update.mockResolvedValue({})

    const result = await MemberService.delete(GYM, 'member-1')

    expect(prismaMock._tx.member.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'INACTIVE' } })
    )
    expect(prismaMock._tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } })
    )
    expect(result.status).toBe('INACTIVE')
  })
})

describe('MemberService.getAll (gym + branch scoping)', () => {
  it('scopes the query to the gym', async () => {
    prismaMock.member.findMany.mockResolvedValue([])
    await MemberService.getAll(admin)
    expect(prismaMock.member.findMany.mock.calls[0][0].where).toEqual({ gymId: GYM })
  })

  it('adds a branch filter when provided', async () => {
    prismaMock.member.findMany.mockResolvedValue([])
    await MemberService.getAll(admin, 'branch-9')
    expect(prismaMock.member.findMany.mock.calls[0][0].where).toEqual({
      gymId: GYM,
      branchId: 'branch-9',
    })
  })

  it('scopes a trainer to their own assigned members', async () => {
    prismaMock.member.findMany.mockResolvedValue([])
    await MemberService.getAll({ id: 'tr-1', role: Role.TRAINER, gymId: GYM })
    expect(prismaMock.member.findMany.mock.calls[0][0].where).toEqual({
      gymId: GYM,
      trainerId: 'tr-1',
    })
  })
})
