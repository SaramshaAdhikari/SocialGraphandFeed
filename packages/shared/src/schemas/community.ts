import { Type, type Static } from '@sinclair/typebox';

export const CommunityRuleSchema = Type.Object({
  id: Type.String(),
  title: Type.String({ minLength: 3, maxLength: 100 }),
  description: Type.String({ maxLength: 500 }),
});

export type CommunityRule = Static<typeof CommunityRuleSchema>;

export const CommunitySchema = Type.Object({
  id: Type.String(),
  name: Type.String({ minLength: 2, maxLength: 50 }),
  slug: Type.String({ minLength: 2, maxLength: 30, pattern: '^[a-z0-9_-]+$' }),
  description: Type.String({ maxLength: 1000 }),
  banner_url: Type.Optional(Type.String({ format: 'uri' })),
  avatar_url: Type.Optional(Type.String({ format: 'uri' })),
  members_count: Type.Integer({ minimum: 0, default: 0 }),
  rules: Type.Array(CommunityRuleSchema, { default: [] }),
  is_member: Type.Boolean({ default: false }),
  created_at: Type.String({ format: 'date-time' }),
});

export type Community = Static<typeof CommunitySchema>;
