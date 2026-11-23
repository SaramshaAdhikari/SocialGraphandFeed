import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { calculateHotScore } from '../../../../packages/backend/src/utils/pagination.js';
import { toUserSummary } from '../../../../packages/backend/src/db/serialization.js';
import { AppError } from '../../../../packages/shared/dist/index.js';

console.log('=== RUNNING UNIT / CODE-LEVEL FUNCTIONAL TEST SUITE ===');

const logPath = path.resolve(__dirname, '../../../../testing/execution_logs/unit_code_functional_execution.log');
let logOutput = `UNIT/CODE FUNCTIONAL EXECUTION LOG - ${new Date().toISOString()}\n\n`;

// 1. calculateHotScore Mathematical Invariant
const t1 = new Date('2026-10-31T00:00:00Z');
const t2 = new Date('2026-10-31T12:00:00Z'); // 12 hours later
const scoreOlder = calculateHotScore(10, t1);
const scoreNewer = calculateHotScore(10, t2);

assert(scoreNewer > scoreOlder, 'Newer post with same score must have higher hot rank');
logOutput += `calculateHotScore Monotonic Decay:\n  Older post (T0, score 10) = ${scoreOlder}\n  Newer post (T0+12h, score 10) = ${scoreNewer}\n  Invariant Verified: Newer > Older\n\n`;
console.log('✓ calculateHotScore temporal decay verified.');

// 2. toUserSummary Data Sanitization Invariant
const mockDbUser: any = {
  _id: 'usr_test_123',
  username: 'test_dev',
  display_name: 'Test Dev',
  avatar_url: '/avatar.png',
  password_hash: '$2a$10$e7W...sensitive_hash',
  email: 'private@domain.com',
  is_verified: true,
};
const summary = toUserSummary(mockDbUser);
assert.strictEqual(summary.id, 'usr_test_123');
assert.strictEqual(summary.username, 'test_dev');
assert.strictEqual((summary as any).password_hash, undefined, 'password_hash must be stripped');
assert.strictEqual((summary as any).email, undefined, 'email must be stripped');
logOutput += `toUserSummary Sanitization:\n  Input has password_hash: ${Boolean(mockDbUser.password_hash)}\n  Output has password_hash: ${Boolean((summary as any).password_hash)}\n  Output has email: ${Boolean((summary as any).email)}\n  Invariant Verified: Sensitive credentials stripped\n\n`;
console.log('✓ toUserSummary projection verified.');

// 3. AppError RFC 7807 Factory Invariant
const err = AppError.badRequest('Validation boundary failed');
assert.strictEqual(err.statusCode, 400);
assert.strictEqual(err.code, 'BAD_REQUEST');
assert(err.type.includes('bad-request'));
logOutput += `AppError Factory:\n  statusCode: ${err.statusCode}\n  code: ${err.code}\n  type: ${err.type}\n  Invariant Verified: Emits RFC 7807 contract\n`;
console.log('✓ AppError problem details contract verified.');

fs.writeFileSync(logPath, logOutput);
console.log(`Raw log written to ${logPath}`);
