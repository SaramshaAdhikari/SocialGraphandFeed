import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '@socialgraph/shared';
import { config } from '../config/env.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

export interface IdentityBoundaryOptions {
  devUserBypass?: boolean;
}

/**
 * Request identity boundary. Replace this development-only resolver with
 * verified authentication middleware when accounts are introduced. The
 * internal user ID remains the only identity passed into domain services.
 */
export function registerIdentityBoundary(
  fastify: FastifyInstance,
  options: IdentityBoundaryOptions = {}
): void {
  fastify.addHook('onRequest', async (request) => {
    const devUserId = request.headers['x-dev-user-id'];
    if (devUserId === undefined) return;

    const isProduction =
      process.env.NODE_ENV?.toLowerCase() === 'production' ||
      process.env.ENVIRONMENT?.toLowerCase() === 'production' ||
      config.NODE_ENV === 'production';
    if (isProduction) {
      throw AppError.forbidden('X-Dev-User-Id authentication bypass is strictly disabled in production.');
    }

    const bypassEnabled = options.devUserBypass ?? config.DEV_USER_BYPASS;
    if (!bypassEnabled) {
      throw AppError.forbidden('X-Dev-User-Id is disabled unless DEV_USER_BYPASS is explicitly enabled.');
    }
    if (typeof devUserId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(devUserId)) {
      throw AppError.badRequest('X-Dev-User-Id must be a valid user identifier.');
    }

    request.userId = devUserId;
  });
}

export function getRequestUserId(request: FastifyRequest): string | undefined {
  return request.userId;
}

export async function requireIdentity(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const userId = getRequestUserId(request);
  if (typeof userId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(userId)) {
    throw AppError.unauthorized();
  }
}

