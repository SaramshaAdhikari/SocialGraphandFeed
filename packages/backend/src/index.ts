import { buildApp } from './app.js';
import { config } from './config/env.js';
import { connectMongo, disconnectMongo } from './db/mongo.js';
import { connectRedis, disconnectRedis } from './cache/redis.js';

async function main() {
  const app = buildApp();

  try {
    // 1. Initialize MongoDB connection
    app.log.info({ uri: config.MONGODB_URI, db: config.MONGODB_DB_NAME }, 'Connecting to MongoDB...');
    try {
      await connectMongo();
      app.log.info('MongoDB connected successfully.');
    } catch (err: any) {
      app.log.warn({ err: err?.message }, 'MongoDB initial connection failed. Will retry on demand.');
    }

    // 2. Initialize Redis connection
    app.log.info({ url: config.REDIS_URL }, 'Connecting to Redis...');
    try {
      const redis = connectRedis();
      await redis.connect().catch((err) => {
        app.log.warn({ err: err?.message }, 'Redis initial connection failed. Fallback mode active.');
      });
    } catch (err: any) {
      app.log.warn({ err: err?.message }, 'Redis initialization failed.');
    }

    // 3. Start Fastify server
    await app.listen({ port: config.PORT, host: config.HOST });
    app.log.info(`🚀 Backend server listening on http://${config.HOST}:${config.PORT}`);
  } catch (err) {
    app.log.fatal(err, 'Server failed to start');
    process.exit(1);
  }

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}. Shutting down gracefully...`);
    try {
      await app.close();
      await disconnectMongo();
      await disconnectRedis();
      app.log.info('Graceful shutdown completed.');
      process.exit(0);
    } catch (err) {
      app.log.error(err, 'Error during graceful shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();
