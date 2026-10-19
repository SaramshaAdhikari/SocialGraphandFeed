import { ensureRedisConnected, getRedisClient } from '../cache/redis.js';
import { AppError } from '@socialgraph/shared';
import type { Redis } from 'ioredis';

export interface IdempotencyClaimResult<T> {
  type: 'claimed' | 'cached';
  cachedResponse?: { statusCode: number; body: T };
}

export class IdempotencyService {
  /**
   * Atomically claims an idempotency key for an actor and operation.
   * If key is already IN_PROGRESS, throws 409 Conflict.
   * If key is already COMPLETED, returns the cached response.
   * If key is new, claims it atomically with an IN_PROGRESS lock.
   */
  public async claim<T>(
    userId: string,
    operation: string,
    key: string
  ): Promise<IdempotencyClaimResult<T>> {
    if (!key || key.length > 128) {
      throw AppError.badRequest('Idempotency-Key must be 1 to 128 characters.');
    }

    let redis: Redis;
    try {
      redis = await ensureRedisConnected();
    } catch {
      throw AppError.serviceUnavailable('Idempotency coordination service unavailable.');
    }

    const redisKey = `idemp:${userId}:${operation}:${key}`;

    // Atomically claim IN_PROGRESS with 60s TTL
    const claim = await redis.set(redisKey, 'IN_PROGRESS', 'EX', 60, 'NX');

    if (claim === 'OK') {
      return { type: 'claimed' };
    }

    // Key already exists — inspect status
    const current = await redis.get(redisKey);
    if (current === 'IN_PROGRESS') {
      throw AppError.conflict('A concurrent operation with this Idempotency-Key is currently in progress.');
    }

    if (current && current.startsWith('COMPLETED:')) {
      const firstColon = current.indexOf(':', 10);
      const statusCode = parseInt(current.slice(10, firstColon), 10);
      const body = JSON.parse(current.slice(firstColon + 1)) as T;
      return {
        type: 'cached',
        cachedResponse: { statusCode, body },
      };
    }

    // Fallback: unable to resolve status, claim again or conflict
    throw AppError.conflict('Operation conflict detected for this Idempotency-Key.');
  }

  /**
   * Saves completed execution result with a 24-hour expiration.
   */
  public async complete(
    userId: string,
    operation: string,
    key: string,
    statusCode: number,
    body: unknown
  ): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;
    const redisKey = `idemp:${userId}:${operation}:${key}`;
    const payload = `COMPLETED:${statusCode}:${JSON.stringify(body)}`;
    await redis.set(redisKey, payload, 'EX', 86400).catch(() => {});
  }

  /**
   * Clears the in-progress claim if execution failed, so caller can safely retry.
   */
  public async clear(
    userId: string,
    operation: string,
    key: string
  ): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;
    const redisKey = `idemp:${userId}:${operation}:${key}`;
    await redis.del(redisKey).catch(() => {});
  }
}
