import dotenv from 'dotenv';
import path from 'path';

// Load .env file from workspace root or current directory
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

export interface AppConfig {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  HOST: string;
  MONGODB_URI: string;
  MONGODB_DB_NAME: string;
  REDIS_URL: string;
  DEV_USER_BYPASS: boolean;
  LOG_LEVEL: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
}

export function parseEnv(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const configuredNodeEnv = env.NODE_ENV?.toLowerCase();
  const configuredEnvironment = env.ENVIRONMENT?.toLowerCase();
  const rawNodeEnv = configuredNodeEnv === 'production' || configuredEnvironment === 'production'
    ? 'production'
    : configuredNodeEnv || configuredEnvironment || 'development';
  if (!['development', 'test', 'production'].includes(rawNodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production.');
  }
  const nodeEnv = rawNodeEnv as AppConfig['NODE_ENV'];
  if (nodeEnv === 'production') {
    for (const name of ['MONGODB_URI', 'MONGODB_DB_NAME', 'REDIS_URL'] as const) {
      if (!env[name]?.trim()) throw new Error(`${name} is required when NODE_ENV=production.`);
    }
    if (env.DEV_USER_BYPASS?.toLowerCase() === 'true') {
      throw new Error('DEV_USER_BYPASS cannot be enabled when NODE_ENV=production.');
    }
  }

  const port = Number(env.PORT || 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  const mongoUri = env.MONGODB_URI || (nodeEnv === 'production' ? '' : 'mongodb://localhost:27017');
  const redisUrl = env.REDIS_URL || (nodeEnv === 'production' ? '' : 'redis://localhost:6379');
  if (nodeEnv === 'production') {
    try {
      if (!['mongodb:', 'mongodb+srv:'].includes(new URL(mongoUri).protocol)) throw new Error();
      if (!['redis:', 'rediss:'].includes(new URL(redisUrl).protocol)) throw new Error();
    } catch {
      throw new Error('MONGODB_URI and REDIS_URL must be valid MongoDB and Redis URLs in production.');
    }
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    HOST: env.HOST || '0.0.0.0',
    MONGODB_URI: mongoUri,
    MONGODB_DB_NAME: env.MONGODB_DB_NAME || (nodeEnv === 'test' ? 'socialgraph_test' : 'socialgraph'),
    REDIS_URL: redisUrl,
    DEV_USER_BYPASS: env.DEV_USER_BYPASS === 'true' && nodeEnv !== 'production',
    LOG_LEVEL: (env.LOG_LEVEL || (nodeEnv === 'test' ? 'error' : 'info')) as AppConfig['LOG_LEVEL'],
  };
}

export const config = parseEnv();
