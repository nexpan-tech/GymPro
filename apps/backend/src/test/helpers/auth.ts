import jwt from 'jsonwebtoken'
import { Role } from '@prisma/client'

const SECRET = process.env.JWT_SECRET || 'test-jwt-secret-that-is-long-enough-32x'

export function createTestToken(overrides: Partial<{ id: string; email: string; role: Role; gymId: string | null }> = {}): string {
  const payload = {
    id: 'test-user-id',
    email: 'test@gympro.com',
    role: Role.ADMIN,
    gymId: 'test-gym-id',
    ...overrides,
  }
  return jwt.sign(payload, SECRET, { expiresIn: '1h' })
}

export const createSuperAdminToken = () => createTestToken({ role: Role.SUPER_ADMIN, gymId: null })
export const createAdminToken = (gymId = 'test-gym-id') => createTestToken({ role: Role.ADMIN, gymId })
export const createTrainerToken = (gymId = 'test-gym-id') => createTestToken({ role: Role.TRAINER, gymId })
export const createMemberToken = (gymId = 'test-gym-id') => createTestToken({ role: Role.MEMBER, gymId })
export const createReceptionistToken = (gymId = 'test-gym-id') => createTestToken({ role: Role.RECEPTIONIST, gymId })
