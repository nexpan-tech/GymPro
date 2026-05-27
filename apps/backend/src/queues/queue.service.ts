type QueueJob = {
  name: string;
  payload: unknown;
  createdAt: Date;
};

const inMemoryQueue: QueueJob[] = [];

export class QueueService {
  static add(name: string, payload: unknown) {
    const job = {
      name,
      payload,
      createdAt: new Date(),
    };

    inMemoryQueue.push(job);

    return job;
  }

  static list() {
    return inMemoryQueue;
  }

  static clear() {
    inMemoryQueue.length = 0;
  }
}