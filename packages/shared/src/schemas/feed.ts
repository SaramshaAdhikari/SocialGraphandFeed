import { Type, type Static } from '@sinclair/typebox';
import { PostCardSchema, VisualPinCardSchema } from './post.js';
import { createPaginatedResponseSchema, PaginationQuerySchema } from './common.js';

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

export const FeedQuerySchema = Type.Intersect([
  PaginationQuerySchema,
  Type.Object({
    strategy: Type.Optional(FeedStrategySchema),
    sort: Type.Optional(FeedSortSchema),
    scope: Type.Optional(Type.Union([Type.Literal('all'), Type.Literal('following'), Type.Literal('communities')])),
  }),
]);

export type FeedQuery = Static<typeof FeedQuerySchema>;

export const DiscoveryQuerySchema = Type.Intersect([
  PaginationQuerySchema,
  Type.Object({
    category: Type.Optional(Type.String()),
    tag: Type.Optional(Type.String()),
  }),
]);

export type DiscoveryQuery = Static<typeof DiscoveryQuerySchema>;

export const FeedResponseSchema = createPaginatedResponseSchema(PostCardSchema);
export type FeedResponse = Static<typeof FeedResponseSchema>;

export const DiscoveryResponseSchema = createPaginatedResponseSchema(VisualPinCardSchema);
export type DiscoveryResponse = Static<typeof DiscoveryResponseSchema>;
