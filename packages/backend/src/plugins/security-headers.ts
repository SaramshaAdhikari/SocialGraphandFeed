import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { config } from '../config/env.js';

const securityHeadersPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Construct CSP connect-src dynamically per environment
  const allowedOrigins: string[] = ["'self'"];
  if (config.NODE_ENV === 'production') {
    if (config.API_ORIGIN) allowedOrigins.push(config.API_ORIGIN);
    if (config.WEB_ORIGIN) allowedOrigins.push(config.WEB_ORIGIN);
  } else {
    if (config.API_ORIGIN) allowedOrigins.push(config.API_ORIGIN);
    if (config.WEB_ORIGIN) allowedOrigins.push(config.WEB_ORIGIN);
    allowedOrigins.push('http://localhost:4000', 'http://127.0.0.1:4000');
  }

  const connectSrc = [...new Set(allowedOrigins.filter(Boolean))].join(' ');

  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  fastify.addHook('onSend', async (request, reply) => {
    // Required security headers per Universal Web App Security v2 Section 13
    reply.header('x-frame-options', 'DENY');
    reply.header('x-content-type-options', 'nosniff');
    reply.header('referrer-policy', 'strict-origin-when-cross-origin');
    reply.header('content-security-policy', cspDirectives);

    // Ensure x-request-id is on all responses
    if (!reply.hasHeader('x-request-id')) {
      reply.header('x-request-id', request.id);
    }
  });
};

export default fp(securityHeadersPlugin);
