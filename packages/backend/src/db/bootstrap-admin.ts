import { MongoClient } from 'mongodb';
import { COLLECTIONS } from './collections.js';
import type { UserDoc } from './types.js';
import { hashPassword } from '../services/AuthService.js';
import { config } from '../config/env.js';

export async function promoteExistingAlexAdmin(db: import('mongodb').Db, password: string, resetPassword = false) {
  const users = db.collection<UserDoc>(COLLECTIONS.USERS);
  const existing = await users.findOne({ username: 'alex_dev' });
  if (!existing) throw new Error('Existing alex_dev account was not found. Seed the database first.');
  const set: Partial<UserDoc> = {};
  if (existing.role !== 'admin') set.role = 'admin';
  if (!existing.password_hash || resetPassword) set.password_hash = await hashPassword(password);
  if (Object.keys(set).length) { set.updated_at = new Date(); await users.updateOne({ _id: existing._id }, { $set: set }); }
  return { id: existing._id, credentialsProvisioned: !existing.password_hash || resetPassword, rolePromoted: existing.role !== 'admin' };
}

export function assertDevelopmentBootstrapAllowed(env: NodeJS.ProcessEnv): void {
  if (env.NODE_ENV !== 'development' || env.ENVIRONMENT?.toLowerCase() === 'production' || env.DEV_ADMIN_BOOTSTRAP !== 'true') throw new Error('Admin bootstrap is development-only; set NODE_ENV=development and DEV_ADMIN_BOOTSTRAP=true explicitly.');
}

async function bootstrap() {
  assertDevelopmentBootstrapAllowed(process.env);
  const password = process.env.DEV_ADMIN_PASSWORD || 'admin';
  const client = new MongoClient(config.MONGODB_URI);
  await client.connect();
  try {
    const db = client.db(config.MONGODB_DB_NAME);
    const result = await promoteExistingAlexAdmin(db, password, process.env.DEV_ADMIN_RESET_PASSWORD === 'true');
    console.log(`Existing alex_dev account retained (${result.rolePromoted ? 'administrator role promoted' : 'administrator role unchanged'}; ${result.credentialsProvisioned ? 'development credentials provisioned' : 'existing credentials preserved'}).`);
  } finally { await client.close(); }
}
if (process.argv[1]?.endsWith('bootstrap-admin.ts') || process.argv[1]?.endsWith('bootstrap-admin.js')) {
  bootstrap().catch((error) => { console.error(error); process.exitCode = 1; });
}
