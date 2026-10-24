import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  NotificationsQuerySchema,
  NotificationsResponseSchema,
  UnreadCountResponseSchema,
  MarkReadResponseSchema,
  MarkAllReadResponseSchema,
  type NotificationsQuery,
} from '@socialgraph/shared';
import { NotificationService } from '../services/NotificationService.js';
import { getRequestUserId, requireIdentity } from './identity.js';

const notificationIdSchema = Type.String({ minLength: 1, maxLength: 128, pattern: '^[A-Za-z0-9_-]+$' });

const notificationsRoutes: FastifyPluginAsync = async (fastify) => {
  const notificationService = new NotificationService();

  // All notification endpoints require authentication
  fastify.addHook('preHandler', requireIdentity);

  // 1. GET /notifications - cursor-paginated notifications for authenticated user
  fastify.get<{ Querystring: NotificationsQuery }>(
    '/notifications',
    {
      schema: {
        querystring: NotificationsQuerySchema,
        response: {
          200: NotificationsResponseSchema,
        },
      },
    },
    async (request) => {
      const userId = getRequestUserId(request)!;
      return notificationService.getNotifications(userId, request.query);
    }
  );

  // 2. GET /notifications/unread-count - unread notification count
  fastify.get(
    '/notifications/unread-count',
    {
      schema: {
        response: {
          200: UnreadCountResponseSchema,
        },
      },
    },
    async (request) => {
      const userId = getRequestUserId(request)!;
      const count = await notificationService.getUnreadCount(userId);
      return { unread_count: count };
    }
  );

  // 3. PATCH /notifications/read-all - mark all unread notifications as read
  fastify.patch(
    '/notifications/read-all',
    {
      schema: {
        response: {
          200: MarkAllReadResponseSchema,
        },
      },
    },
    async (request) => {
      const userId = getRequestUserId(request)!;
      const updatedCount = await notificationService.markAllAsRead(userId);
      return { success: true, updated_count: updatedCount };
    }
  );

  // 4. PATCH /notifications/:notificationId/read - mark single notification as read
  fastify.patch<{ Params: { notificationId: string } }>(
    '/notifications/:notificationId/read',
    {
      schema: {
        params: Type.Object({
          notificationId: notificationIdSchema,
        }),
        response: {
          200: MarkReadResponseSchema,
        },
      },
    },
    async (request) => {
      const userId = getRequestUserId(request)!;
      const notification = await notificationService.markAsRead(userId, request.params.notificationId);
      return { success: true, notification };
    }
  );
};

export default notificationsRoutes;
