import { Type, type Static } from '@sinclair/typebox';
import { UserSummarySchema } from './user.js';

export const MediaAttachmentSchema = Type.Object({
  id: Type.String({ minLength: 1, maxLength: 128 }),
  url: Type.String({ maxLength: 2048, pattern: '^(?:https?:\\/\\/[^\\s]+|/(?!/)[^\\s]*)$' }),
  aspect_ratio: Type.Number({ minimum: 0.1, maximum: 10.0, description: 'width / height ratio for layout reservation' }),
  width: Type.Optional(Type.Integer({ minimum: 1 })),
  height: Type.Optional(Type.Integer({ minimum: 1 })),
  alt_text: Type.Optional(Type.String({ maxLength: 300 })),
}, { additionalProperties: false });

export type MediaAttachment = Static<typeof MediaAttachmentSchema>;

export const PostTypeSchema = Type.Union([
  Type.Literal('visual'),
  Type.Literal('discussion'),
]);

export type PostType = Static<typeof PostTypeSchema>;

export const TagSchema = Type.String({
  minLength: 1,
  maxLength: 50,
  pattern: '^[A-Za-z0-9_-]+$',
  description: 'Normalized topical tag slug without leading #',
});

export type Tag = Static<typeof TagSchema>;

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
  media_list: Type.Optional(Type.Array(MediaAttachmentSchema)),
  collection_id: Type.Optional(Type.String()),
  dominant_color: Type.Optional(Type.String()),
  destination_url: Type.Optional(Type.String()),
  tags: Type.Optional(Type.Array(TagSchema)),
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
  flair: Type.Optional(Type.String({ maxLength: 50 })),
  destination_url: Type.Optional(Type.String()),
  tags: Type.Optional(Type.Array(TagSchema)),
});

export type DiscussionPostCard = Static<typeof DiscussionPostCardSchema>;

export const PostCardSchema = Type.Union([VisualPinCardSchema, DiscussionPostCardSchema]);
export type PostCard = Static<typeof PostCardSchema>;

export const CreatePostInputSchema = Type.Object({
  post_type: Type.Optional(PostTypeSchema),
  title: Type.Optional(Type.String({ maxLength: 300 })),
  content: Type.Optional(Type.String({ maxLength: 40000 })),
  community_id: Type.Optional(Type.String({ maxLength: 128, pattern: '^[A-Za-z0-9_-]+$' })),
  collection_id: Type.Optional(Type.String({ maxLength: 128, pattern: '^[A-Za-z0-9_-]+$' })),
  media: Type.Optional(Type.Array(MediaAttachmentSchema, { maxItems: 10 })),
  flair: Type.Optional(Type.String({ maxLength: 50 })),
  caption: Type.Optional(Type.String({ maxLength: 1000 })),
  destination_url: Type.Optional(Type.String({ maxLength: 2048, pattern: '^https?:\\/\\/\\S+$' })),
  tags: Type.Optional(Type.Array(TagSchema, { maxItems: 20 })),
}, { additionalProperties: false });

export type CreatePostInput = Static<typeof CreatePostInputSchema>;

export const UpdatePostInputSchema = Type.Object({
  title: Type.Optional(Type.String({ maxLength: 300 })),
  content: Type.Optional(Type.String({ maxLength: 40000 })),
  caption: Type.Optional(Type.String({ maxLength: 1000 })),
  media: Type.Optional(Type.Array(MediaAttachmentSchema, { maxItems: 10 })),
  destination_url: Type.Optional(Type.String({ maxLength: 2048, pattern: '^https?:\\/\\/\\S+$' })),
  tags: Type.Optional(Type.Array(TagSchema, { maxItems: 20 })),
}, { additionalProperties: false });

export type UpdatePostInput = Static<typeof UpdatePostInputSchema>;

export const MediaUploadResponseSchema = Type.Object({
  success: Type.Literal(true),
  media: Type.Array(MediaAttachmentSchema),
});

export type MediaUploadResponse = Static<typeof MediaUploadResponseSchema>;

export const VoteInputSchema = Type.Object({
  direction: Type.Union([Type.Literal(1), Type.Literal(-1), Type.Literal(0)]),
}, { additionalProperties: false });

export type VoteInput = Static<typeof VoteInputSchema>;

export const SavedPostsQuerySchema = Type.Object({
  cursor: Type.Optional(Type.String({ maxLength: 2048 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  sort: Type.Optional(Type.Union([Type.Literal('new'), Type.Literal('top'), Type.Literal('comments')])),
  type: Type.Optional(Type.Union([Type.Literal('all'), Type.Literal('discussions'), Type.Literal('visual')])),
  communitySlug: Type.Optional(Type.String({ maxLength: 80 })),
  community: Type.Optional(Type.String({ maxLength: 80 })),
  topic: Type.Optional(Type.String({ maxLength: 80 })),
  query: Type.Optional(Type.String({ maxLength: 200 })),
  q: Type.Optional(Type.String({ maxLength: 200 })),
}, { additionalProperties: false });

export type SavedPostsQuery = Static<typeof SavedPostsQuerySchema>;
