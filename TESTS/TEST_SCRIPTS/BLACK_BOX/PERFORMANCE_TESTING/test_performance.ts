import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

console.log('=== RUNNING PERFORMANCE BUILD & ASSET FOOTPRINT BENCHMARK ===');

const rootDir = path.resolve(__dirname, '../../../../');
const logPath = path.resolve(rootDir, 'testing/execution_logs/performance_execution.log');

let logOutput = `PERFORMANCE BENCHMARK LOG - ${new Date().toISOString()}\n\n`;

const t0 = Date.now();
try {
  const buildOut = execSync('npm run build --workspace=@socialgraph/frontend', {
    cwd: rootDir,
    encoding: 'utf-8',
  });
  const durationSec = ((Date.now() - t0) / 1000).toFixed(2);
  logOutput += `Build Duration: ${durationSec}s\n\nBuild Output:\n${buildOut}\n`;
  console.log(`✓ Frontend build completed in ${durationSec}s.`);
} catch (err: any) {
  logOutput += err.stdout || err.message;
  console.error('Build performance benchmark failed:', err.message);
  process.exit(1);
}

fs.writeFileSync(logPath, logOutput);
console.log(`Raw performance log saved to ${logPath}`);
