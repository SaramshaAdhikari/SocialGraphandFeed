import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { connectMongo, disconnectMongo, getDb } from '../src/db/mongo.js';
import { connectRedis, disconnectRedis } from '../src/cache/redis.js';
import { requiredTestServiceUrl } from './test-env.js';
import { AuthService } from '../src/services/AuthService.js';
import { RateLimitService } from '../src/services/RateLimitService.js';
import { AppError } from '@socialgraph/shared';
import type { Redis } from 'ioredis';

describe('Production Distributed Login Rate Limiting (Multi-Instance Redis Enforcement)', () => {
  let appInstance1: FastifyInstance;
  let appInstance2: FastifyInstance;
  let authService: AuthService;
  let rateLimitService: RateLimitService;
  let redis: Redis;

  beforeAll(async () => {
    await connectMongo(requiredTestServiceUrl('MONGODB_TEST_URI'), 'socialgraph_distributed_ratelimit_test');
    redis = connectRedis(requiredTestServiceUrl('REDIS_TEST_URL'));
    if (redis.status === 'wait') await redis.connect().catch(() => {});
    await redis.flushdb().catch(() => {});

    authService = new AuthService();
    rateLimitService = new RateLimitService(redis);

    // Instantiate two distinct Fastify service instances sharing the same database and Redis
    appInstance1 = buildApp({}, { devUserBypass: false });
    appInstance2 = buildApp({}, { devUserBypass: false });
    await Promise.all([appInstance1.ready(), appInstance2.ready()]);
  });

  afterAll(async () => {
    await Promise.all([appInstance1.close(), appInstance2.close()]);
    await getDb().dropDatabase().catch(() => {});
    await disconnectMongo();
    await redis.flushdb().catch(() => {});
    await disconnectRedis();
  });

  describe('1. Cross-Instance State Sharing', () => {
    it('enforces shared login limits across separate backend service instances sharing Redis', async () => {
      const clientIp = '198.51.100.10';
      const targetUser = `multi_inst_${Date.now()}`;

      // 3 attempts to Instance 1
      for (let i = 0; i < 3; i++) {
        const res = await appInstance1.inject({
          method: 'POST',
          url: '/api/v1/auth/login',
          remoteAddress: clientIp,
          payload: { username: targetUser, password: 'wrongPassword' },
        });
        expect(res.statusCode).toBe(401);
      }

      // 2 attempts to Instance 2 (total reaches configured limit of 5)
      for (let i = 0; i < 2; i++) {
        const res = await appInstance2.inject({
          method: 'POST',
          url: '/api/v1/auth/login',
          remoteAddress: clientIp,
          payload: { username: targetUser, password: 'wrongPassword' },
        });
        expect(res.statusCode).toBe(401);
      }

      // 6th attempt to Instance 1 MUST trigger 429 Too Many Requests
      const blockedInstance1 = await appInstance1.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        remoteAddress: clientIp,
        payload: { username: targetUser, password: 'wrongPassword' },
      });
      expect(blockedInstance1.statusCode).toBe(429);
      expect(blockedInstance1.json().code).toBe('RATE_LIMITED');
      expect(blockedInstance1.headers['retry-after']).toBeDefined();

      // 7th attempt to Instance 2 MUST ALSO trigger 429 Too Many Requests
      const blockedInstance2 = await appInstance2.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        remoteAddress: clientIp,
        payload: { username: targetUser, password: 'wrongPassword' },
      });
      expect(blockedInstance2.statusCode).toBe(429);
      expect(blockedInstance2.json().code).toBe('RATE_LIMITED');
      expect(blockedInstance2.headers['retry-after']).toBeDefined();
    });
  });

  describe('2. Concurrent Burst Protection & Atomic Lua Execution', () => {
    it('prevents concurrent race conditions from bypassing the configured rate limit', async () => {
      const clientIp = `198.51.100.${Math.floor(Math.random() * 150 + 50)}`;
      const targetUser = `burst_user_${Date.now()}`;

      // Fire 15 concurrent login requests split across both backend instances simultaneously
      const requests = Array.from({ length: 15 }, (_, i) => {
        const targetApp = i % 2 === 0 ? appInstance1 : appInstance2;
        return targetApp.inject({
          method: 'POST',
          url: '/api/v1/auth/login',
          remoteAddress: clientIp,
          payload: { username: targetUser, password: 'wrongPassword' },
        });
      });

      const responses = await Promise.all(requests);
      const allowedCount = responses.filter((r) => r.statusCode === 401).length;
      const rateLimitedCount = responses.filter((r) => r.statusCode === 429).length;

      // Exactly 5 attempts allowed to hit authentication logic; remaining 10 blocked by atomic Lua script
      expect(allowedCount).toBe(5);
      expect(rateLimitedCount).toBe(10);
      expect(allowedCount + rateLimitedCount).toBe(15);
    });
  });

  describe('3. Multi-Dimensional Isolation & Normalization', () => {
    it('isolates IP and account dimensions while preventing cross-account lockout', async () => {
      const ipAttacker = '198.51.100.40';
      const ipInnocent = '198.51.100.41';
      const victimUser = `victim_${Date.now()}`;
      const otherUser = `other_${Date.now()}`;

      // Attacker exhausts attempts for victimUser from ipAttacker
      for (let i = 0; i < 5; i++) {
        const res = await appInstance1.inject({
          method: 'POST',
          url: '/api/v1/auth/login',
          remoteAddress: ipAttacker,
          payload: { username: victimUser, password: 'wrongPassword' },
        });
        expect(res.statusCode).toBe(401);
      }

      // Attacker is blocked from ipAttacker
      const attackerBlocked = await appInstance1.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        remoteAddress: ipAttacker,
        payload: { username: otherUser, password: 'wrongPassword' },
      });
      expect(attackerBlocked.statusCode).toBe(429); // Blocked by IP dimension

      // Innocent user from different IP targeting otherUser is NOT blocked
      const innocentAllowed = await appInstance2.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        remoteAddress: ipInnocent,
        payload: { username: otherUser, password: 'wrongPassword' },
      });
      expect(innocentAllowed.statusCode).toBe(401); // Evaluated normally, not rate limited

      // Innocent user attempting to log into victimUser IS blocked by username dimension
      const victimBlocked = await appInstance2.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        remoteAddress: ipInnocent,
        payload: { username: victimUser.toUpperCase(), password: 'wrongPassword' },
      });
      expect(victimBlocked.statusCode).toBe(429); // Blocked by normalized user dimension
    });
  });

  describe('4. Time-Window Expiration & Recovery', () => {
    it('expires the rate limit window and allows subsequent attempts', async () => {
      const testKey = `test_expire_${Date.now()}`;
      const limit = 2;
      const windowSeconds = 1;

      // Consume up to limit
      const hit1 = await rateLimitService.consume(testKey, limit, windowSeconds);
      expect(hit1.allowed).toBe(true);
      expect(hit1.remaining).toBe(1);

      const hit2 = await rateLimitService.consume(testKey, limit, windowSeconds);
      expect(hit2.allowed).toBe(true);
      expect(hit2.remaining).toBe(0);

      // Exceeds limit
      const hit3 = await rateLimitService.consume(testKey, limit, windowSeconds);
      expect(hit3.allowed).toBe(false);

      // Wait for 1100ms for window to expire in Redis
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // After expiration, should permit requests again
      const hitAfter = await rateLimitService.consume(testKey, limit, windowSeconds);
      expect(hitAfter.allowed).toBe(true);
      expect(hitAfter.remaining).toBe(1);
    });
  });

  describe('5. Counter Reset on Successful Authentication', () => {
    it('resets login rate limit counter upon successful authentication across all dimensions', async () => {
      const testIp = `198.51.100.${Math.floor(Math.random() * 150 + 50)}`;
      const username = `success_user_${Date.now()}`;
      await authService.register(username, 'correctPassword123');

      // 3 failed login attempts
      for (let i = 0; i < 3; i++) {
        const res = await appInstance1.inject({
          method: 'POST',
          url: '/api/v1/auth/login',
          remoteAddress: testIp,
          payload: { username, password: 'wrongPassword' },
        });
        expect(res.statusCode).toBe(401);
      }

      // Successful login from Instance 2
      const loginRes = await appInstance2.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        remoteAddress: testIp,
        payload: { username, password: 'correctPassword123' },
      });
      expect(loginRes.statusCode).toBe(200);

      // Verify user counter was cleared, but IP-level rate-limit counter was PRESERVED
      const ipKey = await redis.get(`rl:login:ip:${testIp}`);
      const userKey = await redis.get(`rl:login:user:${username}`);
      expect(userKey).toBeNull();
      // IP limit remains intact to prevent attacker credential interleaving
      expect(ipKey).not.toBeNull();
      expect(Number(ipKey)).toBe(4);
    });

    it('prevents attacker with a valid credential from resetting the aggregate IP rate limit to brute-force a victim account', async () => {
      const attackerIp = '198.51.100.222';
      const validUser = `valid_acc_${Date.now()}`;
      const victimUser = `victim_acc_${Date.now()}`;

      await authService.register(validUser, 'validPass123');
      await authService.register(victimUser, 'victimPass123');

      // Attacker attempts 4 failed logins on victim user from attackerIp
      for (let i = 0; i < 4; i++) {
        const res = await appInstance1.inject({
          method: 'POST',
          url: '/api/v1/auth/login',
          remoteAddress: attackerIp,
          payload: { username: victimUser, password: 'wrongPassword' },
        });
        expect(res.statusCode).toBe(401);
      }

      // Attacker performs 1 successful login using their own valid account from attackerIp
      const validLoginRes = await appInstance2.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        remoteAddress: attackerIp,
        payload: { username: validUser, password: 'validPass123' },
      });
      expect(validLoginRes.statusCode).toBe(200);

      // Next attempt from attackerIp (now 6th attempt total on that IP) MUST trigger 429
      const blockedRes = await appInstance1.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        remoteAddress: attackerIp,
        payload: { username: victimUser, password: 'anotherWrongPassword' },
      });
      expect(blockedRes.statusCode).toBe(429);
      expect(blockedRes.json().code).toBe('RATE_LIMITED');
    });
  });

  describe('6. Fail-Closed Security Policy during Redis Outage', () => {
    it('fails closed with 503 Service Unavailable when Redis is unreachable and does not silently allow login', async () => {
      // Mock an isolated rate limit service instance pointing to a dead Redis client
      const brokenRedisMock = {
        eval: async () => {
          throw new Error('Connection lost to Redis server');
        },
      } as unknown as Redis;

      const brokenLimiter = new RateLimitService(brokenRedisMock);

      await expect(
        brokenLimiter.checkOrThrow({
          action: 'login',
          ip: '127.0.0.1',
          userId: 'some_user',
          limit: 5,
          windowSeconds: 60,
        })
      ).rejects.toThrow(AppError);

      try {
        await brokenLimiter.checkOrThrow({
          action: 'login',
          ip: '127.0.0.1',
          userId: 'some_user',
          limit: 5,
          windowSeconds: 60,
        });
        expect.unreachable('Must not allow requests through when rate limiting cannot be verified');
      } catch (err: any) {
        expect(err.statusCode).toBe(503);
        expect(err.code).toBe('SERVICE_UNAVAILABLE');
      }
    });
  });

  describe('7. Account Enumeration Resistance', () => {
    it('produces identical status codes and error formats for existing and non-existent usernames', async () => {
      const existingUser = `enum_exist_${Date.now()}`;
      await authService.register(existingUser, 'password123');
      const absentUser = `enum_absent_${Date.now()}`;

      const resExist = await appInstance1.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        remoteAddress: '198.51.100.88',
        payload: { username: existingUser, password: 'wrongPassword' },
      });

      const resAbsent = await appInstance2.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        remoteAddress: '198.51.100.89',
        payload: { username: absentUser, password: 'wrongPassword' },
      });

      expect(resExist.statusCode).toBe(401);
      expect(resAbsent.statusCode).toBe(401);
      const jsonExist = resExist.json();
      const jsonAbsent = resAbsent.json();
      expect(jsonExist.code).toBe(jsonAbsent.code);
      expect(jsonExist.code).toBe('UNAUTHORIZED');
      expect(jsonExist.title).toBe(jsonAbsent.title);
      expect(jsonExist.detail).toBe(jsonAbsent.detail);
      expect(jsonExist.detail).toBe('Invalid username or password.');
      expect(jsonExist.status).toBe(jsonAbsent.status);
    });
  });
});
