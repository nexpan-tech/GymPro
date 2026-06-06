import { vi } from 'vitest'
import { PrismaClient } from '@prisma/client'

export function createPrismaMock(): PrismaClient {
  const methods = {
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
    count: vi.fn().mockResolvedValue(0),
    upsert: vi.fn().mockResolvedValue({}),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
  }

  const models = [
    'user','gym','member','membership','attendance','payment',
    'notification','workoutPlan','dietPlan','session','lead',
    'campaign','branch','auditLog','due','badge','memberBadge',
    'goal','bodyMeasurement','progressPhoto','exercise',
    'workoutExercise','workoutCompletion','dietMeal','dietCompletion',
  ]

  const mock: Record<string, unknown> = {
    '$transaction': vi.fn().mockImplementation(async (fn: (tx: unknown) => unknown) => fn(mock)),
    '$connect': vi.fn().mockResolvedValue(undefined),
    '$disconnect': vi.fn().mockResolvedValue(undefined),
  }
  for (const m of models) mock[m] = { ...methods }
  return mock as unknown as PrismaClient
}
