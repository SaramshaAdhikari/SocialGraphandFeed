#!/usr/bin/env node
import { MongoClient } from 'mongodb';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

function redactMongoUri(uri) {
  if (!uri) return 'undefined';
  return uri.replace(/:([^:@]+)@/, ':***@');
}

async function runBackup() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGODB_DB_NAME || 'socialgraph';

  console.log('====================================================');
  console.log('  SocialGraph Database Backup Utility');
  console.log('====================================================');
  console.log(`Target: ${redactMongoUri(mongoUri)} [${dbName}]`);

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(dbName);

    // Ping to ensure connectivity
    await db.command({ ping: 1 });
    console.log('Successfully connected to database.\n');

    // Create timestamped backup directory
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const backupDir = path.resolve(process.cwd(), 'backups', `backup-${timestamp}`);
    fs.mkdirSync(backupDir, { recursive: true });

    // Retrieve collection names
    const collections = await db.listCollections().toArray();
    const colNames = collections.map((c) => c.name).filter((name) => !name.startsWith('system.'));

    console.log(`Found ${colNames.length} collections to archive:`);
    console.log(`Destination: ${backupDir}\n`);

    const stats = {};
    let totalDocs = 0;

    for (const name of colNames) {
      const col = db.collection(name);
      const docs = await col.find({}).toArray();
      const filePath = path.join(backupDir, `${name}.json`);

      // Write collection JSON (pretty formatted)
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf8');

      // Verification: read back and validate
      const readBack = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (readBack.length !== docs.length) {
        throw new Error(`Backup verification failed for ${name}: wrote ${docs.length} docs, read back ${readBack.length}`);
      }

      stats[name] = docs.length;
      totalDocs += docs.length;
      console.log(`  ✓ ${name.padEnd(25)} : ${String(docs.length).padStart(5)} documents -> ${name}.json`);
    }

    // Write metadata manifest
    const manifest = {
      created_at: now.toISOString(),
      timestamp,
      database_name: dbName,
      total_collections: colNames.length,
      total_documents: totalDocs,
      collections: stats,
      node_version: process.version,
      platform: process.platform,
    };
    fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

    console.log('\n====================================================');
    console.log(`Backup completed successfully!`);
    console.log(`Total Collections : ${colNames.length}`);
    console.log(`Total Documents   : ${totalDocs}`);
    console.log(`Archive Location  : ${backupDir}`);
    console.log('====================================================');
  } catch (err) {
    console.error('\nBackup failed with error:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

runBackup();
