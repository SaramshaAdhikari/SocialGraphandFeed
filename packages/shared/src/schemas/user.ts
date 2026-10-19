import { Type, type Static } from '@sinclair/typebox';

// UI asset paths are root-relative, while teammate-provided assets may be remote.
const AppUrlSchema = Type.String({ pattern: '^(?:https?:\\/\\/[^\\s]+|/(?!/)[^\\s]*)$' });

export const UserSummarySchema = Type.Object({
  id: Type.String({ description: 'Unique user identifier' }),
  username: Type.String({ minLength: 3, maxLength: 30, pattern: '^[a-zA-Z0-9_]+$' }),
  display_name: Type.String({ minLength: 1, maxLength: 50 }),
  avatar_url: AppUrlSchema,
  is_verified: Type.Boolean({ default: false }),
});

export type UserSummary = Static<typeof UserSummarySchema>;

export const UserProfileSchema = Type.Intersect([
  UserSummarySchema,
  Type.Object({
    bio: Type.String({ maxLength: 250, default: '' }),
    banner_url: Type.Optional(AppUrlSchema),
    website: Type.Optional(AppUrlSchema),
    followers_count: Type.Integer({ minimum: 0, default: 0 }),
    following_count: Type.Integer({ minimum: 0, default: 0 }),
    posts_count: Type.Integer({ minimum: 0, default: 0 }),
    is_following: Type.Boolean({ default: false }),
    created_at: Type.String({ format: 'date-time' }),
  }),
]);

export type UserProfile = Static<typeof UserProfileSchema>;

export const FollowToggleResponseSchema = Type.Object({
  target_user_id: Type.String(),
  is_following: Type.Boolean(),
  followers_count: Type.Integer({ minimum: 0 }),
});

export type FollowToggleResponse = Static<typeof FollowToggleResponseSchema>;

export const FollowListUserSchema = Type.Intersect([UserSummarySchema, Type.Object({ is_following: Type.Boolean() })]);
export type FollowListUser = Static<typeof FollowListUserSchema>;
export const FollowListResponseSchema = Type.Object({
  data: Type.Array(FollowListUserSchema),
  total_count: Type.Integer({ minimum: 0 }),
  next_cursor: Type.Union([Type.String(), Type.Null()]),
  has_more: Type.Boolean(),
});
export type FollowListResponse = Static<typeof FollowListResponseSchema>;
