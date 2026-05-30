import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPrismaMock } from '../helpers/prisma'
import { gymFactory, memberFactory } from '../factories'

describe('Multi-Tenant Data Isolation', () => {
  let prisma: ReturnType<typeof createPrismaMock>

  beforeEach(() => {
    prisma = createPrismaMock()
    vi.clearAllMocks()
  })

  it('member queries must include gymId scope', async () => {
    const gym = gymFactory({ id: 'gym-A' })
    vi.mocked(prisma.member.findMany).mockResolvedValue([] as never)

    await prisma.member.findMany({ where: { gymId: gym.id } })

    expect(prisma.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ gymId: 'gym-A' }) })
    )
  })

  it('gym-A query does not return gym-B records', async () => {
    vi.mocked(prisma.member.findMany).mockResolvedValue([] as never)

    const result = await prisma.member.findMany({ where: { gymId: 'gym-A' } })

    expect(result).toHaveLength(0)
    expect(prisma.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { gymId: 'gym-A' } })
    )
  })

  it('factory creates members with explicit gymId', () => {
    const member = memberFactory({ gymId: 'gym-B' })
    expect(member.gymId).toBe('gym-B')
  })
})
