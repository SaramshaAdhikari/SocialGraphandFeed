import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

console.log('=== RUNNING SCENARIO TESTING VERIFICATION SUITE ===');

const rootDir = path.resolve(__dirname, '../../../../');
const logPath = path.resolve(rootDir, 'testing/execution_logs/scenario_testing_execution.log');

let logOutput = `SCENARIO TESTING EXECUTION LOG - ${new Date().toISOString()}\n\n`;

const suites = [
  'src/test/profile_editor.test.tsx',
  'src/test/phase_2b1_unified_composer.test.tsx',
  'src/test/post_detail.test.tsx',
  'src/test/home_feed.test.tsx',
];

console.log(`Executing end-to-end user scenario suites (${suites.join(', ')})...`);

try {
  const out = execSync(`npx vitest run ${suites.join(' ')}`, {
    cwd: path.resolve(rootDir, 'packages/frontend'),
    encoding: 'utf-8',
  });
  logOutput += out;
  console.log('✓ All end-to-end user scenarios executed successfully.');
} catch (err: any) {
  logOutput += err.stdout || err.message;
  console.error('Scenario test failure:', err.message);
  process.exit(1);
}

fs.writeFileSync(logPath, logOutput);
console.log(`Raw scenario execution log written to ${logPath}`);
