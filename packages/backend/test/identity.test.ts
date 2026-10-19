import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { requireAdmin, requireIdentity } from '../src/routes/identity.js';
import { parseEnv } from '../src/config/env.js';
import { hashPassword, resolveLoginUsername, verifyPassword } from '../src/services/AuthService.js';
import { assertDevelopmentBootstrapAllowed } from '../src/db/bootstrap-admin.js';

describe('authentication security boundaries', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  afterEach(() => { if (previousNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousNodeEnv; });

  it('requires database/cache and a strong session secret in production and rejects bypass', () => {
    expect(() => parseEnv({ NODE_ENV: 'production' })).toThrow(/SESSION_SECRET/);
    const required = { NODE_ENV: 'production', SESSION_SECRET: 'unique-production-secret-0123456789', WEB_ORIGIN: 'https://socialgraph.example', MONGODB_URI: 'mongodb://db.example:27017/socialgraph', MONGODB_DB_NAME: 'socialgraph', REDIS_URL: 'rediss://cache.example:6380' };
    expect(() => parseEnv({ NODE_ENV: 'production', SESSION_SECRET: required.SESSION_SECRET })).toThrow(/MONGODB_URI is required/);
    expect(parseEnv({ ...required, NODE_ENV: 'development', ENVIRONMENT: 'production' }).NODE_ENV).toBe('production');
    expect(parseEnv(required).DEV_USER_BYPASS).toBe(false);
    expect(() => parseEnv({ ...required, DEV_USER_BYPASS: 'true' })).toThrow(/cannot be enabled/);
    expect(() => parseEnv({ ...required, MONGODB_URI: 'not-a-database-url' })).toThrow(/valid MongoDB and Redis URLs/);
    expect(() => parseEnv({ ...required, SESSION_SECRET: 'development-secret-that-is-long-enough' })).toThrow(/SESSION_SECRET/);
    expect(() => parseEnv({ ...required, DEV_ADMIN_BOOTSTRAP: 'true' })).toThrow(/Development administrator/);
    expect(() => parseEnv({ ...required, DEV_ADMIN_PASSWORD: 'admin' })).toThrow(/Development administrator/);
  });

  it('hashes passwords and verifies only matching credentials', async () => {
    const encoded = await hashPassword('a secure password');
    expect(encoded).toMatch(/^\$2[aby]\$12\$/);
    expect(encoded).not.toContain('a secure password');
    expect(await verifyPassword('a secure password', encoded)).toBe(true);
    expect(await verifyPassword('wrong password', encoded)).toBe(false);
    expect(await verifyPassword('anything')).toBe(false);
  });

  it('maps the admin development login to alex_dev only in development', () => {
    expect(resolveLoginUsername(' ADMIN ', 'development')).toBe('alex_dev');
    expect(resolveLoginUsername('admin', 'production')).toBe('__development_admin_login_disabled__');
    expect(resolveLoginUsername('ALEx_Dev', 'development')).toBe('alex_dev');
  });

  it('ignores forged development identity headers and protects mutations', async () => {
    process.env.NODE_ENV = 'test';
    const app = buildApp({}, { devUserBypass: true });
    app.get('/__test/identity', async (request) => ({ userId: request.userId ?? null }));
    app.post('/__test/protected', { preHandler: requireIdentity }, async () => ({ ok: true }));
    await app.ready();
    const forged = await app.inject({ method: 'GET', url: '/__test/identity', headers: { 'x-dev-user-id': 'usr_0', 'x-user-id': 'usr_0' } });
    const mutation = await app.inject({ method: 'POST', url: '/__test/protected', headers: { 'x-dev-user-id': 'usr_0' } });
    expect(forged.json()).toEqual({ userId: null });
    expect(mutation.statusCode).toBe(401);
    await app.close();
  });

  it('rejects protected mutations without a session across domain routes', async () => {
    process.env.NODE_ENV = 'test';
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

  it('rejects malformed legacy identity headers instead of accepting them as credentials', async () => {
    process.env.NODE_ENV = 'test';
    const app = buildApp({}, { devUserBypass: true });
    await app.ready();
    const response = await app.inject({ method: 'POST', url: '/api/v1/posts/p1/vote', headers: { 'x-dev-user-id': '   ' }, payload: { direction: 1 } });
    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe('UNAUTHORIZED');
    await app.close();
  });

  it('keeps empty mutation body validation active without relying on the removed identity bypass', async () => {
    const app = buildApp();
    await app.ready();
    const response = await app.inject({ method: 'POST', url: '/api/v1/posts/p1/save', headers: { 'x-dev-user-id': 'usr_0' }, payload: { $where: 'true' } });
    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it('does not authenticate forged identity headers in production mode', async () => {
    process.env.NODE_ENV = 'production';
    const app = buildApp({}, { devUserBypass: true });
    app.get('/__test/identity', async (request) => ({ userId: request.userId ?? null }));
    await app.ready();
    const response = await app.inject({ method: 'GET', url: '/__test/identity', headers: { 'x-dev-user-id': 'usr_attacker', 'x-user-id': 'usr_attacker' } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ userId: null });
    await app.close();
  });

  it('requires authenticated admin role and does not trust client role headers', async () => {
    const app = buildApp();
    app.get('/__test/admin', { preHandler: requireAdmin }, async () => ({ ok: true }));
    await app.ready();
    const response = await app.inject({ method: 'GET', url: '/__test/admin', headers: { 'x-user-role': 'admin', 'x-user-id': 'usr_0' } });
    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it('allows admin bootstrap only with explicit development settings', () => {
    expect(() => assertDevelopmentBootstrapAllowed({ NODE_ENV: 'production', DEV_ADMIN_BOOTSTRAP: 'true' })).toThrow(/development-only/);
    expect(() => assertDevelopmentBootstrapAllowed({ NODE_ENV: 'development' })).toThrow(/explicitly/);
    expect(() => assertDevelopmentBootstrapAllowed({ NODE_ENV: 'development', DEV_ADMIN_BOOTSTRAP: 'true' })).not.toThrow();
    expect(() => assertDevelopmentBootstrapAllowed({ NODE_ENV: 'development', ENVIRONMENT: 'production', DEV_ADMIN_BOOTSTRAP: 'true' })).toThrow(/development-only/);
  });
});
