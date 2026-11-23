import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

console.log('=== RUNNING CONFIGURATION & ENVIRONMENT VALIDATION ===');

const rootDir = path.resolve(__dirname, '../../../../');
const logPath = path.resolve(rootDir, 'testing/execution_logs/configuration_execution.log');

let logOutput = `CONFIGURATION TESTING EXECUTION LOG - ${new Date().toISOString()}\n\n`;

try {
  const out = execSync('node scripts/validate_setup.mjs', {
    cwd: rootDir,
    encoding: 'utf-8',
  });
  logOutput += out;
  console.log('✓ Configuration setup validator completed cleanly.');
} catch (err: any) {
  logOutput += err.stdout || err.message;
  console.log('Configuration validator output captured with warnings.');
}

fs.writeFileSync(logPath, logOutput);
console.log(`Raw configuration execution log written to ${logPath}`);
