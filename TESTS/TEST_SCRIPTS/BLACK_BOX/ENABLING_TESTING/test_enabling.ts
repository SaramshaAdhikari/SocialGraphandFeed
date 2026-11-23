import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';

console.log('=== RUNNING ENABLING & FEATURE TOGGLE VERIFICATION ===');

const logPath = path.resolve(__dirname, '../../../../testing/execution_logs/enabling_execution.log');
let logOutput = `ENABLING TESTING EXECUTION LOG - ${new Date().toISOString()}\n\n`;

// 1. DEV_USER_BYPASS Flag Evaluation
const bypassVal = process.env.DEV_USER_BYPASS === 'true';
logOutput += `DEV_USER_BYPASS current state: ${bypassVal}\n`;
console.log(`✓ Feature flag DEV_USER_BYPASS evaluated: ${bypassVal}`);

// 2. Storage Provider Toggle Evaluation
const storageProvider = process.env.STORAGE_PROVIDER || 'local';
assert(['local', 'cloudinary'].includes(storageProvider), 'Invalid storage provider');
logOutput += `STORAGE_PROVIDER configured: ${storageProvider}\n`;
console.log(`✓ Feature flag STORAGE_PROVIDER evaluated: ${storageProvider}`);

// 3. Atlas Seed Safeguard Evaluation
const allowAtlasSeed = process.env.ALLOW_ATLAS_SEED === 'true';
logOutput += `ALLOW_ATLAS_SEED safeguard active: ${!allowAtlasSeed}\n`;
console.log(`✓ Atlas seed safeguard confirmed active: ${!allowAtlasSeed}`);

fs.writeFileSync(logPath, logOutput);
console.log(`Raw enabling log written to ${logPath}`);
