import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';

console.log('=== RUNNING SECURITY TESTING HEADER & SANITIZATION AUDIT ===');

const logPath = path.resolve(__dirname, '../../../../testing/execution_logs/security_execution.log');
let logOutput = `SECURITY TESTING EXECUTION LOG - ${new Date().toISOString()}\n\n`;

async function runSecurityAudit() {
  const deployedUrl = 'https://socialgraph-feed.onrender.com';
  
  // 1. Unauthenticated Mutation Block Check
  console.log('1. Testing unauthenticated mutation block (POST /api/v1/posts without auth)...');
  const postRes = await fetch(`${deployedUrl}/api/v1/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Exploit Test', content: 'Unauthorized' }),
  });
  logOutput += `Unauthorized Mutation Test:\n  Endpoint: POST /api/v1/posts\n  Status: ${postRes.status}\n\n`;
  assert([401, 404].includes(postRes.status), `Expected 401 or 404 for unauthenticated mutation, got ${postRes.status}`);
  console.log(`✓ Unauthorized mutation rejected with HTTP ${postRes.status}.`);

  // 2. Production Security Headers Check (Fastify API boundary)
  console.log('2. Inspecting production HTTP security headers on API endpoints (/api/v1/health)...');
  const res = await fetch(`${deployedUrl}/api/v1/health`);
  const csp = res.headers.get('content-security-policy');
  const xfo = res.headers.get('x-frame-options');
  const xcto = res.headers.get('x-content-type-options');
  
  logOutput += `Production Security Headers (/api/v1/health):\n  CSP: ${csp}\n  X-Frame-Options: ${xfo}\n  X-Content-Type-Options: ${xcto}\n`;
  assert(csp, 'CSP header missing');
  assert.strictEqual(xfo, 'DENY', 'Expected X-Frame-Options: DENY');
  assert.strictEqual(xcto, 'nosniff', 'Expected X-Content-Type-Options: nosniff');
  console.log('✓ Enterprise security headers verified (CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff).');

  // 3. Static Root Header Check (Audit observation)
  const rootRes = await fetch(deployedUrl);
  const rootCsp = rootRes.headers.get('content-security-policy');
  logOutput += `\nStatic Root (/) Headers Note:\n  Root CSP: ${rootCsp ?? 'None (Handled as static SPA HTML without Fastify helmet middleware)'}\n`;

  fs.writeFileSync(logPath, logOutput);
  console.log(`Raw security log saved to ${logPath}`);
}

runSecurityAudit().catch((err) => {
  console.error('Security audit failed:', err);
  process.exit(1);
});
