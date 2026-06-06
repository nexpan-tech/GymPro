import { describe, it, expect, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'
import { Role } from '@prisma/client'

const { prismaMock } = vi.hoisted(() => {
  const tx = {
    gym: { create: vi.fn() },
    user: { create: vi.fn() },
  }
  return {
    prismaMock: {
      _tx: tx,
      user: { findUnique: vi.fn() },
      gym: { findUnique: vi.fn() },
      session: { create: vi.fn() },
      $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
    },
  }
})

vi.mock('../../config/db', () => ({ prisma: prismaMock }))
vi.mock('../../utils/password', () => ({
  hashPassword: vi.fn(async (p: string) => `hashed:${p}`),
  comparePassword: vi.fn(),
}))

import { AuthService } from '../../modules/auth/auth.service'

const SECRET = process.env.JWT_SECRET || 'test-jwt-secret-that-is-long-enough-32x'

const payload = {
  gymName: 'New Gym',
  ownerName: 'Owner One',
  email: 'owner@newgym.com',
  password: 'secret1',
}

beforeEach(() => {
  vi.clearAllMocks()
  prismaMock.user.findUnique.mockResolvedValue(null)
  prismaMock.gym.findUnique.mockResolvedValue(null)
  prismaMock.session.create.mockResolvedValue({})
  // Gym ids are CUIDs, not UUIDs — assert the flow accepts a cuid-shaped id.
  prismaMock._tx.gym.create.mockResolvedValue({ id: 'cml9zk0000abcd1234efgh', name: payload.gymName })
  prismaMock._tx.user.create.mockImplementation(async ({ data }: any) => ({
    id: 'user-1',
    branchId: null,
    ...data,
  }))
})

describe('AuthService.registerGym', () => {
  it('creates a gym + ADMIN owner in one transaction and returns tokens', async () => {
    const result = await AuthService.registerGym(payload)

    expect(prismaMock.$transaction).toHaveBeenCalledOnce()
    expect(prismaMock._tx.gym.create).toHaveBeenCalledOnce()

    const userArg = prismaMock._tx.user.create.mock.calls[0][0].data
    expect(userArg.role).toBe('ADMIN')
    expect(userArg.gymId).toBe('cml9zk0000abcd1234efgh')

    expect(result.accessToken).toBeTruthy()
    expect(result.refreshToken).toBeTruthy()
    expect(result.user).not.toHaveProperty('passwordHash')

    const decoded = jwt.verify(result.accessToken, SECRET) as Record<string, unknown>
    expect(decoded.role).toBe(Role.ADMIN)
    expect(decoded.gymId).toBe('cml9zk0000abcd1234efgh')
  })

  it('rejects when the email already belongs to a user', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'existing' })
    await expect(AuthService.registerGym(payload)).rejects.toThrow(/user already exists/i)
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('rejects when a gym already uses the email', async () => {
    prismaMock.gym.findUnique.mockResolvedValue({ id: 'gym-existing' })
    await expect(AuthService.registerGym(payload)).rejects.toThrow(/gym already exists/i)
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })
})
