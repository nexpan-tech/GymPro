import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { deviceToken: { upsert: vi.fn().mockResolvedValue({}), findMany: vi.fn() } },
}))

vi.mock('../../config/db', () => ({ prisma: prismaMock }))
vi.mock('../../config/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import {
  sendPushToToken,
  sendBulkPush,
  registerToken,
  getTokensForUser,
} from '../../modules/push/push.service'

const VALID = 'ExponentPushToken[abc123]'

beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.unstubAllGlobals())

describe('Push notifications (Stage 9)', () => {
  it('rejects malformed Expo tokens without calling the API', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const ok = await sendPushToToken('not-a-token', 'T', 'B')
    expect(ok).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends to a valid Expo token via the Expo push API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { status: 'ok' } }) })
    vi.stubGlobal('fetch', fetchMock)
    const ok = await sendPushToToken(VALID, 'Title', 'Body', { a: 1 })
    expect(ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith('https://exp.host/--/api/v2/push/send', expect.objectContaining({ method: 'POST' }))
  })

  it('returns false on Expo delivery error', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { status: 'error', message: 'DeviceNotRegistered' } }) })
    vi.stubGlobal('fetch', fetchMock)
    expect(await sendPushToToken(VALID, 'T', 'B')).toBe(false)
  })

  it('registerToken upserts the device token (no hardcoded keys)', async () => {
    await registerToken('u1', VALID, 'ios')
    expect(prismaMock.deviceToken.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { token: VALID } }))
  })

  it('getTokensForUser returns the user\'s tokens', async () => {
    prismaMock.deviceToken.findMany.mockResolvedValue([{ token: VALID }])
    expect(await getTokensForUser('u1')).toEqual([VALID])
  })

  it('sendBulkPush filters invalid tokens before sending', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { status: 'ok' } }) })
    vi.stubGlobal('fetch', fetchMock)
    await sendBulkPush([VALID, 'bad', 'ExponentPushToken[two]'], 'T', 'B')
    expect(fetchMock).toHaveBeenCalledTimes(2) // only the two valid tokens
  })
})
