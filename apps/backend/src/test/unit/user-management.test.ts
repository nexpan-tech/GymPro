import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('../../config/db', () => ({ prisma: prismaMock }))
vi.mock('../../utils/password', () => ({
  hashPassword: vi.fn(async (p: string) => `hashed:${p}`),
}))

import { createUser, updateUser } from '../../modules/user/user.service'

const GYM = 'gym-1'

beforeEach(() => {
  vi.clearAllMocks()
  prismaMock.user.findUnique.mockResolvedValue(null)
  prismaMock.user.create.mockImplementation(async ({ data }: any) => ({
    id: 'new-user',
    ...data,
  }))
})

describe('createUser — role provisioning guard', () => {
  it.each(['TRAINER', 'RECEPTIONIST', 'MEMBER', 'ADMIN'])(
    'allows a gym admin to create a %s in their own gym',
    async (role) => {
      const user = await createUser(GYM, {
        name: 'Test',
        email: `${role}@gym.com`,
        password: 'secret1',
        role: role as any,
      })
      expect(prismaMock.user.create).toHaveBeenCalledOnce()
      const createArg = prismaMock.user.create.mock.calls[0][0]
      // gymId is forced to the caller's gym (tenant isolation)
      expect(createArg.data.gymId).toBe(GYM)
      expect(createArg.data.role).toBe(role)
      expect(user).toBeTruthy()
    }
  )

  it.each(['SUPER_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_MANAGER'])(
    'blocks a gym admin from minting a %s (privilege escalation)',
    async (role) => {
      await expect(
        createUser(GYM, {
          name: 'Esc',
          email: 'esc@gym.com',
          password: 'secret1',
          role: role as any,
        })
      ).rejects.toThrow(/cannot create users with the role/i)
      expect(prismaMock.user.create).not.toHaveBeenCalled()
    }
  )

  it('rejects a duplicate email', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'existing' })
    await expect(
      createUser(GYM, {
        name: 'Dup',
        email: 'dup@gym.com',
        password: 'secret1',
        role: 'MEMBER' as any,
      })
    ).rejects.toThrow(/already exists/i)
  })
})

describe('updateUser — role provisioning guard', () => {
  it('blocks escalating an existing user to SUPER_ADMIN', async () => {
    await expect(
      updateUser(GYM, 'u1', { role: 'SUPER_ADMIN' as any })
    ).rejects.toThrow(/cannot assign the role/i)
    expect(prismaMock.user.update).not.toHaveBeenCalled()
  })

  it('allows a permitted role change within the gym', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'u1',
      gymId: GYM,
      email: 'u1@gym.com',
    })
    prismaMock.user.update.mockResolvedValue({ id: 'u1', role: 'TRAINER' })
    const result = await updateUser(GYM, 'u1', { role: 'TRAINER' as any })
    expect(result.role).toBe('TRAINER')
  })
})
