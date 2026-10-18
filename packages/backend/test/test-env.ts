export function requiredTestServiceUrl(name: 'MONGODB_TEST_URI' | 'REDIS_TEST_URL'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set to an explicitly provisioned test service; refusing to use a developer default.`);
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL for the isolated local test services.`);
  }
  const expected = name === 'MONGODB_TEST_URI'
    ? { protocol: 'mongodb:', port: process.env.MONGODB_TEST_HOST_PORT || '27018', service: 'mongodb-test', servicePort: '27017' }
    : { protocol: 'redis:', port: process.env.REDIS_TEST_HOST_PORT || '6380', service: 'redis-test', servicePort: '6379' };
  const isLocalHost = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname) && parsed.port === expected.port;
  const isTestService = parsed.hostname === expected.service && parsed.port === expected.servicePort;
  if (
    parsed.protocol !== expected.protocol ||
    (!isLocalHost && !isTestService)
  ) {
    throw new Error(`${name} must target the isolated local test service at ${expected.port} or the Compose service ${expected.service}; refusing non-test data services.`);
  }
  return value;
}

