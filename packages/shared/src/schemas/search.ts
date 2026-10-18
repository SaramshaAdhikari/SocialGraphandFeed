import { Type, type Static } from '@sinclair/typebox';
import { DiscussionPostCardSchema, VisualPinCardSchema } from './post.js';
import { CommunitySchema } from './community.js';
import { UserProfileSchema } from './user.js';

export const SearchCategorySchema = Type.Union([
  Type.Literal('all'),
  Type.Literal('discussions'),
  Type.Literal('visual'),
  Type.Literal('communities'),
  Type.Literal('people'),
]);

export type SearchCategory = Static<typeof SearchCategorySchema>;

export const SearchSortSchema = Type.Union([
  Type.Literal('relevance'),
  Type.Literal('top'),
  Type.Literal('new'),
]);

export type SearchSort = Static<typeof SearchSortSchema>;

export const SearchQuerySchema = Type.Object({
  q: Type.String({ maxLength: 200 }),
  category: Type.Optional(SearchCategorySchema),
  sort: Type.Optional(SearchSortSchema),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
}, { additionalProperties: false });

export type SearchQuery = Static<typeof SearchQuerySchema>;

export const UniversalSearchResultsSchema = Type.Object({
  query: Type.String(),
  discussions: Type.Array(DiscussionPostCardSchema),
  visuals: Type.Array(VisualPinCardSchema),
  communities: Type.Array(CommunitySchema),
  users: Type.Array(UserProfileSchema),
  total_count: Type.Integer({ minimum: 0 }),
});

export type UniversalSearchResults = Static<typeof UniversalSearchResultsSchema>;
