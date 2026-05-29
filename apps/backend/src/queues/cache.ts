import { redisConnection } from "./redis";

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisConnection.get(key);

      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      console.error("Cache get failed", error);
      return null;
    }
  }

  static async set(key: string, value: any, ttlSeconds = 300) {
    try {
      await redisConnection.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch (error) {
      console.error("Cache set failed", error);
    }
  }

  static async del(key: string) {
    try {
      await redisConnection.del(key);
    } catch (error) {
      console.error("Cache delete failed", error);
    }
  }

  static async remember<T>(
    key: string,
    ttlSeconds: number,
    callback: () => Promise<T>
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached) return cached;

    const fresh = await callback();

    await this.set(key, fresh, ttlSeconds);

    return fresh;
  }
}