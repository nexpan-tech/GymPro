const memoryCache = new Map<string, { value: unknown; expiresAt: number }>();

export class CacheService {
  static set(key: string, value: unknown, ttlSeconds = 300) {
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  static get<T>(key: string): T | null {
    const item = memoryCache.get(key);

    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      memoryCache.delete(key);
      return null;
    }

    return item.value as T;
  }

  static delete(key: string) {
    memoryCache.delete(key);
  }

  static clear() {
    memoryCache.clear();
  }
}