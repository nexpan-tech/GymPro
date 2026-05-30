import { faker } from '@faker-js/faker'
import { Role, MembershipPlan, PaymentStatus } from '@prisma/client'

export function gymFactory(overrides: Record<string, unknown> = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.company.name() + ' Gym',
    email: faker.internet.email(),
    phone: faker.phone.number(),
    address: faker.location.streetAddress(),
    logo: null,
    isActive: true,
    ...overrides,
  }
}

export function userFactory(overrides: Record<string, unknown> = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    passwordHash: 'hashed_password_placeholder',
    role: Role.MEMBER,
    isActive: true,
    gymId: faker.string.uuid(),
    branchId: null,
    ...overrides,
  }
}

export function memberFactory(overrides: Record<string, unknown> = {}) {
  return {
    id: faker.string.uuid(),
    gymId: faker.string.uuid(),
    userId: faker.string.uuid(),
    phone: faker.phone.number(),
    gender: faker.helpers.arrayElement(['MALE', 'FEMALE', 'OTHER']),
    height: faker.number.float({ min: 150, max: 200, fractionDigits: 1 }),
    weight: faker.number.float({ min: 50, max: 120, fractionDigits: 1 }),
    fitnessGoal: 'Weight loss',
    trainerId: null,
    branchId: null,
    ...overrides,
  }
}

export function membershipFactory(overrides: Record<string, unknown> = {}) {
  return {
    id: faker.string.uuid(),
    gymId: faker.string.uuid(),
    memberId: faker.string.uuid(),
    plan: MembershipPlan.MONTHLY,
    amount: faker.number.float({ min: 500, max: 5000, fractionDigits: 2 }),
    paymentStatus: PaymentStatus.PAID,
    ...overrides,
  }
}
