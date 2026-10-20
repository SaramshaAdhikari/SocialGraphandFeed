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
  SESSION_SECRET: string;
  WEB_ORIGIN: string;
  API_ORIGIN?: string;
  TRUST_PROXY: boolean | string | string[];
  LOG_LEVEL: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  RATE_LIMIT_LOGIN_MAX: number;
  RATE_LIMIT_LOGIN_WINDOW_SEC: number;
  RATE_LIMIT_REGISTER_MAX: number;
  RATE_LIMIT_REGISTER_WINDOW_SEC: number;
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
  if (nodeEnv === 'production' && (env.DEV_ADMIN_BOOTSTRAP?.toLowerCase() === 'true' || env.DEV_ADMIN_PASSWORD === 'admin')) {
    throw new Error('Development administrator bootstrap/default credentials cannot be configured in production.');
  }
  if (nodeEnv === 'production' && (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32 || /^(change-me|admin|development)/i.test(env.SESSION_SECRET))) throw new Error('SESSION_SECRET must be a unique secret of at least 32 characters in production.');
  if (nodeEnv === 'production') {
    for (const name of ['MONGODB_URI', 'MONGODB_DB_NAME', 'REDIS_URL'] as const) {
      if (!env[name]?.trim()) throw new Error(`${name} is required when NODE_ENV=production.`);
    }
    if (env.DEV_USER_BYPASS?.toLowerCase() === 'true') {
      throw new Error('DEV_USER_BYPASS cannot be enabled when NODE_ENV=production.');
    }
    if (!env.WEB_ORIGIN || !env.WEB_ORIGIN.startsWith('https://')) throw new Error('WEB_ORIGIN must be an HTTPS origin in production.');
    if (env.API_ORIGIN && !env.API_ORIGIN.startsWith('https://')) throw new Error('API_ORIGIN must be an HTTPS origin in production.');
  }

  const port = Number(env.PORT || 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  const mongoUri = env.MONGODB_URI || (nodeEnv === 'test' ? (env.MONGODB_TEST_URI || 'mongodb://localhost:27018') : (nodeEnv === 'production' ? '' : 'mongodb://localhost:27017'));
  const redisUrl = env.REDIS_URL || (nodeEnv === 'test' ? (env.REDIS_TEST_URL || 'redis://localhost:6380') : (nodeEnv === 'production' ? '' : 'redis://localhost:6379'));
  if (nodeEnv === 'production') {
    try {
      if (!['mongodb:', 'mongodb+srv:'].includes(new URL(mongoUri).protocol)) throw new Error();
      if (!['redis:', 'rediss:'].includes(new URL(redisUrl).protocol)) throw new Error();
    } catch {
      throw new Error('MONGODB_URI and REDIS_URL must be valid MongoDB and Redis URLs in production.');
    }
  }

  let trustProxy: boolean | string | string[] = false;
  if (env.TRUST_PROXY) {
    const rawTrust = env.TRUST_PROXY.trim();
    if (rawTrust === 'true' || rawTrust === '1') {
      trustProxy = true;
    } else if (rawTrust === 'false' || rawTrust === '0') {
      trustProxy = false;
    } else if (rawTrust.includes(',')) {
      trustProxy = rawTrust.split(',').map((s) => s.trim()).filter(Boolean);
    } else {
      trustProxy = rawTrust;
    }
  }

  const loginMax = Number(env.RATE_LIMIT_LOGIN_MAX || 5);
  const loginWindowSec = Number(env.RATE_LIMIT_LOGIN_WINDOW_SEC || 60);
  const registerMax = Number(env.RATE_LIMIT_REGISTER_MAX || 3);
  const registerWindowSec = Number(env.RATE_LIMIT_REGISTER_WINDOW_SEC || 60);

  if (!Number.isInteger(loginMax) || loginMax < 1) throw new Error('RATE_LIMIT_LOGIN_MAX must be a positive integer.');
  if (!Number.isInteger(loginWindowSec) || loginWindowSec < 1) throw new Error('RATE_LIMIT_LOGIN_WINDOW_SEC must be a positive integer.');
  if (!Number.isInteger(registerMax) || registerMax < 1) throw new Error('RATE_LIMIT_REGISTER_MAX must be a positive integer.');
  if (!Number.isInteger(registerWindowSec) || registerWindowSec < 1) throw new Error('RATE_LIMIT_REGISTER_WINDOW_SEC must be a positive integer.');

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    HOST: env.HOST || '0.0.0.0',
    MONGODB_URI: mongoUri,
    MONGODB_DB_NAME: env.MONGODB_DB_NAME || (nodeEnv === 'test' ? 'socialgraph_test' : 'socialgraph'),
    REDIS_URL: redisUrl,
    DEV_USER_BYPASS: env.DEV_USER_BYPASS === 'true' && nodeEnv !== 'production',
    SESSION_SECRET: env.SESSION_SECRET || 'development-only-session-secret-change-me',
    WEB_ORIGIN: env.WEB_ORIGIN || 'http://localhost:3000',
    API_ORIGIN: env.API_ORIGIN,
    TRUST_PROXY: trustProxy,
    LOG_LEVEL: (env.LOG_LEVEL || (nodeEnv === 'test' ? 'error' : 'info')) as AppConfig['LOG_LEVEL'],
    RATE_LIMIT_LOGIN_MAX: loginMax,
    RATE_LIMIT_LOGIN_WINDOW_SEC: loginWindowSec,
    RATE_LIMIT_REGISTER_MAX: registerMax,
    RATE_LIMIT_REGISTER_WINDOW_SEC: registerWindowSec,
  };
}

export const config = parseEnv();
