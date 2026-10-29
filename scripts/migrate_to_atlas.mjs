#!/usr/bin/env node
import { MongoClient } from 'mongodb';
import { ensureIndexes } from '../packages/backend/dist/db/indexes.js';
import dotenv from 'dotenv';

dotenv.config();

function redactMongoUri(uri) {
  if (!uri) return 'undefined';
  return uri.replace(/:([^:@]+)@/, ':***@');
}

function parseCliArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    sourceUri: process.env.SOURCE_MONGODB_URI || 'mongodb://127.0.0.1:27017',
    sourceDbName: process.env.SOURCE_DB_NAME || 'socialgraph',
    targetUri: process.env.TARGET_MONGODB_URI || process.env.MONGODB_URI || '',
    targetDbName: process.env.TARGET_DB_NAME || 'socialgraph',
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--source=')) {
      options.sourceUri = arg.split('=')[1];
    } else if (arg.startsWith('--target=')) {
      options.targetUri = arg.split('=')[1];
    } else if (arg.startsWith('--db=')) {
      options.targetDbName = arg.split('=')[1];
    }
  }

  return options;
}

const MIGRATABLE_COLLECTIONS = [
  'users',
  'posts',
  'comments',
  'follows',
  'communities',
  'community_memberships',
  'post_votes',
  'post_saves',
  'feed_inboxes',
  'notifications',
  'messages',
  'conversations',
  'reports',
];

