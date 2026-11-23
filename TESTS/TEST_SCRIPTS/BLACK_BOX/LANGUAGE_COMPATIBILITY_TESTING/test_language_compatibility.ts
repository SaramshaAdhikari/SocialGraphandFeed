import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';

console.log('=== RUNNING LANGUAGE COMPATIBILITY ACCEPT-LANGUAGE HEADER SUITE ===');

const logPath = path.resolve(__dirname, '../../../../testing/execution_logs/language_compatibility_execution.log');
let logOutput = `LANGUAGE COMPATIBILITY EXECUTION LOG - ${new Date().toISOString()}\n\n`;

async function runHeaderChecks() {
  const targetUrl = 'https://socialgraph-feed.onrender.com/api/v1/health';
  const headersToTest = [
    'fr-FR,de-DE;q=0.9,en;q=0.8',
    'ja,zh-CN;q=0.9',
    '*',
    'invalid-lang-tag-12345678',
  ];

  for (const h of headersToTest) {
    const res = await fetch(targetUrl, {
      headers: { 'Accept-Language': h },
    });
    logOutput += `Header 'Accept-Language: ${h}' -> Response Status: ${res.status}\n`;
    assert.strictEqual(res.status, 200, `Expected 200 OK for header ${h}`);
    console.log(`✓ 'Accept-Language: ${h}' -> 200 OK`);
  }

  fs.writeFileSync(logPath, logOutput);
  console.log(`Raw language compatibility log saved to ${logPath}`);
}

runHeaderChecks().catch((err) => {
  console.error('Language compatibility test failed:', err);
  process.exit(1);
});
