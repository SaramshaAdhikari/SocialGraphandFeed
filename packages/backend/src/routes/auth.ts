import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { AuthService } from '../services/AuthService.js';
import { clearSessionCookie, getRequestUserId, requireAdmin, requireIdentity, sessionCookie } from './identity.js';
import { AppError } from '@socialgraph/shared';

const attempts = new Map<string, { count: number; since: number }>();
const authRoutes: FastifyPluginAsync = async (app) => {
  const service = new AuthService();
  const loginBody = Type.Object({ username: Type.String({ minLength: 3, maxLength: 30 }), password: Type.String({ minLength: 1, maxLength: 128 }) }, { additionalProperties: false });
  const registerBody = Type.Object({ username: Type.String({ minLength: 3, maxLength: 30 }), password: Type.String({ minLength: 1, maxLength: 128 }), password_confirmation: Type.String({ minLength: 1, maxLength: 128 }) }, { additionalProperties: false });
  app.post('/auth/register', { schema: { body: registerBody } }, async (req, reply) => {
    const body = req.body as { username: string; password: string; password_confirmation: string };
    if (body.password !== body.password_confirmation) throw AppError.badRequest('Passwords do not match.');
    const user = await service.register(body.username, body.password);
    const session = await service.createSession(user.id);
    reply.header('set-cookie', sessionCookie(session.token)); return { user, csrf_token: session.csrf };
  });
  app.post('/auth/login', { schema: { body: loginBody } }, async (req, reply) => {
    const ip = req.ip; const now = Date.now();
    for (const [key, item] of attempts) if (now - item.since >= 15 * 60_000) attempts.delete(key);
    const state = attempts.get(ip);
    if (!state && attempts.size >= 10_000) attempts.delete(attempts.keys().next().value!);
    if (state && now - state.since < 15 * 60_000 && state.count >= 10) throw new AppError({ code: 'RATE_LIMITED', statusCode: 429, title: 'Too Many Requests', detail: 'Try again later.' });
    const body = req.body as { username: string; password: string };
    try {
      const result = await service.login(body.username, body.password);
      attempts.delete(ip); reply.header('set-cookie', sessionCookie(result.session.token)); return { user: result.user, csrf_token: result.session.csrf };
    } catch (error) { attempts.set(ip, { count: (state?.count ?? 0) + 1, since: state?.since ?? now }); throw error; }
  });
  app.get('/auth/session', async (req, reply) => {
    const session = await service.session(req.sessionToken);
    if (!session) { if (req.sessionToken) reply.header('set-cookie', clearSessionCookie()); reply.code(401); return { user: null }; }
    return { user: session.user, csrf_token: session.csrf };
  });
  app.post('/auth/logout', { preHandler: requireIdentity }, async (req, reply) => { await service.logout(req.sessionToken); reply.header('set-cookie', clearSessionCookie()); return { success: true }; });
  app.get('/auth/me', { preHandler: requireIdentity }, async (req) => ({ user_id: getRequestUserId(req), role: req.userRole }));
  app.get('/admin/users', { preHandler: requireAdmin }, async () => {
    const { getDb } = await import('../db/mongo.js');
    const { COLLECTIONS } = await import('../db/collections.js');
    return getDb().collection(COLLECTIONS.USERS).find({}, { projection: { password_hash: 0 } }).limit(500).toArray();
  });
};
export default authRoutes;
