import { Type, type Static } from '@sinclair/typebox';
import { PostCardSchema, VisualPinCardSchema } from './post.js';
import { createPaginatedResponseSchema } from './common.js';

export const FeedStrategySchema = Type.Union([
  Type.Literal('fanout_read'),
  Type.Literal('fanout_write'),
]);

export type FeedStrategy = Static<typeof FeedStrategySchema>;

export const FeedSortSchema = Type.Union([
  Type.Literal('hot'),
  Type.Literal('new'),
  Type.Literal('top'),
]);

export type FeedSort = Static<typeof FeedSortSchema>;

export const FeedQuerySchema = Type.Object({
  cursor: Type.Optional(Type.String({ maxLength: 2048, description: 'Opaque pagination cursor' })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  strategy: Type.Optional(FeedStrategySchema),
  sort: Type.Optional(FeedSortSchema),
  scope: Type.Optional(Type.Union([Type.Literal('all'), Type.Literal('following'), Type.Literal('communities')])),
}, { additionalProperties: false });

export type FeedQuery = Static<typeof FeedQuerySchema>;

export const DiscoveryQuerySchema = Type.Object({
  cursor: Type.Optional(Type.String({ maxLength: 2048, description: 'Opaque pagination cursor' })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  category: Type.Optional(Type.String({ maxLength: 64 })),
  tag: Type.Optional(Type.String({ maxLength: 64 })),
}, { additionalProperties: false });

export type DiscoveryQuery = Static<typeof DiscoveryQuerySchema>;

export const FeedResponseSchema = createPaginatedResponseSchema(PostCardSchema);
export type FeedResponse = Static<typeof FeedResponseSchema>;

export const DiscoveryResponseSchema = createPaginatedResponseSchema(VisualPinCardSchema);
export type DiscoveryResponse = Static<typeof DiscoveryResponseSchema>;
