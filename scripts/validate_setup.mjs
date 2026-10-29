#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { MongoClient } from 'mongodb';
import Redis from 'ioredis';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

function maskSecret(val) {
  if (!val) return '(not set)';
  if (val.length <= 4) return '***';
  return val.slice(0, 2) + '***' + val.slice(-2);
}

function redactUri(uri) {
  if (!uri) return '(not set)';
  return uri.replace(/:([^:@]+)@/, ':***@');
}

async function validateSetup() {
  console.log('====================================================');
  console.log('  SocialGraph Environment & Service Validator');
  console.log('====================================================\n');

  let errors = 0;
  let warnings = 0;

  // 1. Node.js Version Check
  const currentVersion = process.version;
  const major = parseInt(currentVersion.replace('v', '').split('.')[0], 10);
  if (major < 20) {
    console.error(`❌ [Node.js] Unsupported version ${currentVersion}. Required: Node.js >= 20.0.0.`);
    errors++;
  } else {
    console.log(`✓ [Node.js] Runtime version ${currentVersion} is compatible.`);
  }

  // 2. Environment File Check
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ [.env] Missing .env configuration file in workspace root.');
    console.error('   Hint: Copy .env.example to .env and configure credentials:');
    console.error('   cp .env.example .env');
    errors++;
  } else {
    console.log(`✓ [.env] Configuration file found at ${envPath}`);
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
  const mongoDbName = process.env.MONGODB_DB_NAME || 'socialgraph';
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const storageProvider = process.env.STORAGE_PROVIDER || (process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME ? 'cloudinary' : 'local');

  console.log('\nConfigured Environment Parameters:');
  console.log(`  PORT            : ${process.env.PORT || 4000}`);
  console.log(`  MONGODB_URI     : ${redactUri(mongoUri)}`);
  console.log(`  MONGODB_DB_NAME : ${mongoDbName}`);
  console.log(`  REDIS_URL       : ${redactUri(redisUrl)}`);
  console.log(`  SESSION_SECRET  : ${maskSecret(process.env.SESSION_SECRET)}`);
  console.log(`  STORAGE_PROVIDER: ${storageProvider}`);

  // 3. MongoDB Connectivity Check
  console.log('\nTesting MongoDB connectivity...');
  const isAtlas = mongoUri.includes('.mongodb.net') || mongoUri.startsWith('mongodb+srv:');
  const mongoClient = new MongoClient(mongoUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });

  try {
    const startMs = Date.now();
    await mongoClient.connect();
    const db = mongoClient.db(mongoDbName);
    const pingResult = await db.command({ ping: 1 });
    const elapsedMs = Date.now() - startMs;

    const collections = await db.listCollections().toArray();
    const typeLabel = isAtlas ? 'MongoDB Atlas Cluster (Shared Dev)' : 'Local MongoDB Instance';
    console.log(`✓ [MongoDB] ${typeLabel} reachable in ${elapsedMs}ms.`);
    console.log(`   Database '${mongoDbName}' contains ${collections.length} collections.`);
  } catch (err) {
    console.error(`❌ [MongoDB] Connection failed: ${err.message}`);
    if (isAtlas) {
      console.error('   Atlas Troubleshooting:');
      console.error('   1. Verify your current public IP is added to the Atlas Network Access allowlist.');
      console.error('   2. Verify your Atlas username and password in MONGODB_URI.');
      console.error('   3. Check that your network/firewall does not block outbound port 27017.');
    } else {
      console.error('   Local MongoDB Troubleshooting:');
      console.error('   1. Verify your local MongoDB service is running (e.g. net start MongoDB or mongod).');
      console.error('   2. Verify connection string targets mongodb://127.0.0.1:27017.');
    }
    errors++;
  } finally {
    try { await mongoClient.close(); } catch {}
  }

  // 4. Redis Connectivity Check
  console.log('\nTesting Redis connectivity...');
  const redis = new Redis(redisUrl, {
    connectTimeout: 4000,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });

  try {
    const startMs = Date.now();
    await redis.connect();
    const pingRes = await redis.ping();
    const elapsedMs = Date.now() - startMs;
    console.log(`✓ [Redis] Server reachable in ${elapsedMs}ms (Response: ${pingRes}).`);
  } catch (err) {
    console.error(`❌ [Redis] Connection failed: ${err.message}`);
    console.error('   Redis Troubleshooting:');
    console.error('   1. Ensure Redis is running locally (e.g. redis-server or Memurai on Windows).');
    console.error('   2. Verify REDIS_URL in .env matches your Redis host and port (default: redis://localhost:6379).');
    errors++;
  } finally {
    try { redis.disconnect(); } catch {}
  }

  // 5. Media Storage Check
  console.log('\nChecking Media Storage configuration...');
  if (storageProvider === 'cloudinary') {
    const hasUrl = Boolean(process.env.CLOUDINARY_URL);
    const hasKeys = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
    if (hasUrl || hasKeys) {
      console.log(`✓ [Storage] Cloudinary remote storage configured (${hasUrl ? 'CLOUDINARY_URL' : `Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`}).`);
    } else {
      console.warn('⚠️  [Storage] STORAGE_PROVIDER is set to cloudinary but credentials are missing. Falling back to local disk storage.');
      warnings++;
    }
  } else {
    const uploadDir = path.resolve(process.cwd(), 'packages/backend/public/uploads');
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const testFile = path.join(uploadDir, `.write_test_${Date.now()}`);
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log(`✓ [Storage] Local disk storage active (${uploadDir}) - Directory writable.`);
    } catch (err) {
      console.error(`❌ [Storage] Local upload directory is not writable: ${err.message}`);
      errors++;
    }
  }

  // 6. Project Workspaces & Builds
  console.log('\nVerifying Workspace Artifacts...');
  const sharedDist = path.resolve(process.cwd(), 'packages/shared/dist');
  const backendDist = path.resolve(process.cwd(), 'packages/backend/dist');
  if (!fs.existsSync(sharedDist)) {
    console.warn('⚠️  [Build] @socialgraph/shared not built. Run: npm run build --workspace=@socialgraph/shared');
    warnings++;
  } else {
    console.log('✓ [Build] @socialgraph/shared build artifacts verified.');
  }

  if (!fs.existsSync(backendDist)) {
    console.warn('⚠️  [Build] @socialgraph/backend not built. Run: npm run build --workspace=@socialgraph/backend');
    warnings++;
  } else {
    console.log('✓ [Build] @socialgraph/backend build artifacts verified.');
  }

  // Final Summary
  console.log('\n====================================================');
  console.log('  Validation Summary');
  console.log('====================================================');
  if (errors === 0) {
    console.log('🎉 Environment is READY for development!');
    if (warnings > 0) {
      console.log(`   (${warnings} non-blocking warning${warnings > 1 ? 's' : ''})`);
    }
    console.log('\nTo launch the application:');
    console.log('  npm run dev            (Runs backend + frontend concurrently)');
    console.log('  npm run dev:backend    (Runs backend API on http://localhost:4000)');
    console.log('  npm run dev:frontend   (Runs frontend UI on http://localhost:3000)\n');
    process.exit(0);
  } else {
    console.error(`❌ Validation failed with ${errors} error${errors > 1 ? 's' : ''}.`);
    console.error('Please resolve the errors above before launching the application.\n');
    process.exit(1);
  }
}

validateSetup();
