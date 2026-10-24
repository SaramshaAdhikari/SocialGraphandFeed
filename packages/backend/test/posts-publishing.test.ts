import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { connectMongo, getDb } from '../src/db/mongo.js';
import { connectRedis } from '../src/cache/redis.js';
import { requiredTestServiceUrl } from './test-env.js';
import { seedDatabase } from '../src/db/seed.js';
import { AuthService } from '../src/services/AuthService.js';
import { COLLECTIONS } from '../src/db/collections.js';
import { Value } from '@sinclair/typebox/value';
import { PostCardSchema } from '@socialgraph/shared';
import type { UserDoc } from '../src/db/types.js';

describe('Discussion Post Publishing & Rate Limiting Regression Suite', () => {
  let app: FastifyInstance;
  let authService: AuthService;
  let sessionToken: string;
  let csrfToken: string;

  beforeAll(async () => {
    await connectMongo(requiredTestServiceUrl('MONGODB_TEST_URI'), 'socialgraph_publishing_test');
    const redis = connectRedis();
    if (redis.status === 'wait') await redis.connect().catch(() => {});
    await redis.flushdb().catch(() => {});

    await seedDatabase(getDb());
    authService = new AuthService();
    app = buildApp({}, { devUserBypass: false });
    await app.ready();

    // Create session for usr_0 (alex_dev)
    const session = await authService.createSession('usr_0');
    sessionToken = session.token;
    csrfToken = session.csrf;
  });

  afterAll(async () => {
    if (app) await app.close();
    await getDb().dropDatabase();
  });

  describe('Phase 2 — Tag Schema Validation & Canonical Representation', () => {
    it('1. publishing with no tags succeeds when required fields are valid', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        remoteAddress: '198.51.100.10',
        headers: {
          cookie: `sg_session=${sessionToken}`,
          'x-csrf-token': csrfToken,
        },
        payload: {
          post_type: 'discussion',
          title: 'Publishing discussion without any tags',
          content: 'Benchmark evaluation of binary schema formats under high arrival rates.',
        },
      });

      expect(res.statusCode).toBe(201);
      const post = res.json();
      expect(post.id).toBeDefined();
      expect(post.tags).toBeUndefined();
      expect(post.flair).toBeUndefined();
      expect(Value.Check(PostCardSchema, post)).toBe(true);
    });

    it('2. publishing with one valid tag succeeds and conforms to canonical format', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        remoteAddress: '198.51.100.11',
        headers: {
          cookie: `sg_session=${sessionToken}`,
          'x-csrf-token': csrfToken,
        },
        payload: {
          post_type: 'discussion',
          title: 'Publishing discussion with single valid tag',
          content: 'Benchmark evaluation of memory fragmentation under multi-tenant workloads.',
          tags: ['performance'],
          flair: 'performance',
        },
      });

      expect(res.statusCode).toBe(201);
      const post = res.json();
      expect(post.tags).toEqual(['performance']);
      expect(post.flair).toBe('performance');
      expect(Value.Check(PostCardSchema, post)).toBe(true);
    });

    it('3. publishing with multiple valid tags succeeds and normalizes duplicates', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        remoteAddress: '198.51.100.12',
        headers: {
          cookie: `sg_session=${sessionToken}`,
          'x-csrf-token': csrfToken,
        },
        payload: {
          post_type: 'discussion',
          title: 'Publishing discussion with multiple tags',
          content: 'Observability and eBPF tracing across distributed microservices.',
          tags: ['performance', 'systems', 'observability'],
        },
      });

      expect(res.statusCode).toBe(201);
      const post = res.json();
      expect(post.tags).toEqual(['performance', 'systems', 'observability']);
      expect(post.flair).toBe('performance');
      expect(Value.Check(PostCardSchema, post)).toBe(true);
    });

    it('4. strictly rejects standalone "#" as a tag with 400 Bad Request (schema mismatch)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        remoteAddress: '198.51.100.13',
        headers: {
          cookie: `sg_session=${sessionToken}`,
          'x-csrf-token': csrfToken,
        },
        payload: {
          post_type: 'discussion',
          title: 'Attempting to publish with hash character',
          content: 'Testing schema rejection of standalone hash character.',
          tags: ['#'],
        },
      });

      expect(res.statusCode).toBe(400);
      const err = res.json();
      expect(err.code).toBe('BAD_REQUEST');
      const params = err.invalidParams || err.invalid_params;
      expect(params).toBeDefined();
      expect(params.some((p: any) => p.name.includes('tags'))).toBe(true);
    });

    it('5. strictly rejects malformed tags containing leading "#" or whitespace', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        remoteAddress: '198.51.100.14',
        headers: {
          cookie: `sg_session=${sessionToken}`,
          'x-csrf-token': csrfToken,
        },
        payload: {
          post_type: 'discussion',
          title: 'Attempting to publish with un-normalized hash tag',
          content: 'Testing schema rejection of unstripped hash tag.',
          tags: ['#performance'],
        },
      });

      expect(res.statusCode).toBe(400);
      const err = res.json();
      expect(err.code).toBe('BAD_REQUEST');
    });

    it('6. user with empty avatar_url in database serializes safely with default avatar fallback without throwing "#" schema error', async () => {
      // Create a test user with avatar_url: "" (simulating the reproduced avid_06 user condition)
      const userCol = getDb().collection<UserDoc>(COLLECTIONS.USERS);
      const emptyAvatarUser: UserDoc = {
        _id: 'usr_empty_avatar_test',
        username: 'empty_avatar_user',
        display_name: 'Empty Avatar User',
        avatar_url: '',
        bio: '',
        is_verified: false,
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
        role: 'user',
        password_hash: 'hash',
      };
      await userCol.insertOne(emptyAvatarUser);

      const emptyAvatarSession = await authService.createSession(emptyAvatarUser._id);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        remoteAddress: '198.51.100.15',
        headers: {
          cookie: `sg_session=${emptyAvatarSession.token}`,
          'x-csrf-token': emptyAvatarSession.csrf,
        },
        payload: {
          post_type: 'discussion',
          title: 'Testing Empty Avatar Serializer Fallback',
          content: 'This discussion should successfully serialize with fallback avatar and not throw # error.',
          tags: ['performance'],
        },
      });

      expect(res.statusCode).toBe(201);
      const post = res.json();
      expect(post.author.avatar_url).toBe('/avatars/alex-dev.svg');
      expect(Value.Check(PostCardSchema, post)).toBe(true);

      await userCol.deleteOne({ _id: emptyAvatarUser._id });
    });
  });

  describe('Phase 3 & 4 — Rate Limiting Ordering & Idempotency Reliability', () => {
    it('7. failed validation does not consume rate limit quota', async () => {
      const redis = connectRedis();
      const testIp = '198.51.100.50';

      // Register temporary user for isolated rate testing
      const testUser = await authService.register('rl_val_user', 'password123');
      const testSession = await authService.createSession(testUser.id);

      await redis.del(`rl:post:ip:${testIp}`);
      await redis.del(`rl:post:user:${testUser.username}`);

      // Attempt 5 invalid requests with invalid protocol in destination_url
      for (let i = 0; i < 5; i++) {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/posts',
          remoteAddress: testIp,
          headers: {
            cookie: `sg_session=${testSession.token}`,
            'x-csrf-token': testSession.csrf,
          },
          payload: {
            post_type: 'visual',
            title: 'Invalid URL pin',
            destination_url: 'javascript:alert(1)',
          },
        });
        expect(res.statusCode).toBe(400);
      }

      // Check that Redis rate-limit key for this user and IP was NOT incremented by failed validation
      const ipCount = await redis.get(`rl:post:ip:${testIp}`);
      const userCount = await redis.get(`rl:post:user:${testUser.username}`);
      expect(ipCount).toBeNull();
      expect(userCount).toBeNull();
    });

    it('8. repeated requests with identical Idempotency-Key return cached replay without creating duplicate posts or consuming rate limit quota', async () => {
      const idempUser = await authService.register('idemp_user_test', 'password123');
      const idempSession = await authService.createSession(idempUser.id);
      const idempKey = `test_idemp_${Date.now()}`;
      const testIp = '198.51.100.60';

      // First execution
      const firstRes = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        remoteAddress: testIp,
        headers: {
          cookie: `sg_session=${idempSession.token}`,
          'x-csrf-token': idempSession.csrf,
          'idempotency-key': idempKey,
        },
        payload: {
          post_type: 'discussion',
          title: 'Idempotent Post Title',
          content: 'Testing single persistence and replay.',
        },
      });
      expect(firstRes.statusCode).toBe(201);
      const post1 = firstRes.json();

      // Retry execution
      const retryRes = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        remoteAddress: testIp,
        headers: {
          cookie: `sg_session=${idempSession.token}`,
          'x-csrf-token': idempSession.csrf,
          'idempotency-key': idempKey,
        },
        payload: {
          post_type: 'discussion',
          title: 'Idempotent Post Title',
          content: 'Testing single persistence and replay.',
        },
      });
      expect(retryRes.statusCode).toBe(201);
      expect(retryRes.headers['x-idempotent-replay']).toBe('true');
      expect(retryRes.json().id).toBe(post1.id);

      // Verify MongoDB only created 1 post
      const count = await getDb().collection(COLLECTIONS.POSTS).countDocuments({ author_id: idempUser.id });
      expect(count).toBe(1);
    });

    it('9. genuine rate limit threshold produces 429 Too Many Requests with Retry-After header', async () => {
      const burstUser = await authService.register('burst_rl_user', 'password123');
      const burstSession = await authService.createSession(burstUser.id);
      const burstIp = '198.51.100.77';
      const redis = connectRedis();
      await redis.del(`rl:post:ip:${burstIp}`);
      await redis.del(`rl:post:user:${burstUser.username}`);

      // Post limit is 10 in 60s
      for (let i = 0; i < 10; i++) {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/posts',
          remoteAddress: burstIp,
          headers: {
            cookie: `sg_session=${burstSession.token}`,
            'x-csrf-token': burstSession.csrf,
          },
          payload: {
            post_type: 'discussion',
            title: `Rate limit burst post ${i}`,
            content: 'Burst testing rate limiter.',
          },
        });
        expect(res.statusCode).toBe(201);
      }

      // 11th request MUST be throttled with 429
      const throttledRes = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        remoteAddress: burstIp,
        headers: {
          cookie: `sg_session=${burstSession.token}`,
          'x-csrf-token': burstSession.csrf,
        },
        payload: {
          post_type: 'discussion',
          title: 'Exceeded post attempt',
          content: 'This attempt must be blocked by rate limiter.',
        },
      });

      expect(throttledRes.statusCode).toBe(429);
      expect(throttledRes.headers['retry-after']).toBeDefined();
      const body = throttledRes.json();
      expect(body.code).toBe('RATE_LIMITED');
      expect(body.retry_after).toBeGreaterThan(0);
      expect(body.detail).toContain('Rate limit exceeded for post');
    });
    it('10. concurrent requests using identical Idempotency-Key reject with 409 Conflict', async () => {
      const concUser = await authService.register('conc_idemp_user', 'password123');
      const concSession = await authService.createSession(concUser.id);
      const concKey = `test_conc_${Date.now()}`;
      const redis = connectRedis();

      // Pre-set IN_PROGRESS claim in Redis to simulate concurrent arrival
      await redis.set(`idemp:${concUser.id}:create_post:${concKey}`, 'IN_PROGRESS', 'EX', 60);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        remoteAddress: '198.51.100.80',
        headers: {
          cookie: `sg_session=${concSession.token}`,
          'x-csrf-token': concSession.csrf,
          'idempotency-key': concKey,
        },
        payload: {
          post_type: 'discussion',
          title: 'Concurrent Attempt Post',
          content: 'This attempt should receive 409 Conflict due to active claim.',
        },
      });

      expect(res.statusCode).toBe(409);
      const body = res.json();
      expect(body.code).toBe('CONFLICT');
      expect(body.detail).toContain('concurrent operation');

      // Cleanup
      await redis.del(`idemp:${concUser.id}:create_post:${concKey}`);
    });

    it('11. idempotency keys are strictly scoped per authenticated user', async () => {
      const userAlpha = await authService.register('idemp_alpha', 'password123');
      const sessionAlpha = await authService.createSession(userAlpha.id);
      const userBeta = await authService.register('idemp_beta', 'password123');
      const sessionBeta = await authService.createSession(userBeta.id);

      const sharedKey = `shared_key_${Date.now()}`;

      // Alpha creates post with sharedKey
      const resAlpha = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        remoteAddress: '198.51.100.91',
        headers: {
          cookie: `sg_session=${sessionAlpha.token}`,
          'x-csrf-token': sessionAlpha.csrf,
          'idempotency-key': sharedKey,
        },
        payload: {
          post_type: 'discussion',
          title: 'Alpha Post Title',
          content: 'Alpha post body content.',
        },
      });
      expect(resAlpha.statusCode).toBe(201);
      const postAlpha = resAlpha.json();
      expect(postAlpha.author.id).toBe(userAlpha.id);

      // Beta creates post with same sharedKey - must NOT return Alpha post, must create Beta post
      const resBeta = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        remoteAddress: '198.51.100.92',
        headers: {
          cookie: `sg_session=${sessionBeta.token}`,
          'x-csrf-token': sessionBeta.csrf,
          'idempotency-key': sharedKey,
        },
        payload: {
          post_type: 'discussion',
          title: 'Beta Post Title',
          content: 'Beta post body content.',
        },
      });
      expect(resBeta.statusCode).toBe(201);
      const postBeta = resBeta.json();
      expect(postBeta.author.id).toBe(userBeta.id);
      expect(postBeta.id).not.toBe(postAlpha.id);
    });

    it('12. failed attempt clears idempotency claim so legitimate retry is not blocked', async () => {
      const retryUser = await authService.register('retry_claim_user', 'password123');
      const retrySession = await authService.createSession(retryUser.id);
      const retryKey = `retry_key_${Date.now()}`;
      const testIp = '198.51.100.95';
      const redis = connectRedis();

      // Exhaust rate limit for this user
      await redis.set(`rl:post:user:${retryUser.id}`, '10', 'EX', 60);

      // First attempt with retryKey is throttled
      const throttledRes = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        remoteAddress: testIp,
        headers: {
          cookie: `sg_session=${retrySession.token}`,
          'x-csrf-token': retrySession.csrf,
          'idempotency-key': retryKey,
        },
        payload: {
          post_type: 'discussion',
          title: 'Throttled First Attempt',
          content: 'Payload testing idempotency claim release on error.',
        },
      });
      expect(throttledRes.statusCode).toBe(429);

      // Verify the claim key was cleared from Redis (not left IN_PROGRESS)
      const claimStatus = await redis.get(`idemp:${retryUser.id}:create_post:${retryKey}`);
      expect(claimStatus).toBeNull();

      // Reset rate limit quota to simulate window elapsed
      await redis.del(`rl:post:user:${retryUser.id}`);

      // Retry with the exact same key now succeeds without conflict
      const retryRes = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        remoteAddress: testIp,
        headers: {
          cookie: `sg_session=${retrySession.token}`,
          'x-csrf-token': retrySession.csrf,
          'idempotency-key': retryKey,
        },
        payload: {
          post_type: 'discussion',
          title: 'Throttled First Attempt',
          content: 'Payload testing idempotency claim release on error.',
        },
      });
      expect(retryRes.statusCode).toBe(201);
      expect(retryRes.json().id).toBeDefined();
    });
  });
});
