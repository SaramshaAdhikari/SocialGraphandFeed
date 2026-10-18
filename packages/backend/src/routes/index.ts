import type { FastifyPluginAsync } from 'fastify';
import healthRoutes from './health.js';
import feedRoutes from './feed.js';
import postsRoutes from './posts.js';
import usersRoutes from './users.js';
import communitiesRoutes from './communities.js';
import searchRoutes from './search.js';

const apiRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(healthRoutes);
  await fastify.register(feedRoutes);
  await fastify.register(postsRoutes);
  await fastify.register(usersRoutes);
  await fastify.register(communitiesRoutes);
  await fastify.register(searchRoutes);
};

export default apiRoutes;
