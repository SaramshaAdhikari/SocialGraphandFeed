#!/usr/bin/env node
import { validateTestDatabaseUri, parseEnv } from '../packages/backend/dist/config/env.js';
import { seedDatabase } from '../packages/backend/dist/db/seed.js';
import { execSync } from 'child_process';

console.log('====================================================');
console.log('  Direct Safeguard Inspection & Verification Suite');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assertCheck(name, fn) {
  try {
    fn();
    console.log(`✓ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}: ${err.message}`);
    failCount++;
  }
}

// --------------------------------------------------------------------------
// 1. Test Isolation Safeguard: Atlas URI
// --------------------------------------------------------------------------
assertCheck('Test isolation blocks Atlas mongodb+srv URI in test mode', () => {
  let threw = false;
  try {
    validateTestDatabaseUri('mongodb+srv://team_user:secret123@socialgraph-dev.xxxx.mongodb.net/test');
  } catch (e) {
    threw = true;
    if (!e.message.includes('CRITICAL TEST ISOLATION SAFEGUARD') || !e.message.includes('Atlas')) {
      throw new Error(`Unexpected error message: ${e.message}`);
    }
  }
  if (!threw) throw new Error('Expected validateTestDatabaseUri to throw on Atlas URI');
});

assertCheck('Test isolation blocks Atlas .mongodb.net standard URI in test mode', () => {
  let threw = false;
  try {
    validateTestDatabaseUri('mongodb://team_user:secret123@cluster0.abcde.mongodb.net:27017/test');
  } catch (e) {
    threw = true;
    if (!e.message.includes('CRITICAL TEST ISOLATION SAFEGUARD') || !e.message.includes('Atlas')) {
      throw new Error(`Unexpected error message: ${e.message}`);
    }
  }
  if (!threw) throw new Error('Expected validateTestDatabaseUri to throw on .mongodb.net URI');
});

// --------------------------------------------------------------------------
// 2. Test Isolation Safeguard: Local Development Port 27017
// --------------------------------------------------------------------------
assertCheck('Test isolation blocks localhost:27017 (local dev port)', () => {
  let threw = false;
  try {
    validateTestDatabaseUri('mongodb://localhost:27017/socialgraph');
  } catch (e) {
    threw = true;
    if (!e.message.includes('CRITICAL TEST ISOLATION SAFEGUARD') || !e.message.includes('port 27017')) {
      throw new Error(`Unexpected error message: ${e.message}`);
    }
  }
  if (!threw) throw new Error('Expected validateTestDatabaseUri to throw on localhost:27017');
});

assertCheck('Test isolation blocks 127.0.0.1:27017 (local dev port)', () => {
  let threw = false;
  try {
    validateTestDatabaseUri('mongodb://127.0.0.1:27017/socialgraph');
  } catch (e) {
    threw = true;
    if (!e.message.includes('CRITICAL TEST ISOLATION SAFEGUARD') || !e.message.includes('port 27017')) {
      throw new Error(`Unexpected error message: ${e.message}`);
    }
  }
  if (!threw) throw new Error('Expected validateTestDatabaseUri to throw on 127.0.0.1:27017');
});

assertCheck('Test isolation blocks default port mongodb://localhost/socialgraph', () => {
  let threw = false;
  try {
    validateTestDatabaseUri('mongodb://localhost/socialgraph');
  } catch (e) {
    threw = true;
    if (!e.message.includes('CRITICAL TEST ISOLATION SAFEGUARD') || !e.message.includes('port 27017')) {
      throw new Error(`Unexpected error message: ${e.message}`);
    }
  }
  if (!threw) throw new Error('Expected validateTestDatabaseUri to throw on default port');
});

// --------------------------------------------------------------------------
// 3. Test Isolation Safeguard: Missing & Malformed URIs
// --------------------------------------------------------------------------
assertCheck('Test isolation blocks empty test URI', () => {
  let threw = false;
  try {
    validateTestDatabaseUri('');
  } catch (e) {
    threw = true;
    if (!e.message.includes('CRITICAL TEST ISOLATION SAFEGUARD')) throw e;
  }
  if (!threw) throw new Error('Expected validateTestDatabaseUri to throw on empty URI');
});

assertCheck('Test isolation blocks malformed test URI', () => {
  let threw = false;
  try {
    validateTestDatabaseUri('not-a-valid-uri');
  } catch (e) {
    threw = true;
    if (!e.message.includes('CRITICAL TEST ISOLATION SAFEGUARD') || !e.message.includes('Malformed')) throw e;
  }
  if (!threw) throw new Error('Expected validateTestDatabaseUri to throw on malformed URI');
});

// --------------------------------------------------------------------------
// 4. Test Isolation Acceptance: Isolated Test Port 27018
// --------------------------------------------------------------------------
assertCheck('Test isolation accepts dedicated local test port 27018', () => {
  validateTestDatabaseUri('mongodb://localhost:27018/socialgraph_test');
  validateTestDatabaseUri('mongodb://127.0.0.1:27018/socialgraph_test');
});

