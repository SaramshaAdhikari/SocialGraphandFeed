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

/**
 * Production-Safe Distributed Rate Limiting Lua Script
 * 
 * Atomically executes INCR and guarantees TTL expiration is set in a single Redis transaction.
 * Completely eliminates race conditions between separate processes or instances where an INCR
 * succeeded but EXPIRE was dropped or failed, avoiding un-expiring rate limit keys.
 * 
 * KEYS[1]: rate limit key (e.g. "rl:login:ip:198.51.100.1")
 * ARGV[1]: window expiration in seconds (e.g. 60)
 * 
 * Returns: [currentCount, ttlSeconds]
 */
const ATOMIC_RATE_LIMIT_LUA = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('TTL', KEYS[1])
if ttl < 0 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
    ttl = tonumber(ARGV[1])
end
return { current, ttl }
`;

export class RateLimitService {
  constructor(private readonly injectedRedis?: Redis) {}

  private async getRedis(): Promise<Redis> {
    if (this.injectedRedis) {
      return this.injectedRedis;
    }
    return ensureRedisConnected();
  }

  /**
   * Consumes a hit against a rate limit key across distributed instances.
   * Uses an atomic Redis Lua script.
   * If Redis is unavailable or fails, FAILS CLOSED by throwing 503 Service Unavailable.
   */
  public async consume(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<RateLimitResult> {
    let redis: Redis;
    try {
      redis = await this.getRedis();
    } catch {
      throw AppError.serviceUnavailable('Rate limiting service unavailable.');
    }

    try {
      const redisKey = `rl:${key}`;
      const evalRes = await redis.eval(
        ATOMIC_RATE_LIMIT_LUA,
        1,
        redisKey,
        String(windowSeconds)
      );

      if (!evalRes || !Array.isArray(evalRes) || evalRes.length < 2) {
        throw new Error('Redis rate limit script returned unexpected result');
      }

      const currentCount = Number(evalRes[0]);
      const currentTtl = Number(evalRes[1]);

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
      // Fail closed per security requirements (Universal v2 §10 & SECURITY.txt Phase 4)
      throw AppError.serviceUnavailable('Rate limiting service unavailable.');
    }
  }

  /**
   * Enforces rate limiting across multiple dimensions (e.g. client IP and normalized user identifier).
   * Throws AppError.rateLimited (429) with Retry-After or AppError.serviceUnavailable (503).
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

    // 1. Client IP dimension
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

    // 2. Normalized user/account identifier dimension (if provided)
    if (userId) {
      const normalizedUser = userId.trim().toLowerCase();
      const userRes = await this.consume(`${action}:user:${normalizedUser}`, limit, windowSeconds);
      if (!userRes.allowed) {
        securityLogger.rateLimitHit({
          action,
          ip,
          userId: normalizedUser,
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

  /**
   * Resets rate-limit counters for a given action and user dimension upon successful authentication.
   * Note: The IP-level counter is intentionally NOT reset to prevent attackers who possess a single valid
   * credential from laundering or resetting the aggregate IP-based limiter while brute-forcing other accounts.
   */
  public async reset(action: string, _ip?: string, userId?: string): Promise<void> {
    try {
      if (!userId) return;
      const redis = await this.getRedis();
      await redis.del(`rl:${action}:user:${userId.trim().toLowerCase()}`);
    } catch {
      // Non-blocking on reset error to prevent masking successful auth
    }
  }
}
