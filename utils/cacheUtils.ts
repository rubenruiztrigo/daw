/**
 * cacheUtils.ts
 * Two-layer cache: in-memory (session) + localStorage (persistent).
 * In-memory is checked first — zero I/O, zero JSON parsing.
 * localStorage is used as a fallback for data that must survive page reloads.
 */

const DEFAULT_STALE_MS = 5 * 60 * 1000; // 5 minutos

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// ─── In-Memory Layer ─────────────────────────────────────────────────────────
// Survives tab switches and navigation within the same page session.
const memoryStore = new Map<string, CacheEntry<unknown>>();

export function setMemoryCache<T>(key: string, data: T): void {
  memoryStore.set(key, { data, timestamp: Date.now() });
}

export function getMemoryCache<T>(key: string, staleMs: number = DEFAULT_STALE_MS): T | null {
  const entry = memoryStore.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > staleMs) return null;
  return entry.data;
}

export function isMemoryCacheFresh(key: string, staleMs: number = DEFAULT_STALE_MS): boolean {
  const entry = memoryStore.get(key);
  if (!entry) return false;
  return Date.now() - entry.timestamp < staleMs;
}

export function clearMemoryCache(key: string): void {
  memoryStore.delete(key);
}

export function clearAllMemoryCache(): void {
  memoryStore.clear();
}

// ─── localStorage Layer ───────────────────────────────────────────────────────
// Survives page reloads. Used for initial render before any fetch.

export function setCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
    // Also update memory layer
    memoryStore.set(key, entry as CacheEntry<unknown>);
  } catch (e) {
    // localStorage puede estar lleno en algunos dispositivos
  }
}

export function getCache<T>(key: string): T | null {
  // Check memory first
  const memEntry = memoryStore.get(key) as CacheEntry<T> | undefined;
  if (memEntry) return memEntry.data;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    // Warm up memory layer
    memoryStore.set(key, entry as CacheEntry<unknown>);
    return entry.data;
  } catch (e) {
    return null;
  }
}

/**
 * Returns true if the cache is still fresh (not stale).
 * Checks memory first, then localStorage.
 */
export function isCacheFresh(key: string, staleMs: number = DEFAULT_STALE_MS): boolean {
  // Check memory first (faster)
  const memEntry = memoryStore.get(key);
  if (memEntry) return Date.now() - memEntry.timestamp < staleMs;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const entry: CacheEntry<unknown> = JSON.parse(raw);
    const fresh = Date.now() - entry.timestamp < staleMs;
    if (fresh) {
      // Warm up memory layer while we're here
      memoryStore.set(key, entry);
    }
    return fresh;
  } catch (e) {
    return false;
  }
}

export function clearCache(key: string): void {
  memoryStore.delete(key);
  try {
    localStorage.removeItem(key);
  } catch (e) {}
}

// ─── Safe localStorage write (handles QuotaExceededError) ────────────────────

/**
 * Writes to localStorage. On QuotaExceededError, evicts the largest expendable
 * entries (chat message caches, inline posts, manifests) and retries once.
 */
export function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e: any) {
    const isQuota = e?.name === 'QuotaExceededError' || e?.code === 22 || e?.code === 1014;
    if (!isQuota) return;
    try {
      // Round 1: evict expendable caches (manifest/feed data — rebuilt quickly from DB)
      ['author_manifest', 'event_manifest', 'weekly_trends_cache',
       'last_known_feed', 'last_known_following_feed', 'global_events_cache'].forEach(k => localStorage.removeItem(k));
      localStorage.setItem(key, value);
      return;
    } catch {}
    try {
      // Round 2: evict chat message caches (large, but NOT chat_inline_posts_* which is critical)
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('chat_msgs_')) localStorage.removeItem(k);
      }
      localStorage.setItem(key, value);
    } catch {
      // Still over quota — skip silently
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the age in ms of a cache entry, or Infinity if not found.
 */
export function cacheAge(key: string): number {
  const memEntry = memoryStore.get(key);
  if (memEntry) return Date.now() - memEntry.timestamp;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return Infinity;
    const entry: CacheEntry<unknown> = JSON.parse(raw);
    return Date.now() - entry.timestamp;
  } catch {
    return Infinity;
  }
}
