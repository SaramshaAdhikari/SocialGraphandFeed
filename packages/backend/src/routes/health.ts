import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { HealthStatusSchema, ApiErrorResponseSchema } from '@socialgraph/shared';
import { checkMongoHealth } from '../db/mongo.js';
import { checkRedisHealth } from '../cache/redis.js';

const healthRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    '/health',
    {
      schema: {
        description: 'Check platform health and database connectivity',
        tags: ['System'],
        response: {
          200: HealthStatusSchema,
          503: HealthStatusSchema,
        },
      },
    },
    async (request, reply) => {
      const [mongoHealth, redisHealth] = await Promise.all([
        checkMongoHealth(),
        checkRedisHealth(),
      ]);

      const isMongoUp = mongoHealth.status === 'connected';
      const isRedisUp = redisHealth.status === 'connected';

      // MongoDB is required for durability; if Mongo is down, status is error (503)
      // If Mongo is up but Redis is down, system enters degraded fallback mode (200 OK)
      let overallStatus: 'ok' | 'degraded' | 'error' = 'ok';
      if (!isMongoUp) {
        overallStatus = 'error';
      } else if (!isRedisUp) {
        overallStatus = 'degraded';
      }

      const responsePayload = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime_seconds: Math.floor(process.uptime()),
        version: '0.1.0',
        services: {
          mongodb: mongoHealth,
          redis: redisHealth,
        },
      };

      const statusCode = overallStatus === 'error' ? 503 : 200;
      return reply.status(statusCode).send(responsePayload);
    }
  );

  fastify.get(
    '/metrics',
    {
      schema: {
        description: 'Internal platform operational metrics',
        tags: ['System'],
        response: {
          200: Type.Object({
            uptime_seconds: Type.Number(),
            memory: Type.Object({
              rss_mb: Type.Number(),
              heap_used_mb: Type.Number(),
              heap_total_mb: Type.Number(),
            }),
            node_version: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const mem = process.memoryUsage();
      return reply.send({
        uptime_seconds: Math.floor(process.uptime()),
        memory: {
          rss_mb: Number((mem.rss / 1024 / 1024).toFixed(2)),
          heap_used_mb: Number((mem.heapUsed / 1024 / 1024).toFixed(2)),
          heap_total_mb: Number((mem.heapTotal / 1024 / 1024).toFixed(2)),
        },
        node_version: process.version,
      });
    }
  );
};

export default healthRoutes;
