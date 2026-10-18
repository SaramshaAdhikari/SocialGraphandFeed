import { Type, type Static } from '@sinclair/typebox';
import { UserSummarySchema } from './user.js';

export const MediaAttachmentSchema = Type.Object({
  id: Type.String(),
  url: Type.String({ format: 'uri' }),
  aspect_ratio: Type.Number({ minimum: 0.1, maximum: 10.0, description: 'width / height ratio for layout reservation' }),
  width: Type.Optional(Type.Integer({ minimum: 1 })),
  height: Type.Optional(Type.Integer({ minimum: 1 })),
  alt_text: Type.Optional(Type.String({ maxLength: 300 })),
});

export type MediaAttachment = Static<typeof MediaAttachmentSchema>;

export const PostTypeSchema = Type.Union([
  Type.Literal('visual'),
  Type.Literal('discussion'),
]);

export type PostType = Static<typeof PostTypeSchema>;

/**
 * Base post attributes shared across visual pins and discussions.
 */
const BasePostAttributes = {
  id: Type.String(),
  author: UserSummarySchema,
  community_id: Type.Optional(Type.String()),
  community_slug: Type.Optional(Type.String()),
  created_at: Type.String({ format: 'date-time' }),
  updated_at: Type.String({ format: 'date-time' }),
  score: Type.Integer({ default: 0, description: 'Net upvotes minus downvotes' }),
  user_vote: Type.Union([Type.Literal(1), Type.Literal(-1), Type.Literal(0)]),
  comments_count: Type.Integer({ minimum: 0, default: 0 }),
  is_saved: Type.Boolean({ default: false }),
};

/**
 * Visual Pin Card (Canonical Pinterest layout: pinterest_DESIGN.md)
 */
export const VisualPinCardSchema = Type.Object({
  ...BasePostAttributes,
  post_type: Type.Literal('visual'),
  title: Type.Optional(Type.String({ maxLength: 150 })),
  caption: Type.Optional(Type.String({ maxLength: 500 })),
  media: MediaAttachmentSchema,
  collection_id: Type.Optional(Type.String()),
  dominant_color: Type.Optional(Type.String()),
  destination_url: Type.Optional(Type.String()),
  tags: Type.Optional(Type.Array(Type.String())),
});

export type VisualPinCard = Static<typeof VisualPinCardSchema>;

/**
 * Discussion Post Card (Canonical Reddit layout: reddit_DESIGN.md)
 */
export const DiscussionPostCardSchema = Type.Object({
  ...BasePostAttributes,
  post_type: Type.Literal('discussion'),
  title: Type.String({ minLength: 3, maxLength: 300 }),
  content: Type.String({ maxLength: 40000, description: 'Markdown prose body' }),
  media: Type.Optional(Type.Array(MediaAttachmentSchema)),
  flair: Type.Optional(Type.String({ maxLength: 30 })),
  tags: Type.Optional(Type.Array(Type.String())),
});

export type DiscussionPostCard = Static<typeof DiscussionPostCardSchema>;

export const PostCardSchema = Type.Union([VisualPinCardSchema, DiscussionPostCardSchema]);
export type PostCard = Static<typeof PostCardSchema>;

export const CreatePostInputSchema = Type.Object({
  post_type: PostTypeSchema,
  title: Type.String({ minLength: 1, maxLength: 300 }),
  content: Type.Optional(Type.String({ maxLength: 40000 })),
  community_id: Type.Optional(Type.String()),
  collection_id: Type.Optional(Type.String()),
  media: Type.Optional(Type.Array(MediaAttachmentSchema)),
  flair: Type.Optional(Type.String({ maxLength: 50 })),
  caption: Type.Optional(Type.String({ maxLength: 1000 })),
  destination_url: Type.Optional(Type.String()),
  tags: Type.Optional(Type.Array(Type.String())),
});

export type CreatePostInput = Static<typeof CreatePostInputSchema>;

export const VoteInputSchema = Type.Object({
  direction: Type.Union([Type.Literal(1), Type.Literal(-1), Type.Literal(0)]),
});

export type VoteInput = Static<typeof VoteInputSchema>;
