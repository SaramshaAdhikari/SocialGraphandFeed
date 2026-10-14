import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { AppError } from '@socialgraph/shared';
import errorHandlerPlugin from './plugins/error-handler.js';
import apiRoutes from './routes/index.js';
import { config } from './config/env.js';

export function buildApp(opts: FastifyServerOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      transport:
        config.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
    ...opts,
  }).withTypeProvider<TypeBoxTypeProvider>();

  // Register Core Fastify Plugins
  app.register(sensible);
  app.register(cors, {
    origin: true,
    credentials: true,
  });

  // Register RFC 7807 Error Handler Plugin
  app.register(errorHandlerPlugin);

  // Security Pre-Handler: Guard X-Dev-User-Id header
  app.addHook('onRequest', async (request, reply) => {
    const devUserId = request.headers['x-dev-user-id'];
    if (devUserId) {
      if (process.env.NODE_ENV === 'production' || config.NODE_ENV === 'production') {
        throw AppError.forbidden('X-Dev-User-Id authentication bypass is strictly disabled in production.');
      }
      // Attach to request context in non-production environments
      (request as any).userId = String(devUserId);
    }
  });

  // Register API Routes under /api/v1
  app.register(apiRoutes, { prefix: '/api/v1' });

  return app as unknown as FastifyInstance;
}
