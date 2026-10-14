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

function parseEnv(): AppConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'test' | 'production';

  return {
    NODE_ENV: nodeEnv,
    PORT: Number(process.env.PORT || 4000),
    HOST: process.env.HOST || '0.0.0.0',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || (nodeEnv === 'test' ? 'socialgraph_test' : 'socialgraph'),
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    DEV_USER_BYPASS: process.env.DEV_USER_BYPASS === 'true' && nodeEnv !== 'production',
    LOG_LEVEL: (process.env.LOG_LEVEL || (nodeEnv === 'test' ? 'error' : 'info')) as AppConfig['LOG_LEVEL'],
  };
}

export const config = parseEnv();
