import { describe, it, expect, vi, beforeEach } from 'vitest'

// Stub BullMQ so importing the dlq module doesn't open a real Redis connection.
const { addMock } = vi.hoisted(() => ({ addMock: vi.fn() }))
vi.mock('bullmq', () => ({
  Queue: class {
    add = addMock
  },
}))

import { defaultJobOptions } from '../../queues/redis'
import { addToDLQ } from '../../queues/dlq'

beforeEach(() => vi.clearAllMocks())

describe('Queue retry + DLQ (Stage 9)', () => {
  it('default job options use 3 attempts with exponential backoff', () => {
    expect(defaultJobOptions.attempts).toBe(3)
    expect(defaultJobOptions.backoff).toMatchObject({ type: 'exponential', delay: 2000 })
    // Failed jobs are retained so they can be inspected / moved to the DLQ.
    expect(defaultJobOptions.removeOnFail).toBe(false)
  })

  it('addToDLQ enqueues a failed job with its original context + error', async () => {
    const job = { id: 'j1', name: 'send-notification', data: { notificationId: 'n1' }, attemptsMade: 3 }
    await addToDLQ('notifications', job, new Error('boom'))
    expect(addMock).toHaveBeenCalledWith('failed-job', expect.objectContaining({
      originalQueue: 'notifications',
      originalJobId: 'j1',
      errorMessage: 'boom',
      attemptsMade: 3,
    }))
  })

  it('addToDLQ never throws even if the DLQ enqueue fails', async () => {
    addMock.mockRejectedValueOnce(new Error('redis down'))
    const job = { id: 'j2', name: 'x', data: {}, attemptsMade: 3 }
    await expect(addToDLQ('emails', job, new Error('e'))).resolves.toBeUndefined()
  })
})
