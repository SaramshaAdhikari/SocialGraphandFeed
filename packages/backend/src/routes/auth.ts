import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { AuthService } from '../services/AuthService.js';
import { clearSessionCookie, getRequestUserId, requireAdmin, requireIdentity, sessionCookie } from './identity.js';
import { AppError } from '@socialgraph/shared';
import { RateLimitService } from '../services/RateLimitService.js';
import { securityLogger } from '../utils/security-logger.js';
import { getRedisClient } from '../cache/redis.js';

const authRoutes: FastifyPluginAsync = async (app) => {
  const service = new AuthService();
  const rateLimitService = new RateLimitService();

  const loginBody = Type.Object({ username: Type.String({ minLength: 3, maxLength: 30 }), password: Type.String({ minLength: 1, maxLength: 128 }) }, { additionalProperties: false });
  const registerBody = Type.Object({ username: Type.String({ minLength: 3, maxLength: 30 }), password: Type.String({ minLength: 1, maxLength: 128 }), password_confirmation: Type.String({ minLength: 1, maxLength: 128 }) }, { additionalProperties: false });

  app.get('/auth/csrf', async (req, reply) => {
    if (req.csrfToken) {
      return { csrf_token: req.csrfToken };
    }
    const anon = await service.createAnonymousSession();
    reply.header('set-cookie', sessionCookie(anon.token));
    return { csrf_token: anon.csrf };
  });

  app.post('/auth/register', { schema: { body: registerBody } }, async (req, reply) => {
    // Signup rate limiting: 3 per minute per IP per security contract Section 10
    await rateLimitService.checkOrThrow({
      action: 'register',
      ip: req.ip,
      limit: 3,
      windowSeconds: 60,
      requestId: req.id,
    });

    const body = req.body as { username: string; password: string; password_confirmation: string };
    if (body.password !== body.password_confirmation) throw AppError.badRequest('Passwords do not match.');

    const user = await service.register(body.username, body.password, req.sessionToken);
    const session = await service.createSession(user.id);
    reply.header('set-cookie', sessionCookie(session.token));
    return { user, csrf_token: session.csrf };
  });

  app.post('/auth/login', { schema: { body: loginBody } }, async (req, reply) => {
    const body = req.body as { username: string; password: string };
    const normalizedUsername = body.username ? body.username.trim().toLowerCase() : undefined;

    // Strict contract enforcement: 5 login attempts per minute per IP AND per username
    await rateLimitService.checkOrThrow({
      action: 'login',
      ip: req.ip,
      userId: normalizedUsername,
      limit: 5,
      windowSeconds: 60,
      requestId: req.id,
    });

    try {
      const result = await service.login(body.username, body.password, req.sessionToken);
      // Reset failed attempts upon successful authentication
      const redis = getRedisClient();
      if (redis) {
        const keysToDelete = [`rl:login:ip:${req.ip}`];
        if (normalizedUsername) keysToDelete.push(`rl:login:user:${normalizedUsername}`);
        await redis.del(...keysToDelete).catch(() => {});
      }
      reply.header('set-cookie', sessionCookie(result.session.token));
      return { user: result.user, csrf_token: result.session.csrf };
    } catch (error) {
      securityLogger.authFailed({
        ip: req.ip,
        actor: body.username,
        requestId: req.id,
        reason: error instanceof Error ? error.message : 'Invalid credentials',
      });
      throw error;
    }
  });

  app.get('/auth/session', async (req, reply) => {
    const session = await service.session(req.sessionToken);
    if (!session || !session.user) {
      if (req.sessionToken) reply.header('set-cookie', clearSessionCookie());
      reply.code(401);
      return { user: null };
    }
    return { user: session.user, csrf_token: session.csrf };
  });

  app.post('/auth/logout', { preHandler: requireIdentity }, async (req, reply) => {
    await service.logout(req.sessionToken);
    reply.header('set-cookie', clearSessionCookie());
    return { success: true };
  });

  app.get('/auth/me', { preHandler: requireIdentity }, async (req) => ({
    user_id: getRequestUserId(req),
    role: req.userRole,
  }));

  app.get('/admin/users', { preHandler: requireAdmin }, async () => {
    const { getDb } = await import('../db/mongo.js');
    const { COLLECTIONS } = await import('../db/collections.js');
    return getDb().collection(COLLECTIONS.USERS).find({}, { projection: { password_hash: 0 } }).limit(500).toArray();
  });
};

export default authRoutes;
