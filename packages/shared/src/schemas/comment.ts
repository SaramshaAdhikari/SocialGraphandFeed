import { Type, type Static } from '@sinclair/typebox';
import { UserSummarySchema } from './user.js';

export const CommentNodeSchema = Type.Recursive((Self) =>
  Type.Object({
    id: Type.String(),
    post_id: Type.String(),
    parent_id: Type.Union([Type.String(), Type.Null()]),
    author: UserSummarySchema,
    content: Type.String({ minLength: 1, maxLength: 10000 }),
    created_at: Type.String({ format: 'date-time' }),
    updated_at: Type.String({ format: 'date-time' }),
    score: Type.Integer({ default: 0 }),
    user_vote: Type.Union([Type.Literal(1), Type.Literal(-1), Type.Literal(0)]),
    depth: Type.Integer({ minimum: 0, maximum: 10 }),
    replies: Type.Array(Self, { default: [] }),
  })
);

export type CommentNode = Static<typeof CommentNodeSchema>;

export const CreateCommentInputSchema = Type.Object({
  content: Type.String({ minLength: 1, maxLength: 10000 }),
  parent_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export type CreateCommentInput = Static<typeof CreateCommentInputSchema>;
