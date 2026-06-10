import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock, eventsMock } = vi.hoisted(() => ({
  prismaMock: {
    challenge: { findFirst: vi.fn() },
    member: { findFirst: vi.fn() },
    challengeParticipant: { upsert: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  },
  eventsMock: { challengeJoined: vi.fn(), challengeCompleted: vi.fn() },
}))

vi.mock('../../config/db', () => ({ prisma: prismaMock }))
vi.mock('../../modules/gamification/engagement-events.service', () => ({ GamificationEvents: eventsMock }))

import { CommunityService } from '../../modules/community/community.service'

const user = { id: 'u1', role: 'ADMIN', gymId: 'g1' }
beforeEach(() => vi.clearAllMocks())

describe('CommunityService challenges (Stage 8)', () => {
  it('joinChallenge awards join points', async () => {
    prismaMock.challenge.findFirst.mockResolvedValue({ id: 'c1', gymId: 'g1' })
    prismaMock.member.findFirst.mockResolvedValue({ id: 'm1', gymId: 'g1' })
    prismaMock.challengeParticipant.upsert.mockResolvedValue({ id: 'p1', challengeId: 'c1', memberId: 'm1' })

    await CommunityService.joinChallenge(user, 'c1', 'm1')
    expect(eventsMock.challengeJoined).toHaveBeenCalledWith({ gymId: 'g1', memberId: 'm1', challengeId: 'c1' })
  })

  it('TENANT ISOLATION: cannot join a challenge from another gym', async () => {
    prismaMock.challenge.findFirst.mockResolvedValue(null)
    await expect(CommunityService.joinChallenge(user, 'cX', 'm1')).rejects.toThrow()
    expect(eventsMock.challengeJoined).not.toHaveBeenCalled()
  })

  it('updateProgress awards completion points when target reached', async () => {
    prismaMock.challengeParticipant.findFirst.mockResolvedValue({
      id: 'p1',
      isCompleted: false,
      challenge: { targetValue: 100, title: 'Run 100km' },
    })
    prismaMock.challengeParticipant.update.mockResolvedValue({ id: 'p1', isCompleted: true })

    await CommunityService.updateProgress(user, 'c1', 'm1', 100)
    expect(eventsMock.challengeCompleted).toHaveBeenCalledWith(
      expect.objectContaining({ gymId: 'g1', memberId: 'm1', challengeId: 'c1', title: 'Run 100km' }),
    )
  })

  it('updateProgress below target does NOT complete or award', async () => {
    prismaMock.challengeParticipant.findFirst.mockResolvedValue({
      id: 'p1',
      isCompleted: false,
      challenge: { targetValue: 100, title: 'Run 100km' },
    })
    prismaMock.challengeParticipant.update.mockResolvedValue({ id: 'p1', isCompleted: false })

    await CommunityService.updateProgress(user, 'c1', 'm1', 40)
    expect(eventsMock.challengeCompleted).not.toHaveBeenCalled()
  })
})
