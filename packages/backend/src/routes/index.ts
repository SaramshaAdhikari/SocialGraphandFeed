import type { FastifyPluginAsync } from 'fastify';
import healthRoutes from './health.js';
import feedRoutes from './feed.js';
import postsRoutes from './posts.js';
import usersRoutes from './users.js';
import communitiesRoutes from './communities.js';
import searchRoutes from './search.js';
import authRoutes from './auth.js';
import notificationsRoutes from './notifications.js';
import moderationRoutes from './moderation.js';
import realtimeRoutes from './realtime.js';

const apiRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(healthRoutes);
  await fastify.register(authRoutes);
  await fastify.register(feedRoutes);
  await fastify.register(postsRoutes);
  await fastify.register(usersRoutes);
  await fastify.register(communitiesRoutes);
  await fastify.register(searchRoutes);
  await fastify.register(notificationsRoutes);
  await fastify.register(moderationRoutes);
  await fastify.register(realtimeRoutes);
};

export default apiRoutes;
