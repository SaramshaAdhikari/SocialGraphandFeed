import type { FastifyError, FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '@socialgraph/shared';
import { config } from '../config/env.js';

const errorHandlerPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    reply.header('x-request-id', request.id);

    // 1. Handle custom AppError instances
    if (error instanceof AppError) {
      if (error.retryAfter) {
        reply.header('retry-after', String(error.retryAfter));
      }
      const rfc7807 = error.toRfc7807(request.url, request.id);
      return reply.status(error.statusCode).send(rfc7807);
    }

    // 2. Handle Fastify TypeBox schema validation errors
    if (error.validation) {
      const invalidParams = error.validation.map((v) => ({
        name: v.instancePath ? v.instancePath.replace(/^\//, '') : (v.params as any)?.missingProperty || 'parameter',
        reason: v.message || 'Invalid value',
      }));

      const appErr = AppError.badRequest('Request payload failed schema validation.', invalidParams);
      const rfc7807 = appErr.toRfc7807(request.url, request.id);
      return reply.status(400).send(rfc7807);
    }

    // 3. Handle standard Fastify HTTP errors
    const statusCode = error.statusCode || 500;
    if (statusCode < 500) {
      const appErr = new AppError({
        code: statusCode === 404 ? 'NOT_FOUND' : 'BAD_REQUEST',
        statusCode,
        title: error.name || 'Client Error',
        detail: error.message || 'Client request error',
      });
      return reply.status(statusCode).send(appErr.toRfc7807(request.url, request.id));
    }

    // 4. Handle unexpected 500 server errors
    request.log.error(error, 'Unhandled internal server error');
    const internalErr = new AppError({
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: 500,
      title: 'Internal Server Error',
      detail: config.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : error.message,
    });

    return reply.status(500).send(internalErr.toRfc7807(request.url, request.id));
  });

  // Handle 404 Route Not Found
  fastify.setNotFoundHandler((request, reply) => {
    reply.header('x-request-id', request.id);
    const notFoundErr = AppError.notFound(`Route '${request.method} ${request.url}'`);
    return reply.status(404).send(notFoundErr.toRfc7807(request.url, request.id));
  });
};

export default fp(errorHandlerPlugin);
