import type { FastifyPluginAsync } from 'fastify';
import healthRoutes from './health.js';

const apiRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(healthRoutes);
};

export default apiRoutes;
