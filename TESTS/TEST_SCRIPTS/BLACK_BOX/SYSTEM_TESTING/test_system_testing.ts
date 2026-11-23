import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';

console.log('=== RUNNING SYSTEM TESTING LIVE DEPLOYMENT VERIFICATION ===');

const logPath = path.resolve(__dirname, '../../../../testing/execution_logs/system_testing_execution.log');
let logOutput = `SYSTEM TESTING EXECUTION LOG - ${new Date().toISOString()}\n\n`;

async function verifyLiveSystem() {
  const deployedUrl = 'https://socialgraph-feed.onrender.com';
  
  // 1. Fetch Root Document
  console.log('1. Fetching deployed root HTML (/) ...');
  const res = await fetch(deployedUrl);
  assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
  const html = await res.text();
  assert(html.includes('<div id="root"></div>'), 'Root mounting div missing');
  assert(html.includes('/assets/index-DOLbJbWo.js'), 'Expected JS bundle missing');
  assert(html.includes('/assets/index-BHjLuT0c.css'), 'Expected CSS bundle missing');
  
  logOutput += `Root Document Status: ${res.status}\nHTML Length: ${html.length} bytes\nVerified Assets: index-DOLbJbWo.js & index-BHjLuT0c.css\n\n`;
  console.log('✓ Root HTML mounted cleanly with exact deployed assets.');

  // 2. Fetch Live Health Probe
  console.log('2. Fetching deployed /api/v1/health ...');
  const healthRes = await fetch(`${deployedUrl}/api/v1/health`);
  const healthJson = await healthRes.json();
  assert.strictEqual(healthJson.status, 'ok');
  
  logOutput += `Health Probe: ${JSON.stringify(healthJson, null, 2)}\n\n`;
  console.log('✓ Health probe confirmed operational.');

  fs.writeFileSync(logPath, logOutput);
  console.log(`Raw system test log saved to ${logPath}`);
}

verifyLiveSystem().catch((err) => {
  console.error('System test failed:', err);
  process.exit(1);
});
