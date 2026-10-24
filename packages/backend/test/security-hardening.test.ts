import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { connectMongo, disconnectMongo, getDb } from '../src/db/mongo.js';
import * as redisModule from '../src/cache/redis.js';
import { connectRedis, disconnectRedis } from '../src/cache/redis.js';
import { requiredTestServiceUrl } from './test-env.js';
import { seedDatabase } from '../src/db/seed.js';
import { AuthService } from '../src/services/AuthService.js';
import { RateLimitService } from '../src/services/RateLimitService.js';
import { COLLECTIONS } from '../src/db/collections.js';
import { AppError } from '@socialgraph/shared';
import { createHmac } from 'node:crypto';
import { config } from '../src/config/env.js';

describe('Adversarial Security Audit & Hardening Verification Suite', () => {
  let app: FastifyInstance;
  let authService: AuthService;

  beforeAll(async () => {
    await connectMongo(requiredTestServiceUrl('MONGODB_TEST_URI'), 'socialgraph_security_test');
    const redis = connectRedis();
    if (redis.status === 'wait') await redis.connect().catch(() => {});
    await redis.flushdb().catch(() => {});

    await seedDatabase(getDb());
    authService = new AuthService();
    app = buildApp({}, { devUserBypass: false });
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
    await getDb().dropDatabase();
    const redis = connectRedis();
    await redis.flushdb().catch(() => {});
    await disconnectMongo();
    await disconnectRedis();
  });

  describe('Phase 1 — Input & Execution Attacks', () => {
    it('rejects NoSQL operator injection in auth bodies with 400 Bad Request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { username: { $gt: '' }, password: { $gt: '' } },
      });
      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.code).toBe('BAD_REQUEST');
      expect(body.request_id).toBeDefined();
    });

    it('rejects undeclared extra properties in request payload (strict schema enforcement)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { username: 'alex_dev', password: 'password', malicious_extra: 'exploit' },
      });
      expect(response.statusCode).toBe(400);
      expect(response.json().code).toBe('BAD_REQUEST');
    });

    it('rejects oversized JSON bodies exceeding 1MB limit with 413 Payload Too Large', async () => {
      const giantContent = 'A'.repeat(1024 * 1024 + 100);
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { username: 'alex_dev', password: giantContent },
      });
      expect(response.statusCode).toBe(413);
      expect(response.json().request_id).toBeDefined();
    });

    it('rejects malformed raw JSON payloads deterministically with 400 Bad Request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        headers: { 'Content-Type': 'application/json' },
        payload: '{"username": "alex_dev", "password": ',
      });
      expect(response.statusCode).toBe(400);
    });
  });

  describe('Phase 2 — Authentication & Session Attacks', () => {
    it('protects against session fixation by invalidating prior session and rotating session ID on login', async () => {
      // Register a test user with known password
      const testUser = await authService.register(`fixation_${Date.now()}`, 'password123');

      // Create initial session
      const prior = await authService.createSession(testUser._id);
      const priorHmac = createHmac('sha256', config.SESSION_SECRET).update(prior.token).digest('hex');

      // Verify prior session exists in DB
      const foundPrior = await getDb().collection(COLLECTIONS.SESSIONS).findOne({ _id: priorHmac });
      expect(foundPrior).not.toBeNull();

      // Login while presenting the prior session cookie
      const loginRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        headers: { cookie: `sg_session=${prior.token}`, 'x-csrf-token': prior.csrf },
        payload: { username: testUser.username, password: 'password123' },
      });
      expect(loginRes.statusCode).toBe(200);

      // Prior session MUST be deleted from database (fixation defense)
      const afterPrior = await getDb().collection(COLLECTIONS.SESSIONS).findOne({ _id: priorHmac });
      expect(afterPrior).toBeNull();

      // New session has a distinct token and CSRF token
      const newCookie = loginRes.headers['set-cookie']?.split(';')[0];
      const newToken = newCookie?.replace('sg_session=', '');
      expect(newToken).not.toBe(prior.token);
      expect(loginRes.json().csrf_token).not.toBe(prior.csrf);
    });

    it('invalidates sessions immediately upon logout and blocks subsequent reuse', async () => {
      const session = await authService.createSession('usr_0');
      const cookie = `sg_session=${session.token}`;

      // Logout
      const logoutRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        headers: { cookie, 'x-csrf-token': session.csrf },
        payload: {},
      });
      expect(logoutRes.statusCode).toBe(200);

      // Subsequent session check MUST fail with 401
      const checkRes = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/session',
        headers: { cookie },
      });
      expect(checkRes.statusCode).toBe(401);
    });

    it('enforces idle timeout (sessions inactive beyond 2 hours expire automatically)', async () => {
      const session = await authService.createSession('usr_0');
      const sessionHmac = createHmac('sha256', config.SESSION_SECRET).update(session.token).digest('hex');

      // Backdate last_active_at beyond the 2-hour idle window
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      await getDb().collection(COLLECTIONS.SESSIONS).updateOne(
        { _id: sessionHmac },
        { $set: { last_active_at: threeHoursAgo, created_at: threeHoursAgo } }
      );

      // Attempt to access session
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/session',
        headers: { cookie: `sg_session=${session.token}` },
      });
      expect(res.statusCode).toBe(401);

      // Session record should be purged
      const inDb = await getDb().collection(COLLECTIONS.SESSIONS).findOne({ _id: sessionHmac });
      expect(inDb).toBeNull();
    });

    it('enforces absolute timeout (sessions beyond 7 days expire)', async () => {
      const session = await authService.createSession('usr_0');
      const sessionHmac = createHmac('sha256', config.SESSION_SECRET).update(session.token).digest('hex');

      // Set expires_at in the past
      await getDb().collection(COLLECTIONS.SESSIONS).updateOne(
        { _id: sessionHmac },
        { $set: { expires_at: new Date(Date.now() - 1000) } }
      );

      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/session',
        headers: { cookie: `sg_session=${session.token}` },
      });
      expect(res.statusCode).toBe(401);
    });

    it('stores passwords strictly with bcrypt (work factor 12) per Universal v2 §4 and rejects invalid passwords', async () => {
      const u = `bcrypt_user_${Date.now()}`;
      const user = await authService.register(u, 'secretPassword123');

      // Fetch stored document directly from MongoDB
      const doc = await getDb().collection(COLLECTIONS.USERS).findOne({ _id: user.id });
      expect(doc).not.toBeNull();
      expect(doc?.password_hash).toBeDefined();
      // Verifies standard bcrypt signature with work factor 12: $2a$12$ or $2b$12$
      expect(doc?.password_hash).toMatch(/^\$2[ab]\$12\$/);

      // Verify login succeeds with valid password
      const validLogin = await authService.login(u, 'secretPassword123');
      expect(validLogin.user.id).toBe(user.id);

      // Verify login fails with invalid password
      await expect(authService.login(u, 'wrongPassword999')).rejects.toThrow(AppError);
    });

    it('guarantees late session touch updates cannot revive expired sessions', async () => {
      const session = await authService.createSession('usr_0');
      const sessionHmac = createHmac('sha256', config.SESSION_SECRET).update(session.token).digest('hex');

      // Force expiration in MongoDB
      const past = new Date(Date.now() - 1000 * 60 * 60 * 24 * 8);
      await getDb().collection(COLLECTIONS.SESSIONS).updateOne({ _id: sessionHmac }, { $set: { expires_at: past } });

      // Lookup returns null and deletes the expired session
      const lookup = await authService.session(session.token);
      expect(lookup).toBeNull();

      // Session document is gone from MongoDB
      const after = await getDb().collection(COLLECTIONS.SESSIONS).findOne({ _id: sessionHmac });
      expect(after).toBeNull();
    });
  });

  describe('Phase 3 — Authorization Boundaries', () => {
    it('blocks unauthorized access to protected endpoints without authentication', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        payload: { post_type: 'discussion', title: 'Hacked Title', content: 'Hacked body' },
      });
      expect(res.statusCode).toBe(401);
      expect(res.json().code).toBe('UNAUTHORIZED');
    });

    it('prevents regular users from accessing administrator endpoints (/admin/users)', async () => {
      // usr_1 is regular user
      const userSession = await authService.createSession('usr_1');
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/users',
        headers: { cookie: `sg_session=${userSession.token}` },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().code).toBe('FORBIDDEN');
    });

    it('ignores client-forged x-user-role and x-dev-user-id headers', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/users',
        headers: { 'x-user-role': 'admin', 'x-dev-user-id': 'usr_0' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Phase 4 — Rate Limiting & Abuse (Fail-Closed)', () => {
    it('enforces rate limits on registration per IP (3/min)', async () => {
      const testIp = '198.51.100.99';
      for (let i = 0; i < 3; i++) {
        const u = `rl_user_${Date.now()}_${i}`;
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/auth/register',
          remoteAddress: testIp,
          payload: { username: u, password: 'password123', password_confirmation: 'password123' },
        });
        expect(res.statusCode).toBe(200);
      }

      // 4th signup attempt from same IP MUST trigger 429
      const limited = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        remoteAddress: testIp,
        payload: { username: `rl_fail_${Date.now()}`, password: 'password123', password_confirmation: 'password123' },
      });
      expect(limited.statusCode).toBe(429);
      expect(limited.json().code).toBe('RATE_LIMITED');
    });

    it('enforces login rate limits (5/min) per IP and per username and sets Retry-After header', async () => {
      const testIp = `198.51.100.${Math.floor(Math.random() * 150 + 50)}`;
      const targetUser = `rl_login_user_${Date.now()}`;

      // 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/auth/login',
          remoteAddress: testIp,
          payload: { username: targetUser, password: 'wrongPassword' },
        });
        expect(res.statusCode).toBe(401);
      }

      // 6th attempt from same IP MUST trigger 429 Too Many Requests
      const limited = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        remoteAddress: testIp,
        payload: { username: targetUser, password: 'wrongPassword' },
      });
      expect(limited.statusCode).toBe(429);
      expect(limited.json().code).toBe('RATE_LIMITED');
      expect(limited.headers['retry-after']).toBeDefined();
      expect(limited.json().retry_after).toBeDefined();
    });

    it('resets login rate limit counter upon successful authentication', async () => {
      const testIp = `198.51.100.${Math.floor(Math.random() * 150 + 50)}`;
      const u = `reset_user_${Date.now()}`;
      await authService.register(u, 'correctPassword123');

      // 2 failed attempts
      for (let i = 0; i < 2; i++) {
        await app.inject({
          method: 'POST',
          url: '/api/v1/auth/login',
          remoteAddress: testIp,
          payload: { username: u, password: 'wrongPassword' },
        });
      }

      // Successful login resets counter
      const successRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        remoteAddress: testIp,
        payload: { username: u, password: 'correctPassword123' },
      });
      expect(successRes.statusCode).toBe(200);

      // Verify counter was deleted in Redis
      const redis = connectRedis();
      const ipCount = await redis.get(`rl:login:ip:${testIp}`);
      const userCount = await redis.get(`rl:login:user:${u}`);
      expect(userCount).toBeNull();
      expect(ipCount).not.toBeNull();
    });

    it('fails closed with 503 Service Unavailable when rate limiter cannot reach Redis', async () => {
      const rls = new RateLimitService();
      const spy = vi.spyOn(redisModule, 'ensureRedisConnected').mockRejectedValue(new Error('Connection refused'));

      try {
        await rls.consume('arbitrary_action', 10, 60);
        expect.unreachable('Should have thrown AppError');
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(503);
        expect(err.code).toBe('SERVICE_UNAVAILABLE');
      } finally {
        spy.mockRestore();
      }
    });
  });

  describe('Phase 5 — Idempotency & Duplicate Protection', () => {
    it('executes write once with Idempotency-Key and returns cached replay on retry', async () => {
      const session = await authService.createSession('usr_0');
      const idempKey = `test-idemp-${Date.now()}`;

      // First execution
      const firstRes = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        headers: {
          cookie: `sg_session=${session.token}`,
          'x-csrf-token': session.csrf,
          'idempotency-key': idempKey,
        },
        payload: { post_type: 'discussion', title: 'Idempotency Post', content: 'Testing duplicate protection' },
      });
      expect(firstRes.statusCode).toBe(201);
      const createdPost = firstRes.json();
      expect(createdPost.id).toBeDefined();

      // Retry execution with identical Idempotency-Key
      const retryRes = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        headers: {
          cookie: `sg_session=${session.token}`,
          'x-csrf-token': session.csrf,
          'idempotency-key': idempKey,
        },
        payload: { post_type: 'discussion', title: 'Idempotency Post', content: 'Testing duplicate protection' },
      });
      expect(retryRes.statusCode).toBe(201);
      expect(retryRes.headers['x-idempotent-replay']).toBe('true');
      expect(retryRes.json().id).toBe(createdPost.id);

      // Verify in MongoDB that only 1 document was created
      const count = await getDb().collection(COLLECTIONS.POSTS).countDocuments({ title: 'Idempotency Post' });
      expect(count).toBe(1);
    });

    it('rejects concurrent write requests with 409 Conflict when operation is in progress', async () => {
      const redis = connectRedis();
      const session = await authService.createSession('usr_0');
      const raceKey = `race-${Date.now()}`;

      // Simulate concurrent request in progress
      await redis.set(`idemp:usr_0:create_post:${raceKey}`, 'IN_PROGRESS', 'EX', 60);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        headers: {
          cookie: `sg_session=${session.token}`,
          'x-csrf-token': session.csrf,
          'idempotency-key': raceKey,
        },
        payload: { post_type: 'discussion', title: 'Race Post', content: 'Race content' },
      });
      expect(res.statusCode).toBe(409);
      expect(res.json().code).toBe('CONFLICT');
    });

    it('recovers safely across crash window: database committed with unique idempotency constraint and returns existing record on retry even if Redis cache is lost', async () => {
      const session = await authService.createSession('usr_0');
      const crashKey = `crash-recovery-${Date.now()}`;
      const redis = connectRedis();

      // 1. Initial successful post creation
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        headers: {
          cookie: `sg_session=${session.token}`,
          'x-csrf-token': session.csrf,
          'idempotency-key': crashKey,
        },
        payload: { post_type: 'discussion', title: 'Crash Recovery Post', content: 'Durable idempotency' },
      });
      expect(res.statusCode).toBe(201);
      const post = res.json();

      // 2. Simulate server crash after DB commit: delete Redis idempotency record entirely
      await redis.del(`idemp:usr_0:create_post:${crashKey}`);

      // 3. Client retries with identical Idempotency-Key
      const retryRes = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        headers: {
          cookie: `sg_session=${session.token}`,
          'x-csrf-token': session.csrf,
          'idempotency-key': crashKey,
        },
        payload: { post_type: 'discussion', title: 'Crash Recovery Post', content: 'Durable idempotency' },
      });
      expect([200, 201]).toContain(retryRes.statusCode);
      expect(retryRes.json().id).toBe(post.id);

      // 4. Confirms exactly 1 post was persisted in MongoDB
      const count = await getDb().collection(COLLECTIONS.POSTS).countDocuments({ title: 'Crash Recovery Post' });
      expect(count).toBe(1);
    });

    it('enforces actor-isolation on idempotency keys: User A key cannot collide with User B', async () => {
      const userA = await authService.createSession('usr_1');
      const userB = await authService.createSession('usr_2');
      const sharedKey = `shared-key-${Date.now()}`;

      // User A creates post with sharedKey
      const resA = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        headers: {
          cookie: `sg_session=${userA.token}`,
          'x-csrf-token': userA.csrf,
          'idempotency-key': sharedKey,
        },
        payload: { post_type: 'discussion', title: 'User A Post', content: 'Post A' },
      });
      expect(resA.statusCode).toBe(201);

      // User B creates post with identical key string sharedKey
      const resB = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        headers: {
          cookie: `sg_session=${userB.token}`,
          'x-csrf-token': userB.csrf,
          'idempotency-key': sharedKey,
        },
        payload: { post_type: 'discussion', title: 'User B Post', content: 'Post B' },
      });
      expect(resB.statusCode).toBe(201);

      // Both posts are distinct and independent
      expect(resA.json().id).not.toBe(resB.json().id);
      expect(resA.json().author.id).toBe('usr_1');
      expect(resB.json().author.id).toBe('usr_2');
    });
  });

  describe('Phase 6 — URL Validation & Media Security', () => {
    it('rejects javascript: and credential-bearing URLs in destination_url and media.url', async () => {
      const session = await authService.createSession('usr_0');

      const badDestination = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        headers: { cookie: `sg_session=${session.token}`, 'x-csrf-token': session.csrf },
        payload: { post_type: 'discussion', title: 'Malicious URL Post', destination_url: 'javascript:alert(1)' },
      });
      expect(badDestination.statusCode).toBe(400);

      const badMedia = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        headers: { cookie: `sg_session=${session.token}`, 'x-csrf-token': session.csrf },
        payload: {
          post_type: 'visual',
          title: 'Creds URL Post',
          media: { url: 'https://user:password@malicious.com/image.png' },
        },
      });
      expect(badMedia.statusCode).toBe(400);
    });
  });

  describe('Phase 9 — Headers & RFC 7807 Response Hardening', () => {
    it('sets all mandatory security headers and Content-Security-Policy', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/health' });
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(res.headers['content-security-policy']).toContain("default-src 'self'");
      expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
      expect(res.headers['x-request-id']).toBeDefined();
    });

    it('includes request_id in RFC 7807 error responses and returns no stack traces', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/non-existent-route' });
      expect(res.statusCode).toBe(404);
      const json = res.json();
      expect(json.request_id).toBeDefined();
      expect(json.type).toBe('https://socialgraph.dev/errors/not-found');
      expect(json.title).toBe('Resource Not Found');
      expect(json.status).toBe(404);
      expect(json.code).toBe('NOT_FOUND');
      expect(json.stack).toBeUndefined();
    });
  });

  describe('Phase 11 — CSRF Protection', () => {
    it('rejects mutating requests without CSRF token with 403 Forbidden', async () => {
      const session = await authService.createSession('usr_0');
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        headers: { cookie: `sg_session=${session.token}` },
        payload: { post_type: 'discussion', title: 'CSRF Attack', content: 'Forged post' },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().code).toBe('FORBIDDEN');
    });

    it('rejects mutating requests with invalid CSRF token with 403 Forbidden', async () => {
      const session = await authService.createSession('usr_0');
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        headers: { cookie: `sg_session=${session.token}`, 'x-csrf-token': 'attacker_forged_csrf' },
        payload: { post_type: 'discussion', title: 'CSRF Attack', content: 'Forged post' },
      });
      expect(res.statusCode).toBe(403);
    });

    it('issues valid pre-session CSRF token via GET /api/v1/auth/csrf and enforces on anonymous mutations', async () => {
      const csrfRes = await app.inject({ method: 'GET', url: '/api/v1/auth/csrf' });
      expect(csrfRes.statusCode).toBe(200);
      const token = csrfRes.json().csrf_token;
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThanOrEqual(16);

      const cookie = csrfRes.headers['set-cookie']?.split(';')[0];
      expect(cookie).toContain('sg_session=');

      // Attempt mutating request with the cookie but with a wrong CSRF token
      const wrongCsrf = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        headers: { cookie, 'x-csrf-token': 'wrong-pre-session-csrf' },
        payload: { username: `anon_${Date.now()}`, password: 'password123', password_confirmation: 'password123' },
      });
      expect(wrongCsrf.statusCode).toBe(403);
    });
  });

  describe('Phase 7 — Caching & Performance Safety (Universal v2 §18)', () => {
    it('caches read-heavy community responses in Redis with short TTL and isolates per user', async () => {
      const redis = connectRedis();
      await redis.del('cache:communities:anon');

      // 1. Initial read populates Redis cache
      const res1 = await app.inject({ method: 'GET', url: '/api/v1/communities' });
      expect(res1.statusCode).toBe(200);

      // Verify cached in Redis
      const cached = await redis.get('cache:communities:anon');
      expect(cached).not.toBeNull();
      const parsed = JSON.parse(cached!);
      expect(Array.isArray(parsed)).toBe(true);

      // 2. User-isolated cache: authenticated user receives distinct cache key
      const session = await authService.createSession('usr_0');
      const userRes = await app.inject({
        method: 'GET',
        url: '/api/v1/communities',
        headers: { cookie: `sg_session=${session.token}` },
      });
      expect(userRes.statusCode).toBe(200);

      const userCached = await redis.get('cache:communities:usr_0');
      expect(userCached).not.toBeNull();
    });

    it('invalidates community cache when membership mutation occurs', async () => {
      const redis = connectRedis();
      const session = await authService.createSession('usr_0');

      // Populate cache
      await app.inject({ method: 'GET', url: '/api/v1/communities' });
      expect(await redis.get('cache:communities:anon')).not.toBeNull();

      // Mutate membership
      const joinRes = await app.inject({
        method: 'POST',
        url: '/api/v1/communities/systems/join',
        headers: { cookie: `sg_session=${session.token}`, 'x-csrf-token': session.csrf },
        payload: {},
      });
      expect(joinRes.statusCode).toBe(200);

      // Communities cache was invalidated
      const after = await redis.get('cache:communities:anon');
      expect(after).toBeNull();
    });

    it('caches post reads and invalidates when post receives vote', async () => {
      const redis = connectRedis();
      const session = await authService.createSession('usr_0');

      // Create a test post
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        headers: { cookie: `sg_session=${session.token}`, 'x-csrf-token': session.csrf },
        payload: { post_type: 'discussion', title: 'Cache Test Post', content: 'Testing post caching' },
      });
      expect(createRes.statusCode).toBe(201);
      const testPostId = createRes.json().id;

      // 1. Initial post read populates cache
      const readRes = await app.inject({ method: 'GET', url: `/api/v1/posts/${testPostId}` });
      expect(readRes.statusCode).toBe(200);

      const cached = await redis.get(`cache:post:${testPostId}:anon`);
      expect(cached).not.toBeNull();

      // 2. Vote mutation invalidates cache
      const voteRes = await app.inject({
        method: 'POST',
        url: `/api/v1/posts/${testPostId}/vote`,
        headers: { cookie: `sg_session=${session.token}`, 'x-csrf-token': session.csrf },
        payload: { direction: 1 },
      });
      expect(voteRes.statusCode).toBe(200);

      const afterVote = await redis.get(`cache:post:${testPostId}:anon`);
      expect(afterVote).toBeNull();
    });
  });

  describe('Phase 8 — Structured Logging & Redaction (Universal v2 §15)', () => {
    it('redacts sensitive credentials (passwords, tokens, cookies, secrets) from structured security logs', async () => {
      const { securityLogger } = await import('../src/utils/security-logger.js');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      securityLogger.logAnomaly({
        ip: '127.0.0.1',
        detail: 'Simulated audit anomaly with sensitive payload',
        metadata: {
          username: 'audit_user',
          password: 'superSecretPassword!',
          token: 'secret-session-token-12345',
          cookie: 'sg_session=secret-cookie-val',
          csrf_token: 'secret-csrf-token',
        },
      });

      expect(warnSpy).toHaveBeenCalled();
      const lastCall = warnSpy.mock.calls[warnSpy.mock.calls.length - 1][0];
      const parsed = JSON.parse(lastCall);

      expect(parsed.event).toBe('security_anomaly');
      expect(parsed.metadata.password).toBe('[REDACTED]');
      expect(parsed.metadata.token).toBe('[REDACTED]');
      expect(parsed.metadata.cookie).toBe('[REDACTED]');
      expect(parsed.metadata.csrf_token).toBe('[REDACTED]');
      expect(parsed.metadata.username).toBe('audit_user');

      warnSpy.mockRestore();
    });
  });

  describe('Phase 9 — Origin Validation, Anonymous Login CSRF & Trusted Proxy (Universal v2 §7, §10)', () => {
    it('rejects cross-origin mutations when Origin header does not match allowed web origins', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        headers: {
          origin: 'https://malicious-attacker.example.com',
        },
        payload: { username: 'alex_dev', password: 'password123' },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().code).toBe('FORBIDDEN');
      expect(res.json().detail).toContain('Cross-origin request rejected');
    });

    it('enforces session-bound CSRF token on login when anonymous session cookie is present', async () => {
      // Register a dedicated user for this test
      const testUser = await authService.register(`anon_csrf_${Date.now()}`, 'password123');

      // 1. Visitor acquires anonymous CSRF session
      const csrfRes = await app.inject({ method: 'GET', url: '/api/v1/auth/csrf' });
      expect(csrfRes.statusCode).toBe(200);
      const cookieHeader = csrfRes.headers['set-cookie'] as string;
      const cookieMatch = cookieHeader.match(/sg_session=([^;]+)/);
      expect(cookieMatch).not.toBeNull();
      const token = cookieMatch![1];

      // 2. Attacker attempts login with victim's cookie but missing/wrong CSRF token
      const attackRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        headers: {
          cookie: `sg_session=${token}`,
          'x-csrf-token': 'wrong-attacker-csrf-token',
        },
        payload: { username: testUser.username, password: 'password123' },
      });
      expect(attackRes.statusCode).toBe(403);
      expect(attackRes.json().code).toBe('FORBIDDEN');

      // 3. Legitimate login with victim's valid CSRF token succeeds
      const validCsrf = csrfRes.json().csrf_token;
      const legitRes = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        headers: {
          cookie: `sg_session=${token}`,
          'x-csrf-token': validCsrf,
        },
        payload: { username: testUser.username, password: 'password123' },
      });
      expect(legitRes.statusCode).toBe(200);
      expect(legitRes.json().user.username).toBe(testUser.username);
    });

    it('ignores client-sent X-Forwarded-For when trustProxy is disabled by default', async () => {
      // When trustProxy is disabled (default), req.ip uses the direct socket remoteAddress, not X-Forwarded-For
      let observedIp = '';
      const testServer = buildApp();
      testServer.get('/__test/proxy-default', async (req) => {
        observedIp = req.ip;
        return { ip: req.ip };
      });
      await testServer.ready();

      const res = await testServer.inject({
        method: 'GET',
        url: '/__test/proxy-default',
        remoteAddress: '127.0.0.1',
        headers: { 'x-forwarded-for': '203.0.113.195' },
      });
      expect(res.statusCode).toBe(200);
      expect(observedIp).toBe('127.0.0.1');

      // When trustProxy is explicitly enabled, req.ip resolves the forwarded client address
      const proxyServer = buildApp({ trustProxy: true });
      let proxyObservedIp = '';
      proxyServer.get('/__test/proxy-enabled', async (req) => {
        proxyObservedIp = req.ip;
        return { ip: req.ip };
      });
      await proxyServer.ready();

      const proxyRes = await proxyServer.inject({
        method: 'GET',
        url: '/__test/proxy-enabled',
        remoteAddress: '127.0.0.1',
        headers: { 'x-forwarded-for': '203.0.113.195' },
      });
      expect(proxyRes.statusCode).toBe(200);
      expect(proxyObservedIp).toBe('203.0.113.195');

      await testServer.close();
      await proxyServer.close();
    });
  });
});
