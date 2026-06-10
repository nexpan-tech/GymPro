import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * "Offline handling" at the backend = graceful degradation: when a channel /
 * provider is unreachable, the orchestrator records the failure (so it can be
 * inspected/retried) and STILL delivers the other channels — it never throws.
 * (The mobile client persists + retries failed chat sends; this verifies the
 * server-side resilience that pairs with it.)
 */

const { prismaMock, pushMock, socketMock } = vi.hoisted(() => ({
  prismaMock: {
    deliveryLog: { create: vi.fn().mockResolvedValue({}) },
    notification: { create: vi.fn().mockResolvedValue({ id: 'n1' }) },
    member: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
  },
  pushMock: { getTokensForUser: vi.fn(), sendPushNotification: vi.fn() },
  socketMock: { emitToUser: vi.fn() },
}))

vi.mock('../../config/db', () => ({ prisma: prismaMock }))
vi.mock('../../modules/push/push.service', () => pushMock)
vi.mock('../../modules/email/email.service', () => ({ sendEmail: vi.fn() }))
vi.mock('../../modules/sms/sms.service', () => ({ sendSms: vi.fn() }))
vi.mock('../../modules/whatsapp/whatsapp.service', () => ({ sendWhatsApp: vi.fn() }))
vi.mock('../../realtime/socket', () => socketMock)

import { CommunicationOrchestrator } from '../../modules/comms/orchestrator.service'

beforeEach(() => {
  vi.clearAllMocks()
  prismaMock.deliveryLog.create.mockResolvedValue({})
  prismaMock.notification.create.mockResolvedValue({ id: 'n1' })
})

describe('Offline / failure handling (Stage 9)', () => {
  it('a failing channel is logged FAILED while other channels still deliver', async () => {
    pushMock.getTokensForUser.mockResolvedValue(['ExponentPushToken[x]'])
    pushMock.sendPushNotification.mockRejectedValue(new Error('network down'))

    const res = await CommunicationOrchestrator.dispatch({
      gymId: 'g1',
      channels: ['IN_APP', 'SOCKET', 'PUSH'],
      recipients: [{ userId: 'u1', memberId: 'm1' }],
      title: 'T',
      message: 'M',
    })

    // IN_APP + SOCKET succeeded, PUSH failed — no throw.
    expect(res.sent).toBe(2)
    expect(res.failed).toBe(1)
    const failedLog = prismaMock.deliveryLog.create.mock.calls
      .map((c) => c[0].data)
      .find((d: { channel: string }) => d.channel === 'PUSH')
    expect(failedLog.status).toBe('FAILED')
    expect(failedLog.error).toContain('network down')
  })

  it('dispatch with zero recipients is a safe no-op', async () => {
    const res = await CommunicationOrchestrator.dispatch({
      gymId: 'g1', channels: ['IN_APP'], recipients: [], title: 'T', message: 'M',
    })
    expect(res).toMatchObject({ sent: 0, failed: 0, skipped: 0, total: 0 })
  })
})
