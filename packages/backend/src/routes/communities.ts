import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  CommunitySchema,
  FeedQuerySchema,
  FeedResponseSchema,
  type FeedQuery,
} from '@socialgraph/shared';
import { CommunityService } from '../services/CommunityService.js';
import { getRequestUserId, requireIdentity } from './identity.js';

const communitySlugSchema = Type.String({ minLength: 1, maxLength: 80, pattern: '^[A-Za-z0-9_-]+$' });

const communitiesRoutes: FastifyPluginAsync = async (fastify) => {
  const communityService = new CommunityService();

  fastify.get(
    '/communities',
    {
      schema: {
        response: {
          200: Type.Array(CommunitySchema),
        },
      },
    },
    async (request) => {
      const currentUserId = getRequestUserId(request);
      return communityService.getCommunities(currentUserId);
    }
  );

  fastify.get<{ Params: { communitySlug: string } }>(
    '/communities/:communitySlug',
    {
      schema: {
        params: Type.Object({
          communitySlug: communitySlugSchema,
        }),
        response: {
          200: CommunitySchema,
        },
      },
    },
    async (request) => {
      const currentUserId = getRequestUserId(request);
      return communityService.getCommunity(request.params.communitySlug, currentUserId);
    }
  );

  fastify.get<{ Params: { communitySlug: string }; Querystring: FeedQuery }>(
    '/communities/:communitySlug/feed',
    {
      schema: {
        params: Type.Object({
          communitySlug: communitySlugSchema,
        }),
        querystring: FeedQuerySchema,
        response: {
          200: FeedResponseSchema,
        },
      },
    },
    async (request) => {
      const currentUserId = getRequestUserId(request);
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
      preHandler: requireIdentity,
      schema: {
        params: Type.Object({
          communitySlug: communitySlugSchema,
        }),
        body: Type.Object({}, { additionalProperties: false }),
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
      const currentUserId = getRequestUserId(request)!;
      return communityService.setMembership(
        request.params.communitySlug,
        currentUserId,
        true
      );
    }
  );

  fastify.delete<{ Params: { communitySlug: string } }>(
    '/communities/:communitySlug/join',
    {
      preHandler: requireIdentity,
      schema: {
        params: Type.Object({ communitySlug: communitySlugSchema }),
        response: {
          200: Type.Object({
            community_id: Type.String(),
            is_member: Type.Boolean(),
            members_count: Type.Integer({ minimum: 0 }),
          }),
        },
      },
    },
    async (request) => {
      const currentUserId = getRequestUserId(request)!;
      return communityService.setMembership(request.params.communitySlug, currentUserId, false);
    }
  );
};

export default communitiesRoutes;
