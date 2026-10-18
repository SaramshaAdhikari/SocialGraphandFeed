import type { FastifyPluginAsync } from 'fastify';
import {
  FeedQuerySchema,
  FeedResponseSchema,
  DiscoveryQuerySchema,
  DiscoveryResponseSchema,
  type FeedQuery,
  type DiscoveryQuery,
} from '@socialgraph/shared';
import { FeedService } from '../services/FeedService.js';
import { getRequestUserId } from './identity.js';

const feedRoutes: FastifyPluginAsync = async (fastify) => {
  const feedService = new FeedService();

  fastify.get<{ Querystring: FeedQuery }>(
    '/feed',
    {
      schema: {
        querystring: FeedQuerySchema,
        response: {
          200: FeedResponseSchema,
        },
      },
    },
    async (request) => {
      const userId = getRequestUserId(request);
      return feedService.getFeed(request.query, userId);
    }
  );

  fastify.get<{ Querystring: DiscoveryQuery }>(
    '/discovery',
    {
      schema: {
        querystring: DiscoveryQuerySchema,
        response: {
          200: DiscoveryResponseSchema,
        },
      },
    },
    async (request) => {
      const userId = getRequestUserId(request);
      return feedService.getDiscovery(request.query, userId);
    }
  );
};

export default feedRoutes;
