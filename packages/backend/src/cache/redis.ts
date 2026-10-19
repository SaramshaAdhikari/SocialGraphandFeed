import { Redis } from 'ioredis';
import { config } from '../config/env.js';

let redisClient: Redis | null = null;
let isConnected = false;
let lastError: string | null = null;

export function connectRedis(url = config.REDIS_URL): Redis {
  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis(url, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      // Exponential backoff with a cap of 2000ms
      return Math.min(times * 50, 2000);
    },
    enableOfflineQueue: false, // Prevents queuing unbound commands when Redis is down
    lazyConnect: true,
  });

  redisClient.on('connect', () => {
    isConnected = true;
    lastError = null;
  });

  redisClient.on('ready', () => {
    isConnected = true;
    lastError = null;
  });

  redisClient.on('error', (err) => {
    isConnected = false;
    lastError = err?.message || 'Redis error';
  });

  redisClient.on('close', () => {
    isConnected = false;
  });

  redisClient.on('reconnecting', () => {
    isConnected = false;
  });

  return redisClient;
}

export async function ensureRedisConnected(): Promise<Redis> {
  const client = connectRedis();
  if (client.status === 'wait') {
    await client.connect();
  }
  return client;
}

export function getRedisClient(): Redis | null {
  return redisClient;
}

export function isRedisConnected(): boolean {
  return isConnected;
}

export async function checkRedisHealth(): Promise<{ status: 'connected' | 'disconnected' | 'degraded'; latency_ms?: number; error?: string }> {
  if (!redisClient) {
    return { status: 'disconnected', error: 'Redis client not initialized' };
  }

  const start = performance.now();
  try {
    const res = await redisClient.ping();
    if (res === 'PONG') {
      const latency_ms = Number((performance.now() - start).toFixed(2));
      return { status: 'connected', latency_ms };
    }
    return { status: 'degraded', error: `Unexpected ping response: ${res}` };
  } catch (err: any) {
    return { status: 'disconnected', error: err?.message || lastError || 'Ping failed' };
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    }
    redisClient = null;
    isConnected = false;
  }
}
