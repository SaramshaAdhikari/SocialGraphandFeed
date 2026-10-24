import { Redis } from 'ioredis';
import { config } from '../config/env.js';

let redisClient: Redis | null = null;
let isConnected = false;
let lastError: string | null = null;

export function connectRedis(url = config.REDIS_URL): Redis {
  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis(url, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      // Exponential backoff with a cap of 2000ms
      return Math.min(times * 50, 2000);
    },
    enableOfflineQueue: false, // Prevents queuing unbound commands when Redis is down
    lazyConnect: true,
  });

  redisClient.on('connect', () => {
    isConnected = true;
    lastError = null;
  });

  redisClient.on('ready', () => {
    isConnected = true;
    lastError = null;
  });

  redisClient.on('error', (err) => {
    isConnected = false;
    lastError = err?.message || 'Redis error';
  });

  redisClient.on('close', () => {
    isConnected = false;
  });

  redisClient.on('reconnecting', () => {
    isConnected = false;
  });

  return redisClient;
}

export async function ensureRedisConnected(): Promise<Redis> {
  const client = connectRedis();
  if (client.status === 'wait') {
    await client.connect();
  }
  return client;
}

export function getRedisClient(): Redis | null {
  return redisClient;
}

export function isRedisConnected(): boolean {
  return isConnected;
}

export async function checkRedisHealth(): Promise<{ status: 'connected' | 'disconnected' | 'degraded'; latency_ms?: number; error?: string }> {
  if (!redisClient) {
    return { status: 'disconnected', error: 'Redis client not initialized' };
  }

  const start = performance.now();
  try {
    const res = await redisClient.ping();
    if (res === 'PONG') {
      const latency_ms = Number((performance.now() - start).toFixed(2));
      return { status: 'connected', latency_ms };
    }
    return { status: 'degraded', error: `Unexpected ping response: ${res}` };
  } catch (err: any) {
    return { status: 'disconnected', error: err?.message || lastError || 'Ping failed' };
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    }
    redisClient = null;
    isConnected = false;
  }
}

/**
 * Safely retrieves and parses a JSON item from Redis cache.
 * Returns null on cache miss, parse error, or Redis error.
 */
export async function getCached<T>(cacheKey: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  try {
    const raw = await redis.get(cacheKey);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Safely caches a JSON item with a TTL and registers its key in an invalidation tag set.
 *
 * The tag set (`tagKey`) tracks all active cache key variants (e.g. per-viewer permutations)
 * for a single logical entity. It is assigned a sliding TTL (at least 60s) to guarantee that
 * tag metadata automatically expires if the entity is never mutated, preventing memory leaks.
 */
export async function setCachedWithTag<T>(
  cacheKey: string,
  tagKey: string,
  value: T,
  ttlSeconds = 30
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    const payload = JSON.stringify(value);
    const pipeline = redis.pipeline();
    pipeline.set(cacheKey, payload, 'EX', ttlSeconds);
    if (tagKey) {
      pipeline.sadd(tagKey, cacheKey);
      pipeline.expire(tagKey, Math.max(ttlSeconds * 2, 60));
    }
    await pipeline.exec();
  } catch {
    // Fail-open on cache write errors
  }
}

/**
 * Invalidate cached keys tracked by a tag key and/or pattern using non-blocking SCAN.
 * Guarantees no blocking KEYS command is used on Redis.
 *
 * Normal Path (Deterministic & Fast):
 * - Uses the tracked-key set (`tagKey` via `sadd`/`smembers`) as the primary mechanism.
 *   This retrieves and deletes all active viewer variations in O(M) time (typically M < 10)
 *   and deletes the tag set itself.
 * - If no mutations occur, `tagKey` automatically expires via sliding TTL (60s), ensuring zero leaks.
 *
 * Fail-Safe Fallback (Bounded SCAN):
 * - If `fallbackPattern` is provided, a bounded cursor `SCAN` loop (COUNT 100, max 20 iterations)
 *   inspects up to ~2,000 keys to catch any untracked or legacy keys without blocking the single-threaded
 *   Redis event loop (unlike dangerous O(N) `KEYS` commands).
 * - Trade-off / Known Limitation: Under very large keyspaces (>100k keys), 20 iterations will not exhaust
 *   the entire keyspace if an untracked key was created. However, because all cached entries have a
 *   mandatory 30s TTL, any untracked keys that escape the bounded scan are guaranteed to expire within
 *   30 seconds, strictly bounding potential staleness while eliminating Redis latency spikes and DoS risks.
 */
export async function invalidateCachePattern(tagKey?: string, fallbackPattern?: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    const keysToDelete = new Set<string>();

    if (tagKey) {
      keysToDelete.add(tagKey);
      const members = await redis.smembers(tagKey);
      if (members && members.length > 0) {
        for (const k of members) {
          keysToDelete.add(k);
        }
      }
    }

    if (fallbackPattern) {
      let cursor = '0';
      let iterations = 0;
      do {
        const [nextCursor, matchedKeys] = await redis.scan(cursor, 'MATCH', fallbackPattern, 'COUNT', 100);
        cursor = nextCursor;
        for (const k of matchedKeys) {
          keysToDelete.add(k);
        }
        iterations++;
      } while (cursor !== '0' && iterations < 20);
    }

    if (keysToDelete.size > 0) {
      await redis.del(...Array.from(keysToDelete));
    }
  } catch {
    // Fail-open: cache errors must never crash the service or fail the transaction
  }
}
