import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

console.log('=== RUNNING STATEMENT & FUNCTION COVERAGE EXTRACTOR ===');

const rootDir = path.resolve(__dirname, '../../../../');
const stmtLog = path.resolve(rootDir, 'testing/execution_logs/statement_coverage_execution.log');
const funcLog = path.resolve(rootDir, 'testing/execution_logs/function_coverage_execution.log');

try {
  const out = execSync('npx vitest run --coverage', {
    cwd: path.resolve(rootDir, 'packages/frontend'),
    encoding: 'utf-8',
  });
  
  fs.writeFileSync(stmtLog, `STATEMENT COVERAGE REPORT - ${new Date().toISOString()}\n\n${out}`);
  fs.writeFileSync(funcLog, `FUNCTION COVERAGE REPORT - ${new Date().toISOString()}\n\n${out}`);
  console.log('✓ Statement and Function coverage logs generated from V8 engine.');
} catch (err: any) {
  fs.writeFileSync(stmtLog, err.stdout || err.message);
  fs.writeFileSync(funcLog, err.stdout || err.message);
}
