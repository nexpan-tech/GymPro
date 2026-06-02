import { describe, it, expect, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'
import { Role } from '@prisma/client'

// --- Mock the data + crypto layers so AuthService is exercised in isolation ---
const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { findUnique: vi.fn() },
    session: { create: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn() },
  },
}))

vi.mock('../../config/db', () => ({ prisma: prismaMock }))
vi.mock('../../utils/password', () => ({
  hashPassword: vi.fn(async (p: string) => `hashed:${p}`),
  comparePassword: vi.fn(),
}))

import { AuthService } from '../../modules/auth/auth.service'
import { comparePassword } from '../../utils/password'

const SECRET = process.env.JWT_SECRET || 'test-jwt-secret-that-is-long-enough-32x'

const baseUser = {
  id: 'user-1',
  name: 'Admin User',
  email: 'admin@gym.com',
  passwordHash: 'hashed:secret',
  role: Role.ADMIN,
  gymId: 'gym-1',
  branchId: 'branch-1',
  isActive: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  prismaMock.session.create.mockResolvedValue({})
})

describe('AuthService.login', () => {
  it('returns tokens on valid credentials', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser)
    vi.mocked(comparePassword).mockResolvedValue(true)

    const result = await AuthService.login({ email: baseUser.email, password: 'secret' })

    expect(result.accessToken).toBeTruthy()
    expect(result.refreshToken).toBeTruthy()
    expect(result.user).not.toHaveProperty('passwordHash')
    expect(prismaMock.session.create).toHaveBeenCalledOnce()
  })

  it('embeds id, role, gymId and branchId in the JWT payload', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser)
    vi.mocked(comparePassword).mockResolvedValue(true)

    const { accessToken } = await AuthService.login({ email: baseUser.email, password: 'secret' })
    const decoded = jwt.verify(accessToken, SECRET) as Record<string, unknown>

    expect(decoded.id).toBe('user-1')
    expect(decoded.role).toBe(Role.ADMIN)
    expect(decoded.gymId).toBe('gym-1')
    expect(decoded.branchId).toBe('branch-1')
    expect(decoded.exp).toBeDefined()
  })

  it('rejects an unknown email', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    await expect(
      AuthService.login({ email: 'nope@gym.com', password: 'x' })
    ).rejects.toThrow('Invalid credentials')
  })

  it('rejects a wrong password', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser)
    vi.mocked(comparePassword).mockResolvedValue(false)
    await expect(
      AuthService.login({ email: baseUser.email, password: 'wrong' })
    ).rejects.toThrow('Invalid credentials')
  })

  it('rejects an inactive account before checking the password', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...baseUser, isActive: false })
    await expect(
      AuthService.login({ email: baseUser.email, password: 'secret' })
    ).rejects.toThrow('Invalid credentials')
    expect(comparePassword).not.toHaveBeenCalled()
  })
})

describe('AuthService.refresh', () => {
  it('issues a fresh access token for a valid session', async () => {
    prismaMock.session.findFirst.mockResolvedValue({ user: baseUser })
    const { accessToken } = await AuthService.refresh('some-refresh-token')
    const decoded = jwt.verify(accessToken, SECRET) as Record<string, unknown>
    expect(decoded.id).toBe('user-1')
    expect(decoded.branchId).toBe('branch-1')
  })

  it('rejects an invalid / expired refresh token', async () => {
    prismaMock.session.findFirst.mockResolvedValue(null)
    await expect(AuthService.refresh('bad')).rejects.toThrow('Invalid or expired refresh token')
  })
})
