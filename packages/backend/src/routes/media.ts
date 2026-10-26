import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { AppError, MediaUploadResponseSchema, type MediaAttachment } from '@socialgraph/shared';
import { requireIdentity } from './identity.js';
import { mediaStorage } from '../services/storage/MediaStorageService.js';
import { RateLimitService } from '../services/RateLimitService.js';
import fs from 'node:fs';
import path from 'node:path';

const mediaRoutes: FastifyPluginAsync = async (fastify) => {
  const rateLimitService = new RateLimitService();

  // POST /api/v1/media/upload
  fastify.post(
    '/media/upload',
    {
      preHandler: requireIdentity,
      schema: {
        response: {
          200: MediaUploadResponseSchema,
        },
      },
    },
    async (request) => {
      // 1. Rate limiting: 30 media uploads per minute per IP / user
      await rateLimitService.checkOrThrow({
        action: 'media_upload',
        ip: request.ip,
        limit: 30,
        windowSeconds: 60,
        requestId: request.id,
      });

      if (!request.isMultipart()) {
        throw AppError.badRequest('Expected multipart/form-data request.');
      }

      const parts = request.parts();
      const savedAttachments: MediaAttachment[] = [];
      const MAX_FILES = 10;

      try {
        for await (const part of parts) {
          if (part.type === 'file') {
            if (savedAttachments.length >= MAX_FILES) {
              throw AppError.badRequest(`Cannot upload more than ${MAX_FILES} images per post.`);
            }

            const buffer = await part.toBuffer();
            const attachment = await mediaStorage.save({
              buffer,
              originalFilename: part.filename,
              mimeType: part.mimetype,
              sizeBytes: buffer.length,
            });

            savedAttachments.push(attachment);
          }
        }
      } catch (err: any) {
        // Cleanup already saved files if any failure happens midway
        for (const item of savedAttachments) {
          await mediaStorage.delete(item.url);
        }
        throw err;
      }

      if (savedAttachments.length === 0) {
        throw AppError.badRequest('No files were attached to the upload request.');
      }

      return {
        success: true,
        media: savedAttachments,
      };
    }
  );

  // Fallback GET /api/v1/media/file/:filename to directly serve uploaded media
  fastify.get<{ Params: { filename: string } }>(
    '/media/file/:filename',
    {
      schema: {
        params: Type.Object({
          filename: Type.String({ minLength: 1, maxLength: 256 }),
        }),
      },
    },
    async (request, reply) => {
      const sanitized = path.basename(request.params.filename);
      const filePath = path.join(mediaStorage.getUploadDir(), sanitized);

      if (!filePath.startsWith(mediaStorage.getUploadDir()) || !fs.existsSync(filePath)) {
        throw AppError.notFound(`Media file '${request.params.filename}' not found.`);
      }

      const ext = path.extname(sanitized).toLowerCase();
      const contentTypeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.avif': 'image/avif',
      };

      const contentType = contentTypeMap[ext] || 'application/octet-stream';
      reply.header('Content-Type', contentType);
      reply.header('Cache-Control', 'public, max-age=31536000, immutable');
      return reply.send(fs.createReadStream(filePath));
    }
  );
};

export default mediaRoutes;
