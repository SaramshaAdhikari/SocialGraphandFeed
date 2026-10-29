import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  CreateConversationInputSchema,
  SendMessageInputSchema,
  type CreateConversationInput,
  type SendMessageInput,
} from '@socialgraph/shared';
import { ConversationService } from '../services/ConversationService.js';
import { getRequestUserId, requireIdentity } from './identity.js';

const conversationsRoutes: FastifyPluginAsync = async (fastify) => {
  const conversationService = new ConversationService();

  // All direct messaging endpoints require authentication
  fastify.addHook('preHandler', requireIdentity);

  // 1. GET /conversations - List conversations for authenticated user
  fastify.get<{
    Querystring: { cursor?: string; limit?: string };
  }>(
    '/conversations',
    {
      schema: {
        querystring: Type.Object({
          cursor: Type.Optional(Type.String()),
          limit: Type.Optional(Type.String()),
        }),
      },
    },
    async (request) => {
      const userId = getRequestUserId(request)!;
      const limit = request.query.limit ? Math.min(parseInt(request.query.limit, 10) || 20, 50) : 20;
      const result = await conversationService.getUserConversations(userId, request.query.cursor, limit);
      return {
        success: true,
        ...result,
      };
    }
  );

  // 2. GET /conversations/unread-count - Total unread direct messages count
  fastify.get('/conversations/unread-count', async (request) => {
    const userId = getRequestUserId(request)!;
    const count = await conversationService.getTotalUnreadCount(userId);
    return {
      success: true,
      unread_count: count,
    };
  });

  // 3. POST /conversations - Get or create a 1-on-1 conversation
  fastify.post<{
    Body: CreateConversationInput;
  }>(
    '/conversations',
    {
      schema: {
        body: CreateConversationInputSchema,
      },
    },
    async (request, reply) => {
      const userId = getRequestUserId(request)!;
      const { recipient_id, initial_message } = request.body;

      const conversation = await conversationService.getOrCreateDirectConversation(userId, recipient_id);

      // If initial message provided, send it immediately
      if (initial_message && initial_message.trim()) {
        await conversationService.sendMessage(conversation.id, userId, initial_message.trim());
        // Reload conversation with updated last_message
        const updated = await conversationService.getConversation(conversation.id, userId);
        return reply.status(201).send({
          success: true,
          data: updated,
        });
      }

      return reply.status(200).send({
        success: true,
        data: conversation,
      });
    }
  );

  // 4. GET /conversations/:id - Conversation details
  fastify.get<{
    Params: { id: string };
  }>(
    '/conversations/:id',
    {
      schema: {
        params: Type.Object({
          id: Type.String({ minLength: 1 }),
        }),
      },
    },
    async (request) => {
      const userId = getRequestUserId(request)!;
      const conversation = await conversationService.getConversation(request.params.id, userId);
      return {
        success: true,
        data: conversation,
      };
    }
  );

  // 5. GET /conversations/:id/messages - Message history
  fastify.get<{
    Params: { id: string };
    Querystring: { cursor?: string; limit?: string };
  }>(
    '/conversations/:id/messages',
    {
      schema: {
        params: Type.Object({
          id: Type.String({ minLength: 1 }),
        }),
        querystring: Type.Object({
          cursor: Type.Optional(Type.String()),
          limit: Type.Optional(Type.String()),
        }),
      },
    },
    async (request) => {
      const userId = getRequestUserId(request)!;
      const limit = request.query.limit ? Math.min(parseInt(request.query.limit, 10) || 50, 100) : 50;
      const result = await conversationService.getMessages(request.params.id, userId, request.query.cursor, limit);
      return {
        success: true,
        ...result,
      };
    }
  );

  // 6. POST /conversations/:id/messages - Send a message
  fastify.post<{
    Params: { id: string };
    Body: SendMessageInput;
  }>(
    '/conversations/:id/messages',
    {
      schema: {
        params: Type.Object({
          id: Type.String({ minLength: 1 }),
        }),
        body: SendMessageInputSchema,
      },
    },
    async (request, reply) => {
      const userId = getRequestUserId(request)!;
      const message = await conversationService.sendMessage(
        request.params.id,
        userId,
        request.body.content
      );
      return reply.status(201).send({
        success: true,
        data: message,
      });
    }
  );

  // 7. POST /conversations/:id/read - Mark conversation messages as read
  fastify.post<{
    Params: { id: string };
  }>(
    '/conversations/:id/read',
    {
      schema: {
        params: Type.Object({
          id: Type.String({ minLength: 1 }),
        }),
      },
    },
    async (request) => {
      const userId = getRequestUserId(request)!;
      await conversationService.markAsRead(request.params.id, userId);
      return {
        success: true,
      };
    }
  );

  // 8. DELETE /conversations/:id - Remove conversation from current user's inbox
  fastify.delete<{
    Params: { id: string };
  }>(
    '/conversations/:id',
    {
      schema: {
        params: Type.Object({
          id: Type.String({ minLength: 1 }),
        }),
      },
    },
    async (request) => {
      const userId = getRequestUserId(request)!;
      const result = await conversationService.deleteConversation(request.params.id, userId);
      return {
        success: true,
        message: result.message,
      };
    }
  );

  // 9. DELETE /conversations/:id/messages/:messageId - Delete individual message (author only)
  fastify.delete<{
    Params: { id: string; messageId: string };
  }>(
    '/conversations/:id/messages/:messageId',
    {
      schema: {
        params: Type.Object({
          id: Type.String({ minLength: 1 }),
          messageId: Type.String({ minLength: 1 }),
        }),
      },
    },
    async (request) => {
      const userId = getRequestUserId(request)!;
      const deletedMessage = await conversationService.deleteMessage(
        request.params.id,
        request.params.messageId,
        userId
      );
      return {
        success: true,
        data: deletedMessage,
      };
    }
  );
};

export default conversationsRoutes;
