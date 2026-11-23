import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const rootDir = path.resolve(__dirname, '../../../../');
const funcLog = path.resolve(rootDir, 'testing/execution_logs/function_coverage_execution.log');

try {
  const out = execSync('npx vitest run --coverage', {
    cwd: path.resolve(rootDir, 'packages/frontend'),
    encoding: 'utf-8',
  });
  fs.writeFileSync(funcLog, `FUNCTION COVERAGE REPORT - ${new Date().toISOString()}\n\n${out}`);
  console.log('✓ Function coverage report saved.');
} catch (err: any) {
  fs.writeFileSync(funcLog, err.stdout || err.message);
}
