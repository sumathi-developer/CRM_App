export class AnalyticsCache {
  private static cache = new Map<string, { data: any; expiresAt: number }>();
  private static readonly DEFAULT_TTL_MS = 60 * 1000; // 60 seconds TTL

  /**
   * Retrieve cached data if present and not expired.
   */
  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Store data in cache with a TTL.
   */
  static set(key: string, data: any, ttlMs: number = this.DEFAULT_TTL_MS): void {
    // Evict oldest if cache gets too large
    if (this.cache.size > 200) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Helper to execute with cache fallback.
   */
  static async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T>,
    ttlMs?: number,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const computed = await computeFn();
    this.set(key, computed, ttlMs);
    return computed;
  }

  /**
   * Clear cache entries matching a prefix or all.
   */
  static clear(prefix?: string): void {
    if (!prefix) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}
