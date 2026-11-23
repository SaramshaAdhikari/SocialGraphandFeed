import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

console.log('=== RUNNING ACCEPTANCE CRITERIA VERIFICATION SUITE ===');

const rootDir = path.resolve(__dirname, '../../../../');
const logPath = path.resolve(rootDir, 'testing/execution_logs/acceptance_testing_execution.log');

let logOutput = `ACCEPTANCE TESTING EXECUTION LOG - ${new Date().toISOString()}\n\n`;

const suites = [
  'src/test/final_ux_corrections.test.tsx',
  'src/test/masonry_columns.test.tsx',
];

console.log(`Executing acceptance suites (${suites.join(', ')})...`);

try {
  const out = execSync(`npx vitest run ${suites.join(' ')}`, {
    cwd: path.resolve(rootDir, 'packages/frontend'),
    encoding: 'utf-8',
  });
  logOutput += out;
  console.log('✓ Acceptance verification passed (button geometry, graph counts, masonry columns).');
} catch (err: any) {
  logOutput += err.stdout || err.message;
  console.error('Acceptance test failure:', err.message);
  process.exit(1);
}

fs.writeFileSync(logPath, logOutput);
console.log(`Raw acceptance execution log written to ${logPath}`);
