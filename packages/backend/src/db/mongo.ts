import { MongoClient, type Db } from 'mongodb';
import { config } from '../config/env.js';
import { ensureIndexes } from './indexes.js';
import { reconcileCommunityMemberCounts } from './membershipIntegrity.js';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(uri = config.MONGODB_URI, dbName = config.MONGODB_DB_NAME): Promise<{ client: MongoClient; db: Db }> {
  if (client && db) {
    // Tests and maintenance tools may select a different database on the same
    // Mongo client. Rebind explicitly instead of silently returning the first
    // database selected by this process.
    db = client.db(dbName);
    await ensureIndexes(db);
    await reconcileCommunityMemberCounts(db, client);
    return { client, db };
  }

  client = new MongoClient(uri, {
    maxPoolSize: 50,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  });

  await client.connect();
  db = client.db(dbName);

  await ensureIndexes(db);
  // `community_memberships` is the source of truth; repair stale display
  // counters before the API begins serving reads.
  await reconcileCommunityMemberCounts(db, client);

  return { client, db };
}

export function setDbForTesting(testDb: Db | null): void {
  db = testDb;
}

export function getDb(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectMongo() first.');
  }
  return db;
}

export function getMongoClient(): MongoClient | null {
  return client;
}

export async function checkMongoHealth(): Promise<{ status: 'connected' | 'disconnected'; latency_ms?: number; error?: string }> {
  if (!client || !db) {
    return { status: 'disconnected', error: 'Client not initialized' };
  }

  const start = performance.now();
  try {
    await db.command({ ping: 1 });
    const latency_ms = Number((performance.now() - start).toFixed(2));
    return { status: 'connected', latency_ms };
  } catch (err: any) {
    return { status: 'disconnected', error: err?.message || 'Ping failed' };
  }
}

export async function disconnectMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
