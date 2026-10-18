import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { requireIdentity } from '../src/routes/identity.js';
import { parseEnv } from '../src/config/env.js';

describe('request identity boundary', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousEnvironment = process.env.ENVIRONMENT;

  afterEach(() => {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousEnvironment === undefined) delete process.env.ENVIRONMENT;
    else process.env.ENVIRONMENT = previousEnvironment;
  });

  it('requires explicit production database and cache configuration and refuses dev bypass', () => {
    expect(() => parseEnv({ NODE_ENV: 'production' })).toThrow(/MONGODB_URI is required/);
    const required = {
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://db.example:27017/socialgraph',
      MONGODB_DB_NAME: 'socialgraph',
      REDIS_URL: 'rediss://cache.example:6380',
    };
    expect(parseEnv(required).DEV_USER_BYPASS).toBe(false);
    expect(parseEnv({ ...required, NODE_ENV: 'development', ENVIRONMENT: 'production' }).NODE_ENV).toBe('production');
    expect(() => parseEnv({ ...required, DEV_USER_BYPASS: 'true' })).toThrow(/cannot be enabled/);
    expect(() => parseEnv({ ...required, MONGODB_URI: 'not-a-database-url' })).toThrow(/valid MongoDB and Redis URLs/);
  });

  it('rejects protected mutations without identity before the service can run', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.ENVIRONMENT;
    const app = buildApp();
    await app.ready();
    const mutations: Array<{ url: string; payload?: unknown }> = [
      { url: '/api/v1/posts', payload: { post_type: 'discussion', title: 'Valid title', content: 'Valid body' } },
      { url: '/api/v1/posts/p1/vote', payload: { direction: 1 } },
      { url: '/api/v1/posts/p1/save', payload: {} },
      { url: '/api/v1/users/usr_1/follow', payload: {} },
      { url: '/api/v1/communities/systems/join', payload: {} },
      { url: '/api/v1/posts/p1/comments', payload: { content: 'Valid comment' } },
    ];
    for (const mutation of mutations) {
      const response = await app.inject({ method: 'POST', ...mutation });
      expect(response.statusCode, mutation.url).toBe(401);
      expect(response.json().code, mutation.url).toBe('UNAUTHORIZED');
    }
    await app.close();
  });

  it('rejects malformed development identity values', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.ENVIRONMENT;
    const app = buildApp({}, { devUserBypass: true });
    await app.ready();
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/posts/p1/vote',
      headers: { 'x-dev-user-id': '   ' },
      payload: { direction: 1 },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe('BAD_REQUEST');
    await app.close();
  });

  it('accepts the dev identity header only when explicitly enabled outside production', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.ENVIRONMENT;
    const app = buildApp({}, { devUserBypass: true });
    app.get('/__test/identity', async (request) => ({ userId: (request as any).userId ?? null }));
    await app.ready();
    const response = await app.inject({
      method: 'GET',
      url: '/__test/identity',
      headers: { 'x-dev-user-id': 'usr_test' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ userId: 'usr_test' });
    await app.close();
  });

  it('continues a protected route when a valid identity is present', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.ENVIRONMENT;
    const app = buildApp({}, { devUserBypass: true });
    app.post('/__test/protected', { preHandler: requireIdentity }, async (request) => ({ userId: (request as any).userId }));
    await app.ready();
    const response = await app.inject({ method: 'POST', url: '/__test/protected', headers: { 'x-dev-user-id': 'usr_test' } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ userId: 'usr_test' });
    await app.close();
  });

  it('rejects unexpected fields on empty mutation bodies', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.ENVIRONMENT;
    const app = buildApp({}, { devUserBypass: true });
    await app.ready();
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/posts/p1/save',
      headers: { 'x-dev-user-id': 'usr_test' },
      payload: { $where: 'true' },
    });
    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it('rejects the dev identity header in production and keeps public routes public', async () => {
    process.env.NODE_ENV = 'production';
    const app = buildApp({}, { devUserBypass: true });
    await app.ready();
    const rejected = await app.inject({
      method: 'GET',
      url: '/api/v1/metrics',
      headers: { 'x-dev-user-id': 'usr_attacker' },
    });
    const forgedMembership = await app.inject({
      method: 'POST',
      url: '/api/v1/communities/systems/join',
      headers: { 'x-dev-user-id': 'usr_attacker' },
      payload: {},
    });
    const publicResponse = await app.inject({ method: 'GET', url: '/api/v1/metrics' });
    expect(rejected.statusCode).toBe(403);
    expect(rejected.json().code).toBe('FORBIDDEN');
    expect(forgedMembership.statusCode).toBe(403);
    expect(forgedMembership.json().code).toBe('FORBIDDEN');
    expect(publicResponse.statusCode).toBe(200);
    await app.close();
  });
});
