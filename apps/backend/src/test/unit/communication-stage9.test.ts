import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prismaMock, pushMock, emailMock, socketMock } = vi.hoisted(() => ({
  prismaMock: {
    deliveryLog: { create: vi.fn().mockResolvedValue({}) },
    notification: { create: vi.fn().mockResolvedValue({ id: 'n1' }) },
    member: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
  },
  pushMock: { getTokensForUser: vi.fn(), sendPushNotification: vi.fn().mockResolvedValue(undefined) },
  emailMock: { sendEmail: vi.fn() },
  socketMock: { emitToUser: vi.fn() },
}))

vi.mock('../../config/db', () => ({ prisma: prismaMock }))
vi.mock('../../modules/push/push.service', () => pushMock)
vi.mock('../../modules/email/email.service', () => emailMock)
vi.mock('../../modules/sms/sms.service', () => ({ sendSms: vi.fn().mockResolvedValue({ skipped: true }) }))
vi.mock('../../modules/whatsapp/whatsapp.service', () => ({ sendWhatsApp: vi.fn().mockResolvedValue({ skipped: true }) }))
vi.mock('../../realtime/socket', () => socketMock)

import { CommunicationOrchestrator } from '../../modules/comms/orchestrator.service'

beforeEach(() => {
  vi.clearAllMocks()
  delete process.env.SMTP_USER
  delete process.env.SMTP_PASS
  delete process.env.SMS_ENABLED
  delete process.env.WHATSAPP_ENABLED
  prismaMock.deliveryLog.create.mockResolvedValue({})
  prismaMock.notification.create.mockResolvedValue({ id: 'n1' })
})

describe('CommunicationOrchestrator.dispatch (Stage 9)', () => {
  it('delivers IN_APP + SOCKET + PUSH and writes a DeliveryLog per channel', async () => {
    pushMock.getTokensForUser.mockResolvedValue(['ExponentPushToken[abc]'])
    const res = await CommunicationOrchestrator.dispatch({
      gymId: 'g1',
      channels: ['IN_APP', 'SOCKET', 'PUSH'],
      recipients: [{ userId: 'u1', memberId: 'm1', email: 'a@b.com', phone: '999' }],
      title: 'Hi',
      message: 'Body',
    })
    expect(res.sent).toBe(3)
    expect(prismaMock.notification.create).toHaveBeenCalledTimes(1) // IN_APP
    expect(socketMock.emitToUser).toHaveBeenCalled() // IN_APP + SOCKET
    expect(pushMock.sendPushNotification).toHaveBeenCalledTimes(1)
    expect(prismaMock.deliveryLog.create).toHaveBeenCalledTimes(3)
  })

  it('SKIPS unavailable channels (EMAIL/SMS not configured) without crashing', async () => {
    pushMock.getTokensForUser.mockResolvedValue([])
    const res = await CommunicationOrchestrator.dispatch({
      gymId: 'g1',
      channels: ['EMAIL', 'SMS', 'WHATSAPP'],
      recipients: [{ userId: 'u1', memberId: 'm1', email: 'a@b.com', phone: '999' }],
      title: 'Hi',
      message: 'Body',
    })
    expect(res.skipped).toBe(3)
    expect(res.sent).toBe(0)
    // Each logged as SKIPPED.
    const statuses = prismaMock.deliveryLog.create.mock.calls.map((c) => c[0].data.status)
    expect(statuses.every((s: string) => s === 'SKIPPED')).toBe(true)
  })

  it('sends EMAIL when configured, SKIPS when provider returns skipped', async () => {
    process.env.SMTP_USER = 'u'
    process.env.SMTP_PASS = 'p'
    emailMock.sendEmail.mockResolvedValue({ messageId: 'x' })
    const res = await CommunicationOrchestrator.dispatch({
      gymId: 'g1', channels: ['EMAIL'], recipients: [{ userId: 'u1', email: 'a@b.com' }], title: 'T', message: 'M',
    })
    expect(res.sent).toBe(1)
    expect(emailMock.sendEmail).toHaveBeenCalled()
  })

  it('resolveAudience is tenant-scoped and de-duplicates by user', async () => {
    prismaMock.member.findMany.mockResolvedValue([
      { userId: 'u1', id: 'm1', phone: '1', user: { email: 'a@b.com' } },
      { userId: 'u2', id: 'm2', phone: '2', user: { email: 'b@b.com' } },
    ])
    prismaMock.user.findMany.mockResolvedValue([])
    const recipients = await CommunicationOrchestrator.resolveAudience('g1', 'MEMBERS')
    expect(recipients).toHaveLength(2)
    expect(prismaMock.member.findMany.mock.calls[0][0].where.gymId).toBe('g1')
  })
})
