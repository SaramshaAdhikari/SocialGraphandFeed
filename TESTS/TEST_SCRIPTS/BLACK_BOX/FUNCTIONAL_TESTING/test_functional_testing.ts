import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

console.log('=== RUNNING FUNCTIONAL TESTING VERIFICATION SUITE ===');

const rootDir = path.resolve(__dirname, '../../../../');
const logPath = path.resolve(rootDir, 'testing/execution_logs/functional_testing_execution.log');

let logOutput = `FUNCTIONAL TESTING EXECUTION LOG - ${new Date().toISOString()}\n\n`;

const suites = [
  'src/test/create_post.test.tsx',
  'src/test/saved_collections.test.tsx',
  'src/test/search.test.tsx',
  'src/test/search_suggestions.test.tsx',
];

console.log(`Executing 4 functional test suites (${suites.join(', ')})...`);

try {
  const out = execSync(`npx vitest run ${suites.join(' ')}`, {
    cwd: path.resolve(rootDir, 'packages/frontend'),
    encoding: 'utf-8',
  });
  logOutput += out;
  console.log('✓ All functional test suites passed cleanly.');
} catch (err: any) {
  logOutput += err.stdout || err.message;
  console.error('Functional test failure:', err.message);
  process.exit(1);
}

fs.writeFileSync(logPath, logOutput);
console.log(`Raw functional execution log written to ${logPath}`);
