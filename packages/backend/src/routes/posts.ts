import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  PostCardSchema,
  CreatePostInputSchema,
  VoteInputSchema,
  CommentNodeSchema,
  CreateCommentInputSchema,
  type CreatePostInput,
  type VoteInput,
  type CreateCommentInput,
} from '@socialgraph/shared';
import { PostService } from '../services/PostService.js';
import { getRequestUserId, requireIdentity } from './identity.js';

const postIdSchema = Type.String({ minLength: 1, maxLength: 128, pattern: '^[A-Za-z0-9_-]+$' });

const postsRoutes: FastifyPluginAsync = async (fastify) => {
  const postService = new PostService();

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
