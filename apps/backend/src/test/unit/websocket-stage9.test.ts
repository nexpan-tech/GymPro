import { describe, it, expect, vi } from 'vitest'
import jwt from 'jsonwebtoken'

vi.mock('../../config/env', () => ({ env: { JWT_SECRET: 'test-secret' } }))

import { verifySocketToken } from '../../realtime/socket-auth'
import { SOCKET_EVENTS } from '../../realtime/socket-events'

describe('WebSocket auth + events (Stage 9)', () => {
  it('verifies a valid JWT and returns the socket user', () => {
    const token = jwt.sign({ id: 'u1', email: 'a@b.com', role: 'MEMBER', gymId: 'g1' }, 'test-secret')
    const user = verifySocketToken(token)
    expect(user).toMatchObject({ id: 'u1', role: 'MEMBER', gymId: 'g1' })
  })

  it('accepts a Bearer-prefixed token', () => {
    const token = jwt.sign({ id: 'u2', email: 'x@y.com', role: 'TRAINER' }, 'test-secret')
    expect(verifySocketToken(`Bearer ${token}`)?.id).toBe('u2')
  })

  it('rejects missing or invalid tokens (unauthorized socket)', () => {
    expect(verifySocketToken(undefined)).toBeNull()
    expect(verifySocketToken('garbage')).toBeNull()
    expect(verifySocketToken(jwt.sign({ id: 'u' }, 'WRONG-secret'))).toBeNull()
  })

  it('exposes the Stage 9 realtime event name constants', () => {
    expect(SOCKET_EVENTS.NOTIFICATION_CREATED).toBe('notification.created')
    expect(SOCKET_EVENTS.ANNOUNCEMENT_SENT).toBe('announcement.sent')
    expect(SOCKET_EVENTS.CHAT_MESSAGE).toBe('chat.message')
    expect(SOCKET_EVENTS.PAYMENT_UPDATED).toBe('payment.updated')
    expect(SOCKET_EVENTS.CHALLENGE_UPDATED).toBe('challenge.updated')
  })
})
