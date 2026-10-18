import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { connectMongo, disconnectMongo, getDb, checkMongoHealth } from '../src/db/mongo.js';
import { connectRedis, disconnectRedis, checkRedisHealth } from '../src/cache/redis.js';
import { HealthStatusSchema, ApiErrorResponseSchema } from '@socialgraph/shared';
import { Value } from '@sinclair/typebox/value';
import type { FastifyInstance } from 'fastify';
import { requiredTestServiceUrl } from './test-env.js';

describe('Milestone 1 — Foundation & Contract Baseline Integration Tests', () => {
  let app: FastifyInstance | undefined;
  let mongoReady = false;
  beforeAll(async () => {
    await connectMongo(requiredTestServiceUrl('MONGODB_TEST_URI'), 'socialgraph_foundation_test');
    mongoReady = true;
    const redis = connectRedis(requiredTestServiceUrl('REDIS_TEST_URL'));
    await redis.connect();

    // 2. Build Fastify application
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (mongoReady) await getDb().dropDatabase();
    await disconnectMongo();
    await disconnectRedis();
  });

  describe('1. API Schema Validation & Error Handling (RFC 7807)', () => {
    it('returns an RFC 7807 problem details response on 404 Not Found', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/non-existent-route',
      });

      expect(response.statusCode).toBe(404);
      const payload = response.json();

      expect(Value.Check(ApiErrorResponseSchema, payload)).toBe(true);
      expect(payload.code).toBe('NOT_FOUND');
      expect(payload.status).toBe(404);
      expect(payload.title).toBe('Resource Not Found');
      expect(payload.type).toContain('not-found');
    });

    it('enforces production security guard against X-Dev-User-Id header', async () => {
      // Temporarily simulate production environment
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const prodApp = buildApp();
      await prodApp.ready();

      const response = await prodApp.inject({
        method: 'GET',
        url: '/api/v1/health',
        headers: {
          'x-dev-user-id': 'usr_attacker',
        },
      });

      expect(response.statusCode).toBe(403);
      const payload = response.json();
      expect(payload.code).toBe('FORBIDDEN');
      expect(payload.detail).toContain('strictly disabled in production');

      await prodApp.close();
      process.env.NODE_ENV = prevEnv;
    });
  });

  describe('2. Durable MongoDB Writes & Retrieval', () => {
    it('successfully connects, writes a document, and reads back with durability', async () => {
      const mongoHealth = await checkMongoHealth();
      expect(mongoHealth.status).toBe('connected');
      expect(mongoHealth.latency_ms).toBeDefined();

      const db = getDb();
      const testCollection = db.collection('test_foundation_durability');

      const testId = `test_${Date.now()}`;
      const testRecord = {
        _id: testId as any,
        message: 'Meta TAO foundation durable write test',
        created_at: new Date(),
        payload: { cluster: 'primary', nodes: 3 },
      };

      // 1. Write document
      const insertResult = await testCollection.insertOne(testRecord);
      expect(insertResult.acknowledged).toBe(true);
      expect(insertResult.insertedId).toBe(testId);

      // 2. Read back document
      const foundRecord = await testCollection.findOne({ _id: testId as any });
      expect(foundRecord).not.toBeNull();
      expect(foundRecord?.message).toBe(testRecord.message);

      // 3. Update document
      const updateResult = await testCollection.updateOne(
        { _id: testId as any },
        { $set: { 'payload.status': 'verified' } }
      );
      expect(updateResult.modifiedCount).toBe(1);

      // 4. Clean up
      await testCollection.deleteOne({ _id: testId as any });
    });
  });

  describe('3. Redis Connectivity & Cache Pipeline', () => {
    it('successfully connects to Redis, executes PING, sets key with TTL, and reads back', async () => {
      const redisHealth = await checkRedisHealth();
      expect(redisHealth.status).toBe('connected');
      expect(redisHealth.latency_ms).toBeDefined();

      const redis = connectRedis();
      const testKey = `test:foundation:${Date.now()}`;
      const testVal = JSON.stringify({ verified: true, engine: 'redis-7' });

      // Set key with 60 second TTL
      await redis.set(testKey, testVal, 'EX', 60);

      // Read key
      const fetched = await redis.get(testKey);
      expect(fetched).toBe(testVal);
      expect(await redis.ttl(testKey)).toBeGreaterThan(0);

      // Delete key
      await redis.del(testKey);
    });
  });

  describe('4. End-to-End Health Endpoint & Contract Verification', () => {
    it('GET /api/v1/health returns 200 and matches the shared HealthStatusSchema', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      expect(response.statusCode).toBe(200);
      const payload = response.json();

      // Strict validation against shared TypeBox schema
      const isValid = Value.Check(HealthStatusSchema, payload);
      if (!isValid) {
        const errors = [...Value.Errors(HealthStatusSchema, payload)];
        console.error('Schema validation errors:', errors);
      }
      expect(isValid).toBe(true);

      expect(payload.status).toBe('ok');
      expect(payload.services.mongodb.status).toBe('connected');
      expect(payload.services.redis.status).toBe('connected');
      expect(payload.version).toBe('0.1.0');
    });

    it('GET /api/v1/metrics returns system metrics and memory stats', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/metrics',
      });

      expect(response.statusCode).toBe(200);
      const payload = response.json();
      expect(payload.uptime_seconds).toBeGreaterThanOrEqual(0);
      expect(payload.memory.rss_mb).toBeGreaterThan(0);
      expect(payload.node_version).toBe(process.version);
    });
  });
});
