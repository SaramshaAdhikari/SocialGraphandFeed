import type { ISocialGraphApi, DataSourceType } from './types';
import { MockAdapter } from './mock/MockAdapter';
import { LiveClient } from './LiveClient';

export * from './types';
export * from './client';
export * from './mock/MockAdapter';
export * from './LiveClient';

function resolveDataSource(): DataSourceType {
  // Explicit override via environment variable
  const envDataSource = typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_DATA_SOURCE as string)
    : undefined;

  if (envDataSource === 'live') return 'live';
  if (envDataSource === 'mock') return 'mock';

  // In production builds, default to live backend; in dev default to mock fixtures
  const isProd = typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.PROD
    : false;

  return isProd ? 'live' : 'mock';
}

const activeDataSource = resolveDataSource();

let activeApi: ISocialGraphApi =
  activeDataSource === 'live' ? new LiveClient() : new MockAdapter({ simulatedLatencyMs: 30 });

export const api: ISocialGraphApi = new Proxy({} as ISocialGraphApi, {
  get(_target, prop: keyof ISocialGraphApi) {
    return activeApi[prop];
  },
});

export function setApiForTesting(customApi: ISocialGraphApi): void {
  activeApi = customApi;
}

export function getActiveDataSource(): DataSourceType {
  return activeApi.dataSource;
}

export function isMockMode(): boolean {
  return activeApi.dataSource === 'mock';
}

export function useApi(): ISocialGraphApi {
  return api;
}
