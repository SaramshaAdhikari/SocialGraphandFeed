import { ensureRedisConnected } from '../cache/redis.js';
import { AppError } from '@socialgraph/shared';
import { securityLogger } from '../utils/security-logger.js';
import type { Redis } from 'ioredis';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

export class RateLimitService {
  /**
   * Consumes a hit against a rate limit key.
   * Uses Redis atomic pipeline.
   * If Redis is unavailable or fails, FAILS CLOSED by throwing 503 Service Unavailable.
   */
  public async consume(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<RateLimitResult> {
    let redis: Redis;
    try {
      redis = await ensureRedisConnected();
    } catch {
      throw AppError.serviceUnavailable('Rate limiting service unavailable.');
    }

    try {
      const redisKey = `rl:${key}`;
      const pipeline = redis.pipeline();
      pipeline.incr(redisKey);
      pipeline.ttl(redisKey);
      const results = await pipeline.exec();

      if (!results || results.length < 2) {
        throw new Error('Redis pipeline failed');
      }

      const [incrErr, currentCount] = results[0] as [Error | null, number];
      const [ttlErr, currentTtl] = results[1] as [Error | null, number];

      if (incrErr) throw incrErr;
      if (ttlErr) throw ttlErr;

      // If new key or no TTL set, set expiration window
      if (currentCount === 1 || currentTtl === -1) {
        await redis.expire(redisKey, windowSeconds);
      }

      const remaining = Math.max(0, limit - currentCount);
      const resetSeconds = currentTtl > 0 ? currentTtl : windowSeconds;

      if (currentCount > limit) {
        return {
          allowed: false,
          limit,
          remaining: 0,
          resetSeconds,
        };
      }

      return {
        allowed: true,
        limit,
        remaining,
        resetSeconds,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      // Fail closed per security requirements (Section 10 & Core Principle 24)
      throw AppError.serviceUnavailable('Rate limiting service unavailable.');
    }
  }

  /**
   * Enforces rate limiting or throws AppError.rateLimited (429) / AppError.serviceUnavailable (503).
   */
  public async checkOrThrow(opts: {
    action: string;
    ip: string;
    userId?: string;
    limit: number;
    windowSeconds: number;
    requestId?: string;
  }): Promise<void> {
    const { action, ip, userId, limit, windowSeconds, requestId } = opts;

    // 1. IP dimension
    const ipRes = await this.consume(`${action}:ip:${ip}`, limit, windowSeconds);
    if (!ipRes.allowed) {
      securityLogger.rateLimitHit({
        action,
        ip,
        userId,
        requestId,
        limit,
        windowSeconds,
      });
      throw AppError.rateLimited(
        `Rate limit exceeded for ${action}. Please try again in ${ipRes.resetSeconds} seconds.`,
        ipRes.resetSeconds
      );
    }

    // 2. User dimension (if authenticated or identifier provided)
    if (userId) {
      const userRes = await this.consume(`${action}:user:${userId}`, limit, windowSeconds);
      if (!userRes.allowed) {
        securityLogger.rateLimitHit({
          action,
          ip,
          userId,
          requestId,
          limit,
          windowSeconds,
        });
        throw AppError.rateLimited(
          `Rate limit exceeded for ${action}. Please try again in ${userRes.resetSeconds} seconds.`,
          userRes.resetSeconds
        );
      }
    }
  }
}
