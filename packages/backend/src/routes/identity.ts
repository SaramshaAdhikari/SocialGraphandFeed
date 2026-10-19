import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '@socialgraph/shared';
import { AuthService } from '../services/AuthService.js';
import { config } from '../config/env.js';

declare module 'fastify' { interface FastifyRequest { userId?: string; userRole?: string; csrfToken?: string; sessionToken?: string; } }
export function registerIdentityBoundary(app: FastifyInstance): void {
  const authService = new AuthService();
  app.addHook('onRequest', async (request) => {
    const cookie = request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('sg_session='));
    const token = cookie?.slice('sg_session='.length);
    if (!token) return;
    request.sessionToken = token;
    const session = await authService.session(token);
    if (session) {
      if (session.user) {
        request.userId = session.user.id;
        request.userRole = session.user.role;
      }
      request.csrfToken = session.csrf;
    }
  });
  app.addHook('preHandler', async (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      // 1. Cross-Origin validation defense
      const origin = request.headers.origin;
      if (origin && typeof origin === 'string') {
        const allowed = [config.WEB_ORIGIN];
        if (config.NODE_ENV !== 'production') {
          allowed.push('http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:4000', 'http://127.0.0.1:4000');
        }
        if (!allowed.includes(origin)) {
          throw AppError.forbidden('Cross-origin request rejected.');
        }
      }

      // 2. Session-bound CSRF token validation
      const headerCsrf = request.headers['x-csrf-token'];
      if (request.userId) {
        if (!headerCsrf || typeof headerCsrf !== 'string' || headerCsrf !== request.csrfToken) {
          throw AppError.forbidden('CSRF token missing or invalid.');
        }
      } else if (request.csrfToken) {
        if (!headerCsrf || typeof headerCsrf !== 'string' || headerCsrf !== request.csrfToken) {
          throw AppError.forbidden('CSRF token missing or invalid.');
        }
      }
    }
  });
}
export function getRequestUserId(request: FastifyRequest): string | undefined { return request.userId; }
export async function requireIdentity(request: FastifyRequest, _reply: FastifyReply): Promise<void> { if (!request.userId) throw AppError.unauthorized(); }
export async function requireAdmin(request: FastifyRequest): Promise<void> { if (!request.userId) throw AppError.unauthorized(); if (request.userRole !== 'admin') throw AppError.forbidden(); }
const secureCookie = config.NODE_ENV === 'production' || config.WEB_ORIGIN.startsWith('https://');
export function sessionCookie(token: string): string { return `sg_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secureCookie ? '; Secure' : ''}`; }
export function clearSessionCookie(): string { return `sg_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureCookie ? '; Secure' : ''}`; }
