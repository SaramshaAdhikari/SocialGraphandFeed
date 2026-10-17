import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  UserProfileSchema,
  FeedQuerySchema,
  FeedResponseSchema,
  FollowToggleResponseSchema,
  type FeedQuery,
} from '@socialgraph/shared';
import { UserService } from '../services/UserService.js';

const usersRoutes: FastifyPluginAsync = async (fastify) => {
  const userService = new UserService();

  fastify.get<{ Params: { username: string } }>(
    '/users/:username',
    {
      schema: {
        params: Type.Object({
          username: Type.String(),
        }),
        response: {
          200: UserProfileSchema,
        },
      },
    },
    async (request) => {
      const currentUserId = (request as any).userId;
      return userService.getUserProfile(request.params.username, currentUserId);
    }
  );

  fastify.get<{ Params: { username: string }; Querystring: FeedQuery }>(
    '/users/:username/posts',
    {
      schema: {
        params: Type.Object({
          username: Type.String(),
        }),
        querystring: FeedQuerySchema,
        response: {
          200: FeedResponseSchema,
        },
      },
    },
    async (request) => {
      const currentUserId = (request as any).userId;
      return userService.getUserPosts(
        request.params.username,
        request.query,
        currentUserId
      );
    }
  );

  fastify.post<{ Params: { targetUserId: string } }>(
    '/users/:targetUserId/follow',
    {
      schema: {
        params: Type.Object({
          targetUserId: Type.String(),
        }),
        response: {
          200: FollowToggleResponseSchema,
        },
      },
    },
    async (request) => {
      const currentUserId = (request as any).userId || 'usr_0';
      return userService.toggleFollow(request.params.targetUserId, currentUserId);
    }
  );
};

export default usersRoutes;
