import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  CreateReportInputSchema,
  ReportResponseSchema,
  ReportsListQuerySchema,
  ReportsListResponseSchema,
  AdminResolveReportInputSchema,
  type CreateReportInput,
  type ReportsListQuery,
  type AdminResolveReportInput,
} from '@socialgraph/shared';
import { ModerationService } from '../services/ModerationService.js';
import { PostService } from '../services/PostService.js';
import { RateLimitService } from '../services/RateLimitService.js';
import { getRequestUserId, requireIdentity, requireAdmin } from './identity.js';

const reportIdSchema = Type.String({ minLength: 1, maxLength: 128, pattern: '^[A-Za-z0-9_-]+$' });

const moderationRoutes: FastifyPluginAsync = async (fastify) => {
  const moderationService = new ModerationService();
  const postService = new PostService();
  const rateLimitService = new RateLimitService();

  // 1. User submits a report
  fastify.post<{ Body: CreateReportInput }>(
    '/reports',
    {
      preHandler: requireIdentity,
      schema: {
        body: CreateReportInputSchema,
        response: {
          201: ReportResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = getRequestUserId(request)!;

      // Rate limit: 5 reports per minute per user/IP
      await rateLimitService.checkOrThrow({
        action: 'report',
        ip: request.ip,
        userId,
        limit: 5,
        windowSeconds: 60,
        requestId: request.id,
      });

      const report = await moderationService.createReport(userId, request.body);
      reply.status(201);
      return report;
    }
  );

  // 2. Admin retrieves reports queue
  fastify.get<{ Querystring: ReportsListQuery }>(
    '/admin/reports',
    {
      preHandler: requireAdmin,
      schema: {
        querystring: ReportsListQuerySchema,
        response: {
          200: ReportsListResponseSchema,
        },
      },
    },
    async (request) => {
      return moderationService.getReports(request.query);
    }
  );

  // 3. Admin resolves or dismisses a report (optionally removing reported content)
  fastify.patch<{ Params: { reportId: string }; Body: AdminResolveReportInput }>(
    '/admin/reports/:reportId',
    {
      preHandler: requireAdmin,
      schema: {
        params: Type.Object({
          reportId: reportIdSchema,
        }),
        body: AdminResolveReportInputSchema,
        response: {
          200: ReportResponseSchema,
        },
      },
    },
    async (request) => {
      const adminUserId = getRequestUserId(request)!;
      return moderationService.resolveReport(
        adminUserId,
        request.params.reportId,
        request.body,
        postService
      );
    }
  );
};

export default moderationRoutes;
