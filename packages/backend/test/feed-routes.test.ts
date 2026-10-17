import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { ApiErrorResponseSchema } from '@socialgraph/shared';
import { Value } from '@sinclair/typebox/value';

describe('Fastify Domain Route Validation & RFC 7807 Behavior', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/feed validation', () => {
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
});
