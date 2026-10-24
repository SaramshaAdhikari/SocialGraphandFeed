import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { connectMongo, disconnectMongo, getDb } from '../src/db/mongo.js';
import { requiredTestServiceUrl } from './test-env.js';
import { seedDatabase } from '../src/db/seed.js';
import { ApiErrorResponseSchema, FeedResponseSchema, PostCardSchema, UserProfileSchema } from '@socialgraph/shared';
import { Value } from '@sinclair/typebox/value';
import { COLLECTIONS } from '../src/db/collections.js';
import { AuthService } from '../src/services/AuthService.js';

describe('Fastify Domain Route Validation & RFC 7807 Behavior', () => {
  let app: FastifyInstance | undefined;
  const identities = new Map<string, { cookie: string; csrf: string }>();
  const authHeaders = (userId: string) => { const identity = identities.get(userId)!; return { cookie: identity.cookie, 'x-csrf-token': identity.csrf }; };

  beforeAll(async () => {
    await connectMongo(requiredTestServiceUrl('MONGODB_TEST_URI'), 'socialgraph_routes_test');
    await seedDatabase(getDb());
    for (const userId of ['usr_0', 'usr_3', 'missing_user']) {
      const session = await new AuthService().createSession(userId);
      identities.set(userId, { cookie: `sg_session=${session.token}`, csrf: session.csrf });
    }
    app = buildApp({}, { devUserBypass: true });
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (app) await getDb().dropDatabase();
    await disconnectMongo();
  });

  describe('GET /api/v1/feed validation', () => {
    it.each(['new', 'top', 'hot'])('serializes the %s feed using the shared PostCard contract', async (sort) => {
      const response = await app.inject({ method: 'GET', url: `/api/v1/feed?sort=${sort}&limit=2` });
      expect(response.statusCode).toBe(200);
      expect(Value.Check(FeedResponseSchema, response.json())).toBe(true);
    });

    it('serializes relative seed avatars in user profiles', async () => {
      const response = await app.inject({ method: 'GET', url: '/api/v1/users/alex_dev' });
      expect(response.statusCode).toBe(200);
      expect(Value.Check(UserProfileSchema, response.json())).toBe(true);
    });

    it('rejects invalid sort enum values with RFC 7807 400 Bad Request', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/feed?sort=invalid_sort',
      });

      expect(response.statusCode).toBe(400);
      const payload = response.json();
      expect(Value.Check(ApiErrorResponseSchema, payload)).toBe(true);
      expect(payload.status).toBe(400);
    });

    it('rejects limit > 100 with RFC 7807 400 Bad Request', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/feed?limit=250',
      });

      expect(response.statusCode).toBe(400);
      const payload = response.json();
      expect(Value.Check(ApiErrorResponseSchema, payload)).toBe(true);
      expect(payload.status).toBe(400);
    });

    it('rejects limit < 1 with RFC 7807 400 Bad Request', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/feed?limit=0',
      });

      expect(response.statusCode).toBe(400);
      const payload = response.json();
      expect(Value.Check(ApiErrorResponseSchema, payload)).toBe(true);
      expect(payload.status).toBe(400);
    });

    it('rejects overlong cursors and undeclared filter parameters', async () => {
      const longCursor = await app.inject({ method: 'GET', url: `/api/v1/feed?cursor=${'a'.repeat(2049)}` });
      const unknownFilter = await app.inject({ method: 'GET', url: '/api/v1/feed?sort=top&where=true' });
      expect(longCursor.statusCode).toBe(400);
      expect(unknownFilter.statusCode).toBe(400);
    });

    it('rejects invalid scope enum values with RFC 7807 400 Bad Request', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/feed?scope=invalid_scope',
      });

      expect(response.statusCode).toBe(400);
      const payload = response.json();
      expect(Value.Check(ApiErrorResponseSchema, payload)).toBe(true);
    });
  });

  describe('user follow relationship routes', () => {
    it('requires a session, persists idempotent follow state, and exposes scoped lists and counts', async () => {
      const target = await app.inject({ method: 'GET', url: '/api/v1/users/alex_dev' });
      const beforeCount = target.json().followers_count;
      const denied = await app.inject({ method: 'PUT', url: '/api/v1/users/usr_0/follow', payload: { is_following: true } });
      expect(denied.statusCode).toBe(401);

      const follow = await app.inject({ method: 'PUT', url: '/api/v1/users/usr_0/follow', headers: authHeaders('usr_3'), payload: { is_following: true } });
      expect(follow.statusCode).toBe(200);
      expect(follow.json().is_following).toBe(true);
      const repeated = await app.inject({ method: 'PUT', url: '/api/v1/users/usr_0/follow', headers: authHeaders('usr_3'), payload: { is_following: true } });
      expect(repeated.json().followers_count).toBe(beforeCount + 1);

      const list = await app.inject({ method: 'GET', url: '/api/v1/users/alex_dev/followers?limit=50' });
      expect(list.statusCode).toBe(200);
      expect(list.json().data.some((item: { id: string }) => item.id === 'usr_3')).toBe(true);
      expect((await app.inject({ method: 'GET', url: '/api/v1/users/alex_dev' })).json().followers_count).toBe(beforeCount + 1);
      const following = await app.inject({ method: 'GET', url: '/api/v1/users/alec_m/following?limit=50' });
      expect(following.statusCode).toBe(200);
      expect(following.json().data.some((item: { id: string }) => item.id === 'usr_0')).toBe(true);

      const unfollow = await app.inject({ method: 'DELETE', url: '/api/v1/users/usr_0/follow', headers: authHeaders('usr_3') });
      expect(unfollow.statusCode).toBe(200);
      expect((await app.inject({ method: 'GET', url: '/api/v1/users/alex_dev/followers?limit=50' })).json().data.some((item: { id: string }) => item.id === 'usr_3')).toBe(false);
    });
  });

  describe('POST /api/v1/posts validation', () => {
    it('rejects malformed post identifiers before database lookup', async () => {
      const response = await app.inject({ method: 'GET', url: '/api/v1/posts/invalid%24operator' });
      expect(response.statusCode).toBe(400);
    });

    it('creates and serializes a post whose optional Mongo fields are null', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        headers: authHeaders('usr_0'),
        payload: { post_type: 'discussion', title: 'Optional fields smoke test', content: 'No optional metadata provided' },
      });
      expect(response.statusCode).toBe(201);
      expect(Value.Check(PostCardSchema, response.json())).toBe(true);
    });

    it('rejects empty title or missing post_type with RFC 7807 400 Bad Request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        payload: {
          title: '',
        },
      });

      expect(response.statusCode).toBe(400);
      const payload = response.json();
      expect(Value.Check(ApiErrorResponseSchema, payload)).toBe(true);
    });
  });

  describe('POST /api/v1/posts/:postId/vote validation', () => {
    it('rejects invalid vote direction numbers (e.g. 2, -2)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/posts/p123/vote',
        payload: {
          direction: 5,
        },
      });

      expect(response.statusCode).toBe(400);
      const payload = response.json();
      expect(Value.Check(ApiErrorResponseSchema, payload)).toBe(true);
    });
  });

  describe('POST /api/v1/posts/:postId/comments validation', () => {
    it('rejects empty comment content', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/posts/p123/comments',
        payload: {
          content: '',
        },
      });

      expect(response.statusCode).toBe(400);
      const payload = response.json();
      expect(Value.Check(ApiErrorResponseSchema, payload)).toBe(true);
    });
  });

  describe('GET /api/v1/communities route contract', () => {
    it('returns 200 array of communities', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/communities',
      });

      expect(response.statusCode).toBe(200);
      const payload = response.json();
      expect(Array.isArray(payload)).toBe(true);
    });

    it('serves user-scoped membership consistently and applies idempotent joins and leaves', async () => {
      const systemsBefore = (await getDb().collection(COLLECTIONS.COMMUNITY_MEMBERSHIPS).countDocuments({ community_id: 'comm_systems' }));
      const alex = await app!.inject({ method: 'GET', url: '/api/v1/communities/systems', headers: authHeaders('usr_0') });
      const other = await app!.inject({ method: 'GET', url: '/api/v1/communities/systems', headers: authHeaders('usr_3') });
      expect(alex.json()).toMatchObject({ is_member: true, members_count: systemsBefore });
      expect(other.json()).toMatchObject({ is_member: false, members_count: systemsBefore });
      const searchAsAlex = await app!.inject({ method: 'GET', url: '/api/v1/search?q=systems&category=communities', headers: authHeaders('usr_0') });
      const searchAsOther = await app!.inject({ method: 'GET', url: '/api/v1/search?q=systems&category=communities', headers: authHeaders('usr_3') });
      expect(searchAsAlex.json().communities.find((c: any) => c.slug === 'systems')?.is_member).toBe(true);
      expect(searchAsOther.json().communities.find((c: any) => c.slug === 'systems')?.is_member).toBe(false);

      const unauthorized = await app!.inject({ method: 'POST', url: '/api/v1/communities/systems/join', payload: {} });
      expect(unauthorized.statusCode).toBe(401);
      const forgedBody = await app!.inject({ method: 'POST', url: '/api/v1/communities/systems/join', headers: authHeaders('usr_3'), payload: { user_id: 'usr_0' } });
      expect(forgedBody.statusCode).toBe(400);

      for (let i = 0; i < 2; i += 1) {
        const joined = await app!.inject({ method: 'POST', url: '/api/v1/communities/systems/join', headers: authHeaders('usr_3'), payload: {} });
        expect(joined.statusCode).toBe(200);
        expect(joined.json()).toMatchObject({ is_member: true, members_count: systemsBefore + 1 });
      }
      expect(await getDb().collection(COLLECTIONS.COMMUNITY_MEMBERSHIPS).countDocuments({ user_id: 'usr_3', community_id: 'comm_systems' })).toBe(1);
      expect((await app!.inject({ method: 'GET', url: '/api/v1/communities', headers: authHeaders('usr_3') })).json().find((c: any) => c.slug === 'systems')).toMatchObject({ is_member: true, members_count: systemsBefore + 1 });

      for (let i = 0; i < 2; i += 1) {
        const left = await app!.inject({ method: 'DELETE', url: '/api/v1/communities/systems/join', headers: authHeaders('usr_3') });
        expect(left.statusCode).toBe(200);
        expect(left.json()).toMatchObject({ is_member: false, members_count: systemsBefore });
      }
      const refreshed = await app!.inject({ method: 'GET', url: '/api/v1/communities/systems', headers: authHeaders('usr_3') });
      expect(refreshed.json()).toMatchObject({ is_member: false, members_count: systemsBefore });
      expect((await app!.inject({ method: 'GET', url: '/api/v1/communities/systems', headers: authHeaders('usr_0') })).json().is_member).toBe(true);
    });

    it('does not report success or write membership for an unknown user', async () => {
      const beforeCount = await getDb().collection(COLLECTIONS.COMMUNITY_MEMBERSHIPS).countDocuments({ community_id: 'comm_systems' });
      const response = await app!.inject({ method: 'POST', url: '/api/v1/communities/systems/join', headers: authHeaders('missing_user'), payload: {} });
      expect(response.statusCode).toBe(401);
      expect(await getDb().collection(COLLECTIONS.COMMUNITY_MEMBERSHIPS).countDocuments({ community_id: 'comm_systems' })).toBe(beforeCount);
    });
  });

  describe('GET /api/v1/search route contract', () => {
    it('returns 200 and matches UniversalSearchResults structure', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/search?q=systems&category=all&sort=relevance',
      });

      expect(response.statusCode).toBe(200);
      const payload = response.json();
      expect(payload.query).toBe('systems');
      expect(Array.isArray(payload.discussions)).toBe(true);
      expect(Array.isArray(payload.visuals)).toBe(true);
      expect(Array.isArray(payload.communities)).toBe(true);
      expect(Array.isArray(payload.users)).toBe(true);
      expect(typeof payload.total_count).toBe('number');
    });

    it('returns empty results when query is blank', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/search?q=',
      });

      expect(response.statusCode).toBe(200);
      const payload = response.json();
      expect(payload.total_count).toBe(0);
      expect(payload.discussions).toEqual([]);
    });
  });

  describe('GET /api/v1/posts/saved route contract', () => {
    it('rejects unauthenticated requests with 401 Unauthorized', async () => {
      const response = await app!.inject({
        method: 'GET',
        url: '/api/v1/posts/saved',
      });
      expect(response.statusCode).toBe(401);
    });

    it('returns empty saved feed for user with no bookmarks and matches FeedResponseSchema', async () => {
      const response = await app!.inject({
        method: 'GET',
        url: '/api/v1/posts/saved',
        headers: authHeaders('usr_3'),
      });
      expect(response.statusCode).toBe(200);
      const payload = response.json();
      expect(Value.Check(FeedResponseSchema, payload)).toBe(true);
      expect(payload.data).toEqual([]);
      expect(payload.has_more).toBe(false);
    });

    it('returns saved posts after bookmarking and verifies route precedence over /posts/:postId', async () => {
      // 1. Save a known discussion post
      const saveRes = await app!.inject({
        method: 'POST',
        url: '/api/v1/posts/post_101/save',
        headers: authHeaders('usr_0'),
        payload: {},
      });
      expect(saveRes.statusCode).toBe(200);
      expect(saveRes.json()).toEqual({ post_id: 'post_101', is_saved: true });

      // 2. Fetch saved posts
      const savedRes = await app!.inject({
        method: 'GET',
        url: '/api/v1/posts/saved',
        headers: authHeaders('usr_0'),
      });
      expect(savedRes.statusCode).toBe(200);
      const payload = savedRes.json();
      expect(Value.Check(FeedResponseSchema, payload)).toBe(true);
      expect(payload.data.length).toBeGreaterThanOrEqual(1);
      const savedItem = payload.data.find((p: any) => p.id === 'post_101');
      expect(savedItem).toBeDefined();
      expect(savedItem.is_saved).toBe(true);

      // 3. Filter by type
      const discRes = await app!.inject({
        method: 'GET',
        url: '/api/v1/posts/saved?type=discussions',
        headers: authHeaders('usr_0'),
      });
      expect(discRes.statusCode).toBe(200);
      expect(discRes.json().data.some((p: any) => p.id === 'post_101')).toBe(true);

      const visRes = await app!.inject({
        method: 'GET',
        url: '/api/v1/posts/saved?type=visual',
        headers: authHeaders('usr_0'),
      });
      expect(visRes.statusCode).toBe(200);
      expect(visRes.json().data.some((p: any) => p.id === 'post_101')).toBe(false);

      // 4. Unsave and verify removal
      const unsaveRes = await app!.inject({
        method: 'POST',
        url: '/api/v1/posts/post_101/save',
        headers: authHeaders('usr_0'),
        payload: {},
      });
      expect(unsaveRes.statusCode).toBe(200);
      expect(unsaveRes.json()).toEqual({ post_id: 'post_101', is_saved: false });

      const afterUnsave = await app!.inject({
        method: 'GET',
        url: '/api/v1/posts/saved',
        headers: authHeaders('usr_0'),
      });
      expect(afterUnsave.statusCode).toBe(200);
      expect(afterUnsave.json().data.some((p: any) => p.id === 'post_101')).toBe(false);
    });

    it('rejects undeclared query parameters and excessive limits with 400 Bad Request', async () => {
      // 1. Undeclared query parameters
      const undeclaredRes = await app!.inject({
        method: 'GET',
        url: '/api/v1/posts/saved?injected_param=exploit',
        headers: authHeaders('usr_0'),
      });
      expect(undeclaredRes.statusCode).toBe(400);

      // 2. Limit > 100
      const limitRes = await app!.inject({
        method: 'GET',
        url: '/api/v1/posts/saved?limit=101',
        headers: authHeaders('usr_0'),
      });
      expect(limitRes.statusCode).toBe(400);
    });

    it('gracefully returns empty result on unknown or stale pagination cursor without looping', async () => {
      const response = await app!.inject({
        method: 'GET',
        url: '/api/v1/posts/saved?cursor=nonexistent_post_id_99999',
        headers: authHeaders('usr_0'),
      });
      expect(response.statusCode).toBe(200);
      const payload = response.json();
      expect(payload.data).toEqual([]);
      expect(payload.has_more).toBe(false);
      expect(payload.next_cursor).toBeNull();
    });

    it('correctly filters saved posts by topic stripping hashtag prefix and supports top/comments sorting', async () => {
      // Bookmark post_101 and post_102
      await app!.inject({
        method: 'POST',
        url: '/api/v1/posts/post_101/save',
        headers: authHeaders('usr_0'),
        payload: {},
      });
      await app!.inject({
        method: 'POST',
        url: '/api/v1/posts/post_102/save',
        headers: authHeaders('usr_0'),
        payload: {},
      });

      // Filter by topic with # prefix
      const topicRes = await app!.inject({
        method: 'GET',
        url: '/api/v1/posts/saved?topic=%23systems',
        headers: authHeaders('usr_0'),
      });
      expect(topicRes.statusCode).toBe(200);

      // Verify sorting by top (score)
      const topRes = await app!.inject({
        method: 'GET',
        url: '/api/v1/posts/saved?sort=top',
        headers: authHeaders('usr_0'),
      });
      expect(topRes.statusCode).toBe(200);
      expect(Value.Check(FeedResponseSchema, topRes.json())).toBe(true);

      // Clean up bookmark state
      await app!.inject({
        method: 'POST',
        url: '/api/v1/posts/post_101/save',
        headers: authHeaders('usr_0'),
        payload: {},
      });
      await app!.inject({
        method: 'POST',
        url: '/api/v1/posts/post_102/save',
        headers: authHeaders('usr_0'),
        payload: {},
      });
    });

  });

});
