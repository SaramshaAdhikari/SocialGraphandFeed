import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';

console.log('=== RUNNING INTEGRATION TESTING API BOUNDARY CHECKS ===');

const logPath = path.resolve(__dirname, '../../../../testing/execution_logs/integration_testing_execution.log');
let logOutput = `INTEGRATION TESTING EXECUTION LOG - ${new Date().toISOString()}\n\n`;

async function runIntegrationChecks() {
  const targetUrl = 'https://socialgraph-feed.onrender.com';
  
  // 1. Health & Datastore Integration Probe
  console.log('1. Probing GET /api/v1/health (Backend -> Atlas & Redis)...');
  const t0 = Date.now();
  const healthRes = await fetch(`${targetUrl}/api/v1/health`);
  const rtt = Date.now() - t0;
  assert.strictEqual(healthRes.status, 200, `Expected HTTP 200, got ${healthRes.status}`);
  const healthJson = await healthRes.json();
  
  logOutput += `--- HEALTH ENDPOINT PROBE ---\nStatus: ${healthRes.status}\nRTT: ${rtt}ms\nBody: ${JSON.stringify(healthJson, null, 2)}\n\n`;
  assert.strictEqual(healthJson.status, 'ok');
  assert.strictEqual(healthJson.services.mongodb.status, 'connected');
  assert.strictEqual(healthJson.services.redis.status, 'connected');
  console.log(`✓ Live health probe passed. MongoDB latency: ${healthJson.services.mongodb.latency_ms}ms, Redis latency: ${healthJson.services.redis.latency_ms}ms`);

  // 2. Communities Directory Serialization Probe
  console.log('2. Probing GET /api/v1/communities (Fastify -> MongoDB Collection)...');
  const commRes = await fetch(`${targetUrl}/api/v1/communities`);
  assert.strictEqual(commRes.status, 200);
  const commJson = await commRes.json();
  assert(Array.isArray(commJson), 'Expected array of communities');
  assert(commJson.length >= 10, 'Expected at least 10 seeded communities');
  
  logOutput += `--- COMMUNITIES ENDPOINT PROBE ---\nStatus: ${commRes.status}\nTotal Communities: ${commJson.length}\nSample: ${JSON.stringify(commJson.slice(0, 2), null, 2)}\n\n`;
  console.log(`✓ Communities API boundary passed. Retrieved ${commJson.length} seeded communities.`);

  // 3. Security Boundary Headers
  console.log('3. Validating HTTP Security Headers...');
  const headers = Object.fromEntries(healthRes.headers.entries());
  logOutput += `--- HTTP HEADERS ---\n${JSON.stringify(headers, null, 2)}\n\n`;
  assert(headers['content-security-policy'], 'Missing Content-Security-Policy header');
  assert.strictEqual(headers['x-frame-options'], 'DENY');
  assert.strictEqual(headers['x-content-type-options'], 'nosniff');
  console.log('✓ Security headers validated (CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff).');

  fs.writeFileSync(logPath, logOutput);
  console.log(`Raw integration execution log saved to ${logPath}`);
}

runIntegrationChecks().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
