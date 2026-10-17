import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  CommunitySchema,
  FeedQuerySchema,
  FeedResponseSchema,
  type FeedQuery,
} from '@socialgraph/shared';
import { CommunityService } from '../services/CommunityService.js';

const communitiesRoutes: FastifyPluginAsync = async (fastify) => {
  const communityService = new CommunityService();

  fastify.get<{ Params: { communitySlug: string } }>(
    '/communities/:communitySlug',
    {
      schema: {
        params: Type.Object({
          communitySlug: Type.String(),
        }),
        response: {
          200: CommunitySchema,
        },
      },
    },
    async (request) => {
      const currentUserId = (request as any).userId;
      return communityService.getCommunity(request.params.communitySlug, currentUserId);
    }
  );

  fastify.get<{ Params: { communitySlug: string }; Querystring: FeedQuery }>(
    '/communities/:communitySlug/feed',
    {
      schema: {
        params: Type.Object({
          communitySlug: Type.String(),
        }),
        querystring: FeedQuerySchema,
        response: {
          200: FeedResponseSchema,
        },
      },
    },
    async (request) => {
      const currentUserId = (request as any).userId;
      return communityService.getCommunityFeed(
        request.params.communitySlug,
        request.query,
        currentUserId
      );
    }
  );

  fastify.post<{ Params: { communitySlug: string } }>(
    '/communities/:communitySlug/join',
    {
      schema: {
        params: Type.Object({
          communitySlug: Type.String(),
        }),
        response: {
          200: Type.Object({
            community_id: Type.String(),
            is_member: Type.Boolean(),
            members_count: Type.Integer(),
          }),
        },
      },
    },
    async (request) => {
      const currentUserId = (request as any).userId || 'usr_0';
      return communityService.toggleMembership(
        request.params.communitySlug,
        currentUserId
      );
    }
  );
};

export default communitiesRoutes;
