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
import { getRequestUserId, requireIdentity } from './identity.js';

const usernameSchema = Type.String({ minLength: 3, maxLength: 30, pattern: '^[A-Za-z0-9_]+$' });
const userIdSchema = Type.String({ minLength: 1, maxLength: 128, pattern: '^[A-Za-z0-9_-]+$' });

const usersRoutes: FastifyPluginAsync = async (fastify) => {
  const userService = new UserService();

  fastify.get<{ Params: { username: string } }>(
    '/users/:username',
    {
      schema: {
        params: Type.Object({
          username: usernameSchema,
        }),
        response: {
          200: UserProfileSchema,
        },
      },
    },
    async (request) => {
      const currentUserId = getRequestUserId(request);
      return userService.getUserProfile(request.params.username, currentUserId);
    }
  );

  fastify.get<{ Params: { username: string }; Querystring: FeedQuery }>(
    '/users/:username/posts',
    {
      schema: {
        params: Type.Object({
          username: usernameSchema,
        }),
        querystring: FeedQuerySchema,
        response: {
          200: FeedResponseSchema,
        },
      },
    },
    async (request) => {
      const currentUserId = getRequestUserId(request);
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
      preHandler: requireIdentity,
      schema: {
        params: Type.Object({
          targetUserId: userIdSchema,
        }),
        body: Type.Object({}, { additionalProperties: false }),
        response: {
          200: FollowToggleResponseSchema,
        },
      },
    },
    async (request) => {
      const currentUserId = getRequestUserId(request)!;
      return userService.toggleFollow(request.params.targetUserId, currentUserId);
    }
  );
};

export default usersRoutes;
