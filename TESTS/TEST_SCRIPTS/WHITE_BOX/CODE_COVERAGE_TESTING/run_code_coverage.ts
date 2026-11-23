import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

console.log('=== RUNNING CODE COVERAGE WITH NATIVE V8 INSTRUMENTATION ===');

const rootDir = path.resolve(__dirname, '../../../../');
const logPath = path.resolve(rootDir, 'testing/execution_logs/code_coverage_execution.log');

try {
  const out = execSync('npx vitest run --coverage', {
    cwd: path.resolve(rootDir, 'packages/frontend'),
    encoding: 'utf-8',
  });
  fs.writeFileSync(logPath, `V8 CODE COVERAGE LOG - ${new Date().toISOString()}\n\n${out}`);
  console.log('✓ V8 code coverage run complete. Report saved.');
} catch (err: any) {
  fs.writeFileSync(logPath, err.stdout || err.message);
  console.error('Coverage run error:', err.message);
}

console.log(`Raw log saved to ${logPath}`);
