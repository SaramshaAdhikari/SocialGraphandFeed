import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  PostCardSchema,
  CreatePostInputSchema,
  VoteInputSchema,
  SavedPostsQuerySchema,
  FeedResponseSchema,
  type SavedPostsQuery,
  CommentNodeSchema,
  CreateCommentInputSchema,
  type CreatePostInput,
  type VoteInput,
  type CreateCommentInput,
} from '@socialgraph/shared';
import { PostService } from '../services/PostService.js';
import { getRequestUserId, requireIdentity } from './identity.js';
import { RateLimitService } from '../services/RateLimitService.js';
import { IdempotencyService } from '../services/IdempotencyService.js';
import { AppError, type PostCard, type CommentNode } from '@socialgraph/shared';

const postIdSchema = Type.String({ minLength: 1, maxLength: 128, pattern: '^[A-Za-z0-9_-]+$' });

const postsRoutes: FastifyPluginAsync = async (fastify) => {
  const postService = new PostService();
  const rateLimitService = new RateLimitService();
  const idempotencyService = new IdempotencyService();

  
  fastify.get<{ Querystring: SavedPostsQuery }>(
    '/posts/saved',
    {
      preHandler: requireIdentity,
      schema: {
        querystring: SavedPostsQuerySchema,
        response: {
          200: FeedResponseSchema,
        },
      },
    },
    async (request) => {
      const userId = getRequestUserId(request)!;
      return postService.getSavedPosts(userId, request.query);
    }
  );

  fastify.get<{ Params: { postId: string } }>(
    '/posts/:postId',
    {
      schema: {
        params: Type.Object({
          postId: postIdSchema,
        }),
        response: {
          200: PostCardSchema,
        },
      },
    },
    async (request) => {
      const userId = getRequestUserId(request);
      return postService.getPost(request.params.postId, userId);
    }
  );

  fastify.post<{ Body: CreatePostInput }>(
    '/posts',
    {
      preHandler: requireIdentity,
      schema: {
        body: CreatePostInputSchema,
        response: {
          201: PostCardSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = getRequestUserId(request)!;

      // Rate limiting: capped posting per security contract Section 10
      await rateLimitService.checkOrThrow({
        action: 'post',
        ip: request.ip,
        userId,
        limit: 10,
        windowSeconds: 60,
        requestId: request.id,
      });

      // Media / URL validation: ensure valid protocol and no credentials
      const body = request.body;
      if (body.destination_url) {
        try {
          const u = new URL(body.destination_url);
          if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) {
            throw new Error();
          }
        } catch {
          throw AppError.badRequest('destination_url must be a valid http or https URL without credentials.');
        }
      }
      if (body.media) {
        const mediaList = Array.isArray(body.media) ? body.media : [body.media];
        for (const item of mediaList) {
          if (item?.url) {
            try {
              const u = new URL(item.url);
              if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) {
                throw new Error();
              }
            } catch {
              throw AppError.badRequest('media.url must be a valid http or https URL without credentials.');
            }
          }
        }
      }

      // Atomic Idempotency check
      const rawIdempKey = request.headers['idempotency-key'];
      const idempKey = typeof rawIdempKey === 'string' && rawIdempKey.trim() ? rawIdempKey.trim() : null;

      if (idempKey) {
        const claim = await idempotencyService.claim<PostCard>(userId, 'create_post', idempKey);
        if (claim.type === 'cached' && claim.cachedResponse) {
          reply.status(claim.cachedResponse.statusCode).header('x-idempotent-replay', 'true');
          return claim.cachedResponse.body;
        }

        try {
          const post = await postService.createPost(request.body, userId, idempKey);
          await idempotencyService.complete(userId, 'create_post', idempKey, 201, post);
          reply.status(201);
          return post;
        } catch (err) {
          await idempotencyService.clear(userId, 'create_post', idempKey);
          throw err;
        }
      }

      const post = await postService.createPost(request.body, userId);
      reply.status(201);
      return post;
    }
  );

  fastify.post<{ Params: { postId: string }; Body: VoteInput }>(
    '/posts/:postId/vote',
    {
      preHandler: requireIdentity,
      schema: {
        params: Type.Object({
          postId: postIdSchema,
        }),
        body: VoteInputSchema,
        response: {
          200: Type.Object({
            post_id: Type.String(),
            score: Type.Integer(),
            new_score: Type.Integer(),
            user_vote: Type.Union([Type.Literal(1), Type.Literal(-1), Type.Literal(0)]),
          }),
        },
      },
    },
    async (request) => {
      const userId = getRequestUserId(request)!;
      return postService.votePost(request.params.postId, userId, request.body.direction);
    }
  );

  fastify.post<{ Params: { postId: string } }>(
    '/posts/:postId/save',
    {
      preHandler: requireIdentity,
      schema: {
        params: Type.Object({
          postId: postIdSchema,
        }),
        body: Type.Object({}, { additionalProperties: false }),
        response: {
          200: Type.Object({
            post_id: Type.String(),
            is_saved: Type.Boolean(),
          }),
        },
      },
    },
    async (request) => {
      const userId = getRequestUserId(request)!;
      return postService.toggleSavePost(request.params.postId, userId);
    }
  );

  fastify.get<{ Params: { postId: string } }>(
    '/posts/:postId/comments',
    {
      schema: {
        params: Type.Object({
          postId: postIdSchema,
        }),
        response: {
          200: Type.Array(CommentNodeSchema),
        },
      },
    },
    async (request) => {
      const userId = getRequestUserId(request);
      return postService.getComments(request.params.postId, userId);
    }
  );

  fastify.post<{ Params: { postId: string }; Body: CreateCommentInput }>(
    '/posts/:postId/comments',
    {
      preHandler: requireIdentity,
      schema: {
        params: Type.Object({
          postId: postIdSchema,
        }),
        body: CreateCommentInputSchema,
        response: {
          201: CommentNodeSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = getRequestUserId(request)!;

      // Rate limiting: 10 comments/min per user
      await rateLimitService.checkOrThrow({
        action: 'comment',
        ip: request.ip,
        userId,
        limit: 10,
        windowSeconds: 60,
        requestId: request.id,
      });

      const rawIdempKey = request.headers['idempotency-key'];
      const idempKey = typeof rawIdempKey === 'string' && rawIdempKey.trim() ? rawIdempKey.trim() : null;

      if (idempKey) {
        const claim = await idempotencyService.claim<CommentNode>(userId, `create_comment:${request.params.postId}`, idempKey);
        if (claim.type === 'cached' && claim.cachedResponse) {
          reply.status(claim.cachedResponse.statusCode).header('x-idempotent-replay', 'true');
          return claim.cachedResponse.body;
        }

        try {
          const comment = await postService.createComment(
            request.params.postId,
            userId,
            request.body,
            idempKey
          );
          await idempotencyService.complete(userId, `create_comment:${request.params.postId}`, idempKey, 201, comment);
          reply.status(201);
          return comment;
        } catch (err) {
          await idempotencyService.clear(userId, `create_comment:${request.params.postId}`, idempKey);
          throw err;
        }
      }

      const comment = await postService.createComment(
        request.params.postId,
        userId,
        request.body
      );
      reply.status(201);
      return comment;
    }
  );
};

export default postsRoutes;
