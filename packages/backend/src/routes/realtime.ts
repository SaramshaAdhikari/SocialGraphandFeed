import type { FastifyPluginAsync } from 'fastify';
import { getRequestUserId, requireIdentity } from './identity.js';
import { realtimeEventBus } from '../realtime/EventBus.js';

const realtimeRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/realtime/events', { preHandler: requireIdentity }, async (request, reply) => {
    const userId = getRequestUserId(request)!;
    const response = reply.raw;
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    response.write(': connected\n\n');

    const unsubscribe = realtimeEventBus.subscribe(userId, (event) => {
      response.write(`id: ${event.event_id}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    });
    const keepAlive = setInterval(() => response.write(': keep-alive\n\n'), 20_000);
    request.raw.on('close', () => {
      clearInterval(keepAlive);
      unsubscribe();
    });
    await new Promise<void>((resolve) => request.raw.on('close', resolve));
  });
};

export default realtimeRoutes;
