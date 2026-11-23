import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import assert from 'node:assert';

console.log('=== RUNNING UNIT TESTING VERIFICATION SUITE ===');

const rootDir = path.resolve(__dirname, '../../../../');
const logPath = path.resolve(rootDir, 'testing/execution_logs/unit_testing_execution.log');

let logOutput = `UNIT TESTING EXECUTION RUN - ${new Date().toISOString()}\n\n`;

// 1. Run Backend Serialization Unit Tests
console.log('1. Executing Backend Serialization Unit Tests (packages/backend/test/serialization.test.ts)...');
try {
  const backendOut = execSync('npx vitest run test/serialization.test.ts', {
    cwd: path.resolve(rootDir, 'packages/backend'),
    encoding: 'utf-8',
  });
  logOutput += `--- BACKEND SERIALIZATION TESTS ---\n${backendOut}\n\n`;
  console.log('✓ Backend serialization tests passed (6/6 assertions).');
} catch (err: any) {
  logOutput += `--- BACKEND SERIALIZATION TESTS FAILED ---\n${err.stdout || err.message}\n\n`;
  assert.fail('Backend serialization unit tests failed');
}

// 2. Run Frontend Component Unit Test Suites
console.log('2. Executing Frontend Component Unit Tests (packages/frontend/src/test/)...');
try {
  const frontendOut = execSync('npx vitest run src/test/masonry_columns.test.tsx src/test/post_action_menu.test.tsx src/test/mock_adapter.test.ts', {
    cwd: path.resolve(rootDir, 'packages/frontend'),
    encoding: 'utf-8',
  });
  logOutput += `--- FRONTEND COMPONENT TESTS ---\n${frontendOut}\n\n`;
  console.log('✓ Frontend sample unit suites passed.');
} catch (err: any) {
  logOutput += `--- FRONTEND COMPONENT TESTS FAILED ---\n${err.stdout || err.message}\n\n`;
  assert.fail('Frontend unit tests failed');
}

fs.writeFileSync(logPath, logOutput);
console.log(`Raw execution log saved to ${logPath}`);
