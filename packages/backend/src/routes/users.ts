import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  UserProfileSchema,
  FeedQuerySchema,
  FeedResponseSchema,
  FollowToggleResponseSchema,
  FollowListResponseSchema,
  UpdateUserProfileInputSchema,
  type FeedQuery,
  type UpdateUserProfileInput,
} from '@socialgraph/shared';
import { UserService } from '../services/UserService.js';
import { getRequestUserId, requireIdentity } from './identity.js';

const usernameSchema = Type.String({ minLength: 3, maxLength: 30, pattern: '^[A-Za-z0-9_]+$' });
const userIdSchema = Type.String({ minLength: 1, maxLength: 128, pattern: '^[A-Za-z0-9_-]+$' });

const usersRoutes: FastifyPluginAsync = async (fastify) => {
  const userService = new UserService();

  fastify.patch<{ Body: UpdateUserProfileInput }>(
    '/users/me',
    {
      preHandler: requireIdentity,
      schema: {
        body: UpdateUserProfileInputSchema,
        response: {
          200: UserProfileSchema,
        },
      },
    },
    async (request) => {
      const currentUserId = getRequestUserId(request)!;
      return userService.updateProfile(currentUserId, request.body);
    }
  );

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

  fastify.get<{ Querystring: { limit?: number } }>(
    '/graph/neighborhood',
    { preHandler: requireIdentity },
    async (request) => {
      return userService.getGraphNeighborhood(getRequestUserId(request)!, request.query.limit);
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

  for (const direction of ['followers', 'following'] as const) {
    fastify.get<{ Params: { username: string }; Querystring: { cursor?: string; limit?: number } }>(
      `/users/:username/${direction}`,
      { schema: { params: Type.Object({ username: usernameSchema }), querystring: Type.Object({ cursor: Type.Optional(Type.String()), limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50 })) }), response: { 200: FollowListResponseSchema } } },
      async (request) => userService.getFollowList(request.params.username, direction, getRequestUserId(request), request.query.cursor, request.query.limit)
    );
  }

  fastify.put<{ Params: { targetUserId: string }; Body: { is_following: boolean } }>(
    '/users/:targetUserId/follow',
    { preHandler: requireIdentity, schema: { params: Type.Object({ targetUserId: userIdSchema }), body: Type.Object({ is_following: Type.Boolean() }), response: { 200: FollowToggleResponseSchema } } },
    async (request) => userService.setFollow(request.params.targetUserId, getRequestUserId(request)!, request.body.is_following)
  );

  fastify.delete<{ Params: { targetUserId: string } }>(
    '/users/:targetUserId/follow',
    { preHandler: requireIdentity, schema: { params: Type.Object({ targetUserId: userIdSchema }) } },
    async (request) => userService.setFollow(request.params.targetUserId, getRequestUserId(request)!, false)
  );
};

export default usersRoutes;
