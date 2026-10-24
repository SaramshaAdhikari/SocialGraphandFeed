import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { randomUUID } from 'node:crypto';
import errorHandlerPlugin from './plugins/error-handler.js';
import securityHeadersPlugin from './plugins/security-headers.js';
import apiRoutes from './routes/index.js';
import { config } from './config/env.js';
import { registerIdentityBoundary } from './routes/identity.js';

export function buildApp(
  opts: FastifyServerOptions = {},
  _identityOptions: { devUserBypass?: boolean } = {}
): FastifyInstance {
  const app = Fastify({
    // Reject undeclared keys instead of silently stripping them from requests.
    ajv: { customOptions: { removeAdditional: false } },
    bodyLimit: 1_048_576, // 1MB JSON body limit per security contract
    requestIdHeader: 'x-request-id',
    trustProxy: opts.trustProxy ?? config.TRUST_PROXY,
    genReqId: (req) => {
      const header = req.headers['x-request-id'];
      if (typeof header === 'string' && header.trim().length > 0) {
        return header.trim();
      }
      return randomUUID();
    },
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
    origin: config.WEB_ORIGIN,
    credentials: true,
  });

  // Register Security Headers & CSP Plugin
  app.register(securityHeadersPlugin);

  // Register RFC 7807 Error Handler Plugin
  app.register(errorHandlerPlugin);

  registerIdentityBoundary(app);

  // Register API Routes under /api/v1
  app.register(apiRoutes, { prefix: '/api/v1' });

  return app as unknown as FastifyInstance;
}
