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

const postsRoutes: FastifyPluginAsync = async (fastify) => {
  const postService = new PostService();

  fastify.get<{ Params: { postId: string } }>(
    '/posts/:postId',
    {
      schema: {
        params: Type.Object({
          postId: Type.String(),
        }),
        response: {
          200: PostCardSchema,
        },
      },
    },
    async (request) => {
      const userId = (request as any).userId;
      return postService.getPost(request.params.postId, userId);
    }
  );

  fastify.post<{ Body: CreatePostInput }>(
    '/posts',
    {
      schema: {
        body: CreatePostInputSchema,
        response: {
          201: PostCardSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = (request as any).userId || 'usr_0';
      const post = await postService.createPost(request.body, userId);
      reply.status(201);
      return post;
    }
  );

  fastify.post<{ Params: { postId: string }; Body: VoteInput }>(
    '/posts/:postId/vote',
    {
      schema: {
        params: Type.Object({
          postId: Type.String(),
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
      const userId = (request as any).userId || 'usr_0';
      return postService.votePost(request.params.postId, userId, request.body.direction);
    }
  );

  fastify.post<{ Params: { postId: string } }>(
    '/posts/:postId/save',
    {
      schema: {
        params: Type.Object({
          postId: Type.String(),
        }),
        response: {
          200: Type.Object({
            post_id: Type.String(),
            is_saved: Type.Boolean(),
          }),
        },
      },
    },
    async (request) => {
      const userId = (request as any).userId || 'usr_0';
      return postService.toggleSavePost(request.params.postId, userId);
    }
  );

  fastify.get<{ Params: { postId: string } }>(
    '/posts/:postId/comments',
    {
      schema: {
        params: Type.Object({
          postId: Type.String(),
        }),
        response: {
          200: Type.Array(CommentNodeSchema),
        },
      },
    },
    async (request) => {
      const userId = (request as any).userId;
      return postService.getComments(request.params.postId, userId);
    }
  );

  fastify.post<{ Params: { postId: string }; Body: CreateCommentInput }>(
    '/posts/:postId/comments',
    {
      schema: {
        params: Type.Object({
          postId: Type.String(),
        }),
        body: CreateCommentInputSchema,
        response: {
          201: CommentNodeSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = (request as any).userId || 'usr_0';
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