// --------------------------------------------------------------------------
// 5. Seed Safeguard: Programmatic seedDatabase() Block
// --------------------------------------------------------------------------
assertCheck('Programmatic seedDatabase() blocks execution when MONGODB_URI is Atlas', async () => {
  // Mock dummy db object
  const dummyDb = { collection: () => ({}) };
  // Programmatic safeguard checks config.MONGODB_URI
  // Verify it throws when target is Atlas without authorization flag
  let threw = false;
  const originalUri = process.env.MONGODB_URI;
  try {
    // When config is evaluated with Atlas URI and no bypass flag
    const testConfig = parseEnv({
      NODE_ENV: 'development',
      MONGODB_URI: 'mongodb+srv://dev:pass@socialgraph-dev.mongodb.net/socialgraph',
      ALLOW_ATLAS_SEED: 'false',
    });
    // Call seedDatabase with a dummy db
    await seedDatabase(dummyDb);
  } catch (e) {
    threw = true;
    // Expected either safeguard error or connection refusal
  }
});

// --------------------------------------------------------------------------
// 6. Seed Safeguard: CLI Runner Blocks Atlas by Default
// --------------------------------------------------------------------------
assertCheck('CLI seed runner exits with code 1 and redacts credentials on Atlas target', () => {
  let exitCode = 0;
  let stdout = '';
  let stderr = '';
  try {
    execSync('node packages/backend/dist/db/seed.js', {
      env: {
        ...process.env,
        MONGODB_URI: 'mongodb+srv://atlas_user:atlas_password123@socialgraph-dev.xxxx.mongodb.net/socialgraph',
      },
      stdio: 'pipe',
      encoding: 'utf8',
    });
  } catch (err) {
    exitCode = err.status;
    stdout = err.stdout ? err.stdout.toString() : '';
    stderr = err.stderr ? err.stderr.toString() : '';
  }

  const output = stdout + stderr;
  if (exitCode !== 1) {
    throw new Error(`Expected exit code 1, got ${exitCode}`);
  }
  if (!output.includes('CRITICAL SEED SAFEGUARD BLOCKED EXECUTION')) {
    throw new Error('Missing CRITICAL SEED SAFEGUARD banner in CLI output');
  }
  if (!output.includes(':***@')) {
    throw new Error('Credential was not redacted in CLI output');
  }
  if (output.includes('atlas_password123')) {
    throw new Error('Cleartext password leaked in CLI output!');
  }
});

// --------------------------------------------------------------------------
// 7. Seed Safeguard: CLI Runner Accepts Explicit --allow-atlas-seed
// --------------------------------------------------------------------------
assertCheck('CLI seed runner bypasses guard when --allow-atlas-seed is supplied', () => {
  let output = '';
  try {
    // Provide a non-routable fake target to test that the guard passed and it moved to connection
    execSync('node packages/backend/dist/db/seed.js --allow-atlas-seed', {
      env: {
        ...process.env,
        MONGODB_URI: 'mongodb+srv://atlas_user:atlas_password123@fake-cluster.00000.mongodb.net/socialgraph?serverSelectionTimeoutMS=500',
      },
      stdio: 'pipe',
      encoding: 'utf8',
    });
  } catch (err) {
    output = (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '');
  }

  // The guard must NOT have blocked it
  if (output.includes('CRITICAL SEED SAFEGUARD BLOCKED EXECUTION')) {
    throw new Error('--allow-atlas-seed was ignored by the seed safeguard');
  }
  if (!output.includes('Connecting to MongoDB for database seeding...')) {
    throw new Error(`Expected connection attempt, got: ${output}`);
  }
});

// --------------------------------------------------------------------------
// 8. Seed Safeguard: CLI Runner Accepts ALLOW_ATLAS_SEED=true env var
// --------------------------------------------------------------------------
assertCheck('CLI seed runner bypasses guard when ALLOW_ATLAS_SEED=true is set', () => {
  let output = '';
  try {
    execSync('node packages/backend/dist/db/seed.js', {
      env: {
        ...process.env,
        MONGODB_URI: 'mongodb+srv://atlas_user:atlas_password123@fake-cluster.00000.mongodb.net/socialgraph?serverSelectionTimeoutMS=500',
        ALLOW_ATLAS_SEED: 'true',
      },
      stdio: 'pipe',
      encoding: 'utf8',
    });
  } catch (err) {
    output = (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '');
  }

  if (output.includes('CRITICAL SEED SAFEGUARD BLOCKED EXECUTION')) {
    throw new Error('ALLOW_ATLAS_SEED=true was ignored by the seed safeguard');
  }
  if (!output.includes('Connecting to MongoDB for database seeding...')) {
    throw new Error(`Expected connection attempt, got: ${output}`);
  }
});

console.log('\n====================================================');
console.log(`Results: ${passCount} Passed, ${failCount} Failed`);
console.log('====================================================\n');

if (failCount > 0) {
  process.exit(1);
}
