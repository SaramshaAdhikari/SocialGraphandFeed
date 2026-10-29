import { Type, type Static } from '@sinclair/typebox';
import { UserSummarySchema } from './user.js';
import { createPaginatedResponseSchema, PaginationQuerySchema } from './common.js';

export const NotificationTypeSchema = Type.Union([
  Type.Literal('follow'),
  Type.Literal('comment'),
  Type.Literal('reply'),
  Type.Literal('message'),
]);

export type NotificationType = Static<typeof NotificationTypeSchema>;

export const NotificationItemSchema = Type.Object({
  id: Type.String({ description: 'Unique notification identifier' }),
  recipient_id: Type.String({ description: 'Recipient user ID' }),
  actor_id: Type.String({ description: 'Actor user ID' }),
  actor: Type.Optional(UserSummarySchema),
  type: NotificationTypeSchema,
  post_id: Type.Optional(Type.String({ description: 'Referenced post ID if applicable' })),
  comment_id: Type.Optional(Type.String({ description: 'Referenced comment ID if applicable' })),
  conversation_id: Type.Optional(Type.String({ description: 'Referenced conversation ID if applicable' })),
  read: Type.Boolean({ description: 'Read state' }),
  read_at: Type.Optional(Type.String({ format: 'date-time', description: 'Timestamp when marked as read' })),
  created_at: Type.String({ format: 'date-time', description: 'Creation timestamp' }),
});

export type NotificationItem = Static<typeof NotificationItemSchema>;

export const NotificationsQuerySchema = Type.Intersect([
  PaginationQuerySchema,
  Type.Object({
    unread_only: Type.Optional(Type.Boolean({ description: 'Filter unread notifications only' })),
  }),
]);

export type NotificationsQuery = Static<typeof NotificationsQuerySchema>;

export const NotificationsResponseSchema = createPaginatedResponseSchema(NotificationItemSchema);
export type NotificationsResponse = Static<typeof NotificationsResponseSchema>;

export const UnreadCountResponseSchema = Type.Object({
  unread_count: Type.Integer({ minimum: 0, description: 'Number of unread notifications' }),
});

export type UnreadCountResponse = Static<typeof UnreadCountResponseSchema>;

export const MarkReadResponseSchema = Type.Object({
  success: Type.Literal(true),
  notification: NotificationItemSchema,
});

export type MarkReadResponse = Static<typeof MarkReadResponseSchema>;

export const MarkAllReadResponseSchema = Type.Object({
  success: Type.Literal(true),
  updated_count: Type.Integer({ minimum: 0 }),
});

export type MarkAllReadResponse = Static<typeof MarkAllReadResponseSchema>;
