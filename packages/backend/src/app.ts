import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import errorHandlerPlugin from './plugins/error-handler.js';
import apiRoutes from './routes/index.js';
import { config } from './config/env.js';
import { registerIdentityBoundary } from './routes/identity.js';

export function buildApp(
  opts: FastifyServerOptions = {},
  identityOptions: { devUserBypass?: boolean } = {}
): FastifyInstance {
  const app = Fastify({
    // Reject undeclared keys instead of silently stripping them from requests.
    ajv: { customOptions: { removeAdditional: false } },
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

  registerIdentityBoundary(app, identityOptions);

  // Register API Routes under /api/v1
  app.register(apiRoutes, { prefix: '/api/v1' });

  return app as unknown as FastifyInstance;
}
