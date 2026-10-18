import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { connectMongo, disconnectMongo, getDb } from '../src/db/mongo.js';
import { requiredTestServiceUrl } from './test-env.js';
import { seedDatabase } from '../src/db/seed.js';
import { ApiErrorResponseSchema, FeedResponseSchema, PostCardSchema, UserProfileSchema } from '@socialgraph/shared';
import { Value } from '@sinclair/typebox/value';
import { COLLECTIONS } from '../src/db/collections.js';

describe('Fastify Domain Route Validation & RFC 7807 Behavior', () => {
  let app: FastifyInstance | undefined;

  beforeAll(async () => {
    await connectMongo(requiredTestServiceUrl('MONGODB_TEST_URI'), 'socialgraph_routes_test');
    await seedDatabase(getDb());
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

  describe('POST /api/v1/posts validation', () => {
    it('rejects malformed post identifiers before database lookup', async () => {
      const response = await app.inject({ method: 'GET', url: '/api/v1/posts/invalid%24operator' });
      expect(response.statusCode).toBe(400);
    });

    it('creates and serializes a post whose optional Mongo fields are null', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        headers: { 'x-dev-user-id': 'usr_0' },
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
      const alex = await app!.inject({ method: 'GET', url: '/api/v1/communities/systems', headers: { 'x-dev-user-id': 'usr_0' } });
      const other = await app!.inject({ method: 'GET', url: '/api/v1/communities/systems', headers: { 'x-dev-user-id': 'usr_3' } });
      expect(alex.json()).toMatchObject({ is_member: true, members_count: systemsBefore });
      expect(other.json()).toMatchObject({ is_member: false, members_count: systemsBefore });
      const searchAsAlex = await app!.inject({ method: 'GET', url: '/api/v1/search?q=systems&category=communities', headers: { 'x-dev-user-id': 'usr_0' } });
      const searchAsOther = await app!.inject({ method: 'GET', url: '/api/v1/search?q=systems&category=communities', headers: { 'x-dev-user-id': 'usr_3' } });
      expect(searchAsAlex.json().communities.find((c: any) => c.slug === 'systems')?.is_member).toBe(true);
      expect(searchAsOther.json().communities.find((c: any) => c.slug === 'systems')?.is_member).toBe(false);

      const unauthorized = await app!.inject({ method: 'POST', url: '/api/v1/communities/systems/join', payload: {} });
      expect(unauthorized.statusCode).toBe(401);
      const forgedBody = await app!.inject({ method: 'POST', url: '/api/v1/communities/systems/join', headers: { 'x-dev-user-id': 'usr_3' }, payload: { user_id: 'usr_0' } });
      expect(forgedBody.statusCode).toBe(400);

      for (let i = 0; i < 2; i += 1) {
        const joined = await app!.inject({ method: 'POST', url: '/api/v1/communities/systems/join', headers: { 'x-dev-user-id': 'usr_3' }, payload: {} });
        expect(joined.statusCode).toBe(200);
        expect(joined.json()).toMatchObject({ is_member: true, members_count: systemsBefore + 1 });
      }
      expect(await getDb().collection(COLLECTIONS.COMMUNITY_MEMBERSHIPS).countDocuments({ user_id: 'usr_3', community_id: 'comm_systems' })).toBe(1);
      expect((await app!.inject({ method: 'GET', url: '/api/v1/communities', headers: { 'x-dev-user-id': 'usr_3' } })).json().find((c: any) => c.slug === 'systems')).toMatchObject({ is_member: true, members_count: systemsBefore + 1 });

      for (let i = 0; i < 2; i += 1) {
        const left = await app!.inject({ method: 'DELETE', url: '/api/v1/communities/systems/join', headers: { 'x-dev-user-id': 'usr_3' } });
        expect(left.statusCode).toBe(200);
        expect(left.json()).toMatchObject({ is_member: false, members_count: systemsBefore });
      }
      const refreshed = await app!.inject({ method: 'GET', url: '/api/v1/communities/systems', headers: { 'x-dev-user-id': 'usr_3' } });
      expect(refreshed.json()).toMatchObject({ is_member: false, members_count: systemsBefore });
      expect((await app!.inject({ method: 'GET', url: '/api/v1/communities/systems', headers: { 'x-dev-user-id': 'usr_0' } })).json().is_member).toBe(true);
    });

    it('does not report success or write membership for an unknown user', async () => {
      const beforeCount = await getDb().collection(COLLECTIONS.COMMUNITY_MEMBERSHIPS).countDocuments({ community_id: 'comm_systems' });
      const response = await app!.inject({ method: 'POST', url: '/api/v1/communities/systems/join', headers: { 'x-dev-user-id': 'missing_user' }, payload: {} });
      expect(response.statusCode).toBe(404);
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
});
