import "server-only";

type CacheValue<T> = { value: T; expiresAt: number };

export class TtlCache<T> {
  private readonly values = new Map<string, CacheValue<T>>();

  get(key: string) {
    const entry = this.values.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.values.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number) {
    this.values.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}

export const WEATHER_CACHE_MS = 30 * 60 * 1000;
export const ALERT_CACHE_MS = 5 * 60 * 1000;
