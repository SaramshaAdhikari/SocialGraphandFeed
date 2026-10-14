import { Type, type Static } from '@sinclair/typebox';

export const UserSummarySchema = Type.Object({
  id: Type.String({ description: 'Unique user identifier' }),
  username: Type.String({ minLength: 3, maxLength: 30, pattern: '^[a-zA-Z0-9_]+$' }),
  display_name: Type.String({ minLength: 1, maxLength: 50 }),
  avatar_url: Type.String({ format: 'uri' }),
  is_verified: Type.Boolean({ default: false }),
});

export type UserSummary = Static<typeof UserSummarySchema>;

export const UserProfileSchema = Type.Intersect([
  UserSummarySchema,
  Type.Object({
    bio: Type.String({ maxLength: 250, default: '' }),
    banner_url: Type.Optional(Type.String({ format: 'uri' })),
    website: Type.Optional(Type.String({ format: 'uri' })),
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
