import { describe, it, expect } from 'vitest'
import jwt from 'jsonwebtoken'
import { createAdminToken, createMemberToken, createSuperAdminToken, createTrainerToken } from '../helpers/auth'
import { Role } from '@prisma/client'

const SECRET = process.env.JWT_SECRET || 'test-jwt-secret-that-is-long-enough-32x'

describe('JWT Token Creation', () => {
  it('creates a valid signed token', () => {
    const token = createAdminToken()
    expect(() => jwt.verify(token, SECRET)).not.toThrow()
  })

  it('admin token has correct role and gymId', () => {
    const token = createAdminToken('gym-abc')
    const decoded = jwt.verify(token, SECRET) as Record<string, unknown>
    expect(decoded.role).toBe(Role.ADMIN)
    expect(decoded.gymId).toBe('gym-abc')
  })

  it('member token has MEMBER role', () => {
    const token = createMemberToken()
    const decoded = jwt.verify(token, SECRET) as Record<string, unknown>
    expect(decoded.role).toBe(Role.MEMBER)
  })

  it('super admin has null gymId', () => {
    const token = createSuperAdminToken()
    const decoded = jwt.verify(token, SECRET) as Record<string, unknown>
    expect(decoded.role).toBe(Role.SUPER_ADMIN)
    expect(decoded.gymId).toBeNull()
  })

  it('trainer is scoped to a gym', () => {
    const token = createTrainerToken('gym-xyz')
    const decoded = jwt.verify(token, SECRET) as Record<string, unknown>
    expect(decoded.role).toBe(Role.TRAINER)
    expect(decoded.gymId).toBe('gym-xyz')
  })

  it('token contains expiry claim', () => {
    const token = createAdminToken()
    const decoded = jwt.decode(token) as Record<string, unknown>
    expect(decoded).toBeDefined()
    expect(decoded.exp).toBeDefined()
    expect(typeof decoded.exp).toBe('number')
    expect(decoded.exp as number).toBeGreaterThan(0)
  })
})
