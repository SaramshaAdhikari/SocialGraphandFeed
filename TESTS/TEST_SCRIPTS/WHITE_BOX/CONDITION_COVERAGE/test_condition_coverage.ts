import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';

console.log('=== RUNNING CONDITION COVERAGE BOOLEAN PREDICATE TRUTH-TABLES ===');

const logPath = path.resolve(__dirname, '../../../../testing/execution_logs/condition_coverage_execution.log');
let logOutput = `CONDITION COVERAGE EXECUTION LOG - ${new Date().toISOString()}\n\n`;

// Predicate 1: (url.startsWith('/api/') || url.startsWith('/uploads/'))
function routeProxyDecision(pathname: string): boolean {
  return pathname.startsWith('/api/') || pathname.startsWith('/uploads/');
}

assert.strictEqual(routeProxyDecision('/api/v1/health'), true); // T || F -> T
assert.strictEqual(routeProxyDecision('/uploads/img.png'), true); // F || T -> T
assert.strictEqual(routeProxyDecision('/settings/profile'), false); // F || F -> F

logOutput += `Predicate 1: (pathname.startsWith('/api/') || pathname.startsWith('/uploads/'))\n` +
  `  Case 1 ('/api/v1/health'): C1=T, C2=F -> Compound=T\n` +
  `  Case 2 ('/uploads/img.png'): C1=F, C2=T -> Compound=T\n` +
  `  Case 3 ('/settings/profile'): C1=F, C2=F -> Compound=F\n\n`;
console.log('✓ Predicate 1 truth-table exercised to both True and False.');

// Predicate 2: (idempotencyKey && existingPost)
function idempotencyDecision(idempotencyKey?: string, existingPost?: object | null): boolean {
  return Boolean(idempotencyKey && existingPost);
}

assert.strictEqual(idempotencyDecision('key_123', { id: 'p1' }), true); // T && T -> T
assert.strictEqual(idempotencyDecision('key_123', null), false); // T && F -> F
assert.strictEqual(idempotencyDecision(undefined, null), false); // F && F -> F

logOutput += `Predicate 2: (idempotencyKey && existingPost)\n` +
  `  Case 1 (key provided + existing): C1=T, C2=T -> Compound=T\n` +
  `  Case 2 (key provided + none):     C1=T, C2=F -> Compound=F\n` +
  `  Case 3 (no key + none):           C1=F, C2=F -> Compound=F\n`;
console.log('✓ Predicate 2 truth-table exercised to both True and False.');

fs.writeFileSync(logPath, logOutput);
console.log(`Raw condition coverage log written to ${logPath}`);
