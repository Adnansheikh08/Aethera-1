/**
 * In-process TTL cache.
 *
 * Replaces Django's LocMemCache, which backed the IP-ban counters, the ban
 * flags and the rate-limit windows in development. Same single-process
 * caveat as the original: state is per-worker and lost on restart. Point
 * REDIS_URL at a real Redis and swap this module out for multi-instance
 * deployments — the interface is deliberately get/set/incr only.
 */
class MemoryCache {
  constructor() {
    this.store = new Map();
    // Opportunistic sweep so abandoned keys cannot grow the map unbounded.
    this.sweepInterval = setInterval(() => this.sweep(), 60_000);
    this.sweepInterval.unref?.();
  }

  sweep() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) this.store.delete(key);
    }
  }

  get(key, fallback = null) {
    const entry = this.store.get(key);
    if (!entry) return fallback;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return fallback;
    }
    return entry.value;
  }

  set(key, value, ttlSeconds) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return value;
  }

  delete(key) {
    return this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

export const cache = new MemoryCache();
