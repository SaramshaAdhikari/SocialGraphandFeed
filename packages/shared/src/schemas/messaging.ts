import { Type, type Static } from '@sinclair/typebox';
import { UserSummarySchema } from './user.js';
import { createPaginatedResponseSchema, PaginationQuerySchema } from './common.js';

export const DirectMessageSchema = Type.Object({
  id: Type.String({ description: 'Unique message identifier' }),
  conversation_id: Type.String({ description: 'Parent conversation identifier' }),
  sender_id: Type.String({ description: 'Sender user ID' }),
  sender: Type.Optional(UserSummarySchema),
  content: Type.String({ minLength: 1, maxLength: 2000, description: 'Message body content' }),
  is_read: Type.Boolean({ description: 'Whether the message has been read by recipient' }),
  read_at: Type.Optional(Type.String({ format: 'date-time' })),
  created_at: Type.String({ format: 'date-time', description: 'Message creation timestamp' }),
  is_deleted: Type.Optional(Type.Boolean({ description: 'Whether the message has been retracted / deleted' })),
  deleted_at: Type.Optional(Type.String({ format: 'date-time', description: 'Timestamp when message was deleted' })),
});

export type DirectMessage = Static<typeof DirectMessageSchema>;

export const ConversationSummarySchema = Type.Object({
  id: Type.String({ description: 'Unique conversation identifier' }),
  participant_ids: Type.Array(Type.String(), { description: 'IDs of participating users' }),
  participants: Type.Array(UserSummarySchema, { description: 'User summaries of participants' }),
  other_participant: Type.Optional(UserSummarySchema),
  last_message: Type.Optional(DirectMessageSchema),
  unread_count: Type.Integer({ minimum: 0, description: 'Unread messages count for current user' }),
  created_at: Type.String({ format: 'date-time' }),
  updated_at: Type.String({ format: 'date-time' }),
});

export type ConversationSummary = Static<typeof ConversationSummarySchema>;

export const SendMessageInputSchema = Type.Object({
  content: Type.String({ minLength: 1, maxLength: 2000, description: 'Message content to send' }),
}, { additionalProperties: false });

export type SendMessageInput = Static<typeof SendMessageInputSchema>;

export const CreateConversationInputSchema = Type.Object({
  recipient_id: Type.String({ minLength: 1, description: 'User ID of conversation recipient' }),
  initial_message: Type.Optional(Type.String({ minLength: 1, maxLength: 2000 })),
}, { additionalProperties: false });

export type CreateConversationInput = Static<typeof CreateConversationInputSchema>;

export const ConversationListResponseSchema = createPaginatedResponseSchema(ConversationSummarySchema);
export type ConversationListResponse = Static<typeof ConversationListResponseSchema>;

export const MessageListResponseSchema = createPaginatedResponseSchema(DirectMessageSchema);
export type MessageListResponse = Static<typeof MessageListResponseSchema>;

export const TotalUnreadMessagesResponseSchema = Type.Object({
  unread_count: Type.Integer({ minimum: 0, description: 'Total unread direct messages' }),
});
export type TotalUnreadMessagesResponse = Static<typeof TotalUnreadMessagesResponseSchema>;
