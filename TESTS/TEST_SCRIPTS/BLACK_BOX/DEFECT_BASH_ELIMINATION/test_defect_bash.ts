import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

console.log('=== RUNNING DEFECT BASH & REGRESSION VERIFICATION SUITE ===');

const rootDir = path.resolve(__dirname, '../../../../');
const logPath = path.resolve(rootDir, 'testing/execution_logs/defect_bash_execution.log');

let logOutput = `DEFECT BASH TESTING EXECUTION LOG - ${new Date().toISOString()}\n\n`;

const suites = [
  'src/test/ux_reliability_regression.test.tsx',
  'src/test/product_quality_and_graph.test.tsx',
];

console.log(`Executing defect bash regression suites (${suites.join(', ')})...`);

try {
  const out = execSync(`npx vitest run ${suites.join(' ')}`, {
    cwd: path.resolve(rootDir, 'packages/frontend'),
    encoding: 'utf-8',
  });
  logOutput += out;
  console.log('✓ Defect bash & regression suites passed (race condition locks, graph count fixes verified).');
} catch (err: any) {
  logOutput += err.stdout || err.message;
  console.error('Defect bash test failure:', err.message);
  process.exit(1);
}

fs.writeFileSync(logPath, logOutput);
console.log(`Raw defect bash execution log written to ${logPath}`);