async function main() {
  const { dryRun, sourceUri, sourceDbName, targetUri, targetDbName } = parseCliArgs();

  console.log('====================================================');
  console.log('  SocialGraph MongoDB Atlas Migration Tool');
  console.log('====================================================');
  console.log(`Source : ${redactMongoUri(sourceUri)} [${sourceDbName}]`);
  console.log(`Target : ${redactMongoUri(targetUri)} [${targetDbName}]`);
  console.log(`Mode   : ${dryRun ? 'DRY RUN (Read-Only Analysis)' : 'LIVE MIGRATION (Idempotent Upsert)'}`);
  console.log('====================================================\n');

  if (!targetUri) {
    console.error('ERROR: No target MongoDB URI specified.');
    console.error('Provide via --target="mongodb+srv://..." or TARGET_MONGODB_URI in environment.\n');
    process.exit(1);
  }

  // Prevent migrating into self
  if (sourceUri === targetUri) {
    console.error('ERROR: Source URI and Target URI are identical. Aborting to prevent cycle.\n');
    process.exit(1);
  }

  const sourceClient = new MongoClient(sourceUri);
  const targetClient = new MongoClient(targetUri);

  try {
    console.log('1. Connecting to source database...');
    await sourceClient.connect();
    const sourceDb = sourceClient.db(sourceDbName);
    await sourceDb.command({ ping: 1 });
    console.log('   ✓ Source database connected successfully.');

    console.log('2. Connecting to target Atlas database...');
    await targetClient.connect();
    const targetDb = targetClient.db(targetDbName);
    await targetDb.command({ ping: 1 });
    console.log('   ✓ Target Atlas database connected successfully.');

    if (!dryRun) {
      console.log('3. Ensuring schema indexes on target database...');
      await ensureIndexes(targetDb);
      console.log('   ✓ Target database indexes verified / created.');
    } else {
      console.log('3. [DRY RUN] Skipping index creation on target database.');
    }

    console.log('\n4. Processing Collections:');
    console.log('------------------------------------------------------------------------------------------------------------------------');
    console.log(
      `${'Collection'.padEnd(23)} | ${'Source'.padStart(7)} | ${'Target (Pre)'.padStart(12)} | ${'Inserted'.padStart(9)} | ${'Skipped'.padStart(8)} | ${'Conflict'.padStart(9)} | ${'Failed'.padStart(7)} | ${'Status'}`
    );
    console.log('------------------------------------------------------------------------------------------------------------------------');

    let totalSourceDocs = 0;
    let totalTargetDocsPre = 0;
    let totalInsertedDocs = 0;
    let totalSkippedDocs = 0;
    let totalConflictedDocs = 0;
    let totalFailedDocs = 0;

    const MAX_RETRIES = 3;

    function isTransientError(err) {
      if (!err) return false;
      if (err.code === 16500) return true; // Rate limiting / TooManyRequests
      if (err.name === 'MongoNetworkTimeoutError') return true;
      if (/rate\s*limit|toomanyrequests|too many requests|throttl/i.test(err.message || '')) return true;
      return false;
    }

    function isAuthError(err) {
      if (!err) return false;
      if (err.code === 18 || err.codeName === 'AuthenticationFailed') return true;
      if (/authentication failed|unauthorized|auth error/i.test(err.message || '')) return true;
      return false;
    }

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    for (const colName of MIGRATABLE_COLLECTIONS) {
      const srcCol = sourceDb.collection(colName);
      const tgtCol = targetDb.collection(colName);

      const srcCount = await srcCol.countDocuments({});
      const tgtCountPre = await tgtCol.countDocuments({});
      totalSourceDocs += srcCount;
      totalTargetDocsPre += tgtCountPre;

      if (srcCount === 0) {
        console.log(
          `${colName.padEnd(23)} | ${String(srcCount).padStart(7)} | ${String(tgtCountPre).padStart(12)} | ${'0'.padStart(9)} | ${'0'.padStart(8)} | ${'0'.padStart(9)} | ${'0'.padStart(7)} | Empty in source`
        );
        continue;
      }

      if (dryRun) {
        console.log(
          `${colName.padEnd(23)} | ${String(srcCount).padStart(7)} | ${String(tgtCountPre).padStart(12)} | ${String(srcCount).padStart(9)} | ${'0'.padStart(8)} | ${'0'.padStart(9)} | ${'0'.padStart(7)} | [DRY RUN] Would sync`
        );
        continue;
      }

      // Stream documents and perform idempotent upsert with conflict handling & bounded backoff
      const cursor = srcCol.find({});
      const batchSize = 250;
      let batch = [];
      let colInserted = 0;
      let colSkipped = 0;
      let colConflicted = 0;
      let colFailed = 0;

      async function executeBatch(ops) {
        if (!ops || ops.length === 0) return { inserted: 0, skipped: 0, conflicted: 0, failed: 0 };

        let attempt = 0;
        while (true) {
          try {
            const res = await tgtCol.bulkWrite(ops, { ordered: false });
            const inserted = res.upsertedCount || 0;
            const matched = res.matchedCount || (ops.length - inserted);
            return {
              inserted,
              skipped: matched,
              conflicted: 0,
              failed: 0,
            };
          } catch (bulkErr) {
            // Unrecoverable authentication error - stop immediately
            if (isAuthError(bulkErr)) {
              console.error(`\n❌ [FATAL] Authentication error during migration: ${bulkErr.message}`);
              throw bulkErr;
            }

            // Transient error or rate limiting - bounded exponential backoff
            if (isTransientError(bulkErr) && attempt < MAX_RETRIES) {
              attempt++;
              const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
              console.warn(`  ⏳ [Backoff] ${colName}: Rate-limited or network timeout. Retrying in ${backoffMs}ms (attempt ${attempt}/${MAX_RETRIES})...`);
              await sleep(backoffMs);
              continue;
            }

            // MongoDB bulk write error: inspect individual write errors
            if (bulkErr.name === 'MongoBulkWriteError') {
              const inserted = bulkErr.result?.nUpserted || 0;
              const matched = bulkErr.result?.nMatched || 0;
              const writeErrors = bulkErr.writeErrors || [];
              let conflicted = 0;
              let failed = 0;

              for (const we of writeErrors) {
                if (we.code === 11000) {
                  conflicted++;
                } else {
                  failed++;
                }
              }

              console.warn(`  ⚠️  [Conflict/Error] ${colName}: ${conflicted} conflict(s), ${failed} failure(s) in batch of ${ops.length}.`);
              for (const we of writeErrors.slice(0, 3)) {
                console.warn(`      - Index ${we.index} (code ${we.code}): ${we.errmsg}`);
              }

              return {
                inserted,
                skipped: matched,
                conflicted,
                failed,
              };
            }

            // Other unrecoverable error
            throw bulkErr;
          }
        }
      }

      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        batch.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $setOnInsert: doc },
            upsert: true,
          },
        });

        if (batch.length >= batchSize) {
          const res = await executeBatch(batch);
          colInserted += res.inserted;
          colSkipped += res.skipped;
          colConflicted += res.conflicted;
          colFailed += res.failed;
          batch = [];
        }
      }

      if (batch.length > 0) {
        const res = await executeBatch(batch);
        colInserted += res.inserted;
        colSkipped += res.skipped;
        colConflicted += res.conflicted;
        colFailed += res.failed;
      }

      totalInsertedDocs += colInserted;
      totalSkippedDocs += colSkipped;
      totalConflictedDocs += colConflicted;
      totalFailedDocs += colFailed;

      let colStatus = '✓ Up-to-date';
      if (colFailed > 0) {
        colStatus = `❌ ${colFailed} Failed`;
      } else if (colConflicted > 0) {
        colStatus = `⚠️ ${colConflicted} Conflicted`;
      } else if (colInserted > 0) {
        colStatus = `✓ ${colInserted} Inserted`;
      }

      console.log(
        `${colName.padEnd(23)} | ${String(srcCount).padStart(7)} | ${String(tgtCountPre).padStart(12)} | ${String(colInserted).padStart(9)} | ${String(colSkipped).padStart(8)} | ${String(colConflicted).padStart(9)} | ${String(colFailed).padStart(7)} | ${colStatus}`
      );
    }

    console.log('------------------------------------------------------------------------------------------------------------------------');
    console.log(`[Sessions]               | Skipped | Ephemeral sessions are excluded for security & isolation.`);
    console.log('------------------------------------------------------------------------------------------------------------------------');

    console.log('\n====================================================');
    console.log('  Migration Summary');
    console.log('====================================================');
    console.log(`Source Total Documents : ${totalSourceDocs}`);
    console.log(`Target Prior Documents : ${totalTargetDocsPre}`);
    console.log(`Newly Inserted Docs    : ${dryRun ? `(Dry Run: ~${totalSourceDocs})` : totalInsertedDocs}`);
    console.log(`Skipped / Existing Docs: ${dryRun ? 0 : totalSkippedDocs}`);
    console.log(`Conflicted Documents   : ${dryRun ? 0 : totalConflictedDocs}`);
    console.log(`Failed Documents       : ${dryRun ? 0 : totalFailedDocs}`);

    let statusText = 'SUCCESS (100% Clean Synchronization)';
    if (dryRun) {
      statusText = 'DRY RUN COMPLETE (No writes occurred)';
    } else if (totalFailedDocs > 0) {
      statusText = `FAILED (${totalFailedDocs} unrecoverable document write error(s) encountered)`;
    } else if (totalConflictedDocs > 0) {
      statusText = `PARTIAL SUCCESS (${totalConflictedDocs} document conflict(s) safely recorded)`;
    }
    console.log(`Final Status           : ${statusText}`);
    console.log('====================================================\n');

    if (!dryRun && totalFailedDocs > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('\nMigration terminated with error:', err.message);
    process.exit(1);
  } finally {
    await sourceClient.close();
    await targetClient.close();
  }
}

main();
