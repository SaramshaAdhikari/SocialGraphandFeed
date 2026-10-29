#!/usr/bin/env node
import { MongoClient } from 'mongodb';
import fs from 'node:fs';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

function redactUri(uri) {
  if (!uri) return 'undefined';
  return uri.replace(/:([^:@]+)@/, ':***@');
}

function parseCliArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017',
    dbName: process.env.MONGODB_DB_NAME || 'socialgraph',
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--uri=')) {
      options.mongoUri = arg.split('=')[1];
    } else if (arg.startsWith('--db=')) {
      options.dbName = arg.split('=')[1];
    }
  }

  return options;
}

async function main() {
  const { dryRun, mongoUri, dbName } = parseCliArgs();

  console.log('====================================================');
  console.log('  SocialGraph Media Migration Utility');
  console.log('====================================================');
  console.log(`Target DB : ${redactUri(mongoUri)} [${dbName}]`);
  console.log(`Mode      : ${dryRun ? 'DRY RUN (Analysis Only)' : 'LIVE MIGRATION'}`);
  console.log('====================================================\n');

  // Check Cloudinary configuration
  const hasCloudinary = Boolean(process.env.CLOUDINARY_URL) || (
    Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
    Boolean(process.env.CLOUDINARY_API_KEY) &&
    Boolean(process.env.CLOUDINARY_API_SECRET)
  );

  if (!dryRun && !hasCloudinary) {
    console.error('ERROR: Cloudinary credentials not detected in environment.');
    console.error('Provide CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET in .env to perform live migration.');
    console.error('You can still run this utility with --dry-run to analyze local media usage.\n');
    process.exit(1);
  }

  if (hasCloudinary) {
    if (process.env.CLOUDINARY_URL) {
      cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
    } else {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
    }
  }

  const client = new MongoClient(mongoUri);
  const uploadsDir = path.resolve(process.cwd(), 'packages/backend/public/uploads');

  try {
    await client.connect();
    const db = client.db(dbName);
    const postsCol = db.collection('posts');

    // Find all posts that have attachments with relative /uploads/ URL
    const query = {
      'attachments.url': { $regex: '^/uploads/' },
    };

    const localPosts = await postsCol.find(query).toArray();

    console.log(`Found ${localPosts.length} posts referencing local /uploads/ media.\n`);

    if (localPosts.length === 0) {
      console.log('All posts in database already use remote HTTPS / CDN URLs. No migration needed.');
      return;
    }

    let scannedCount = 0;
    let migratedCount = 0;
    let missingFilesCount = 0;

    for (const post of localPosts) {
      let postModified = false;
      const updatedAttachments = [];

      for (const att of post.attachments || []) {
        if (!att.url || !att.url.startsWith('/uploads/')) {
          updatedAttachments.push(att);
          continue;
        }

        scannedCount++;
        const filename = decodeURIComponent(att.url.replace(/^\/uploads\//, ''));
        const localPath = path.join(uploadsDir, filename);
        const exists = fs.existsSync(localPath);

        if (!exists) {
          console.warn(`  [MISSING] Post ${post._id}: File not found on disk: ${localPath}`);
          missingFilesCount++;
          updatedAttachments.push(att);
          continue;
        }

        const stats = fs.statSync(localPath);
        const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

        if (dryRun) {
          console.log(`  [DRY RUN] Post ${post._id}: Found ${filename} (${sizeMb} MB) -> would upload to Cloudinary.`);
          updatedAttachments.push(att);
          continue;
        }

        // Upload to Cloudinary
        console.log(`  Uploading ${filename} (${sizeMb} MB) to Cloudinary...`);
        const fileBuffer = fs.readFileSync(localPath);

        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'socialgraph',
              resource_type: 'image',
            },
            (err, res) => {
              if (err || !res) reject(err || new Error('Upload returned null result'));
              else resolve(res);
            }
          );
          stream.end(fileBuffer);
        });

        console.log(`  ✓ Uploaded: ${uploadResult.secure_url}`);
        updatedAttachments.push({
          ...att,
          url: uploadResult.secure_url,
          width: uploadResult.width || att.width,
          height: uploadResult.height || att.height,
        });

        postModified = true;
        migratedCount++;
      }

      if (!dryRun && postModified) {
        await postsCol.updateOne(
          { _id: post._id },
          { $set: { attachments: updatedAttachments } }
        );
      }
    }

    console.log('\n====================================================');
    console.log('  Media Migration Summary');
    console.log('====================================================');
    console.log(`Posts Inspected   : ${localPosts.length}`);
    console.log(`Attachments Found : ${scannedCount}`);
    console.log(`Migrated to Cloud : ${migratedCount}`);
    console.log(`Missing on Disk   : ${missingFilesCount}`);
    console.log(`Status            : ${dryRun ? 'DRY RUN COMPLETE' : 'SUCCESS'}`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Media migration error:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
