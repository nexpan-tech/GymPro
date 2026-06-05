import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Role } from '@prisma/client'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    member: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    user: { findFirst: vi.fn() },
    branch: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('../../config/db', () => ({ prisma: prismaMock }))
vi.mock('../../utils/password', () => ({ hashPassword: vi.fn() }))

import { MemberService } from '../../modules/member/member.service'

const GYM = 'gym-A'

beforeEach(() => vi.clearAllMocks())

describe('Member tenant + branch isolation', () => {
  it('getById only finds members within the caller gym', async () => {
    prismaMock.member.findFirst.mockResolvedValue(null) // not in gym-A
    await expect(
      MemberService.getById({ id: 'a', role: Role.ADMIN, gymId: GYM }, 'foreign-member')
    ).rejects.toThrow(/not found/i)
    expect(prismaMock.member.findFirst.mock.calls[0][0].where).toMatchObject({
      id: 'foreign-member',
      gymId: GYM,
    })
  })

  it('a trainer cannot open a member they are not assigned to', async () => {
    prismaMock.member.findFirst.mockResolvedValue({
      id: 'm1', gymId: GYM, userId: 'u1', trainerId: 'other-trainer',
    })
    await expect(
      MemberService.getById({ id: 'tr-1', role: Role.TRAINER, gymId: GYM }, 'm1')
    ).rejects.toThrow(/assigned members/i)
  })

  it('a member cannot open another member profile', async () => {
    prismaMock.member.findFirst.mockResolvedValue({
      id: 'm1', gymId: GYM, userId: 'someone-else',
    })
    await expect(
      MemberService.getById({ id: 'self', role: Role.MEMBER, gymId: GYM }, 'm1')
    ).rejects.toThrow(/your own profile/i)
  })

  it('update is scoped to the gym (cross-gym update blocked)', async () => {
    prismaMock.member.findFirst.mockResolvedValue(null)
    await expect(
      MemberService.update(GYM, 'foreign-member', { phone: '123456' } as any)
    ).rejects.toThrow(/not found/i)
    expect(prismaMock.member.findFirst.mock.calls[0][0].where).toMatchObject({
      id: 'foreign-member',
      gymId: GYM,
    })
    expect(prismaMock.member.update).not.toHaveBeenCalled()
  })
})
