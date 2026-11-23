import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { formatRelativeTime } from '../../../../packages/frontend/src/utils/date.js';

console.log('=== RUNNING LOCALIZATION RELATIVE TIME SUITE ===');

const logPath = path.resolve(__dirname, '../../../../testing/execution_logs/localization_execution.log');
let logOutput = `LOCALIZATION TESTING EXECUTION LOG - ${new Date().toISOString()}\n\n`;

const now = Date.now();
const tSeconds = new Date(now - 25 * 1000).toISOString();
const tMinutes = new Date(now - 15 * 60 * 1000).toISOString();
const tHours = new Date(now - 3 * 3600 * 1000).toISOString();

const s1 = formatRelativeTime(tSeconds);
const s2 = formatRelativeTime(tMinutes);
const s3 = formatRelativeTime(tHours);

assert.strictEqual(s1, 'just now', `Expected 'just now', got ${s1}`);
assert.strictEqual(s2, '15m ago', `Expected '15m ago', got ${s2}`);
assert.strictEqual(s3, '3h ago', `Expected '3h ago', got ${s3}`);

logOutput += `Relative Time Formats Evaluated:\n` +
  `  25s ago -> "${s1}" (PASS)\n` +
  `  15m ago -> "${s2}" (PASS)\n` +
  `  3h ago  -> "${s3}" (PASS)\n\n` +
  `Architectural Limitation Noted: Multi-language UI string translation catalog (i18n) is not implemented.\n` +
  `Status: PARTIAL (Relative timestamps pass; language catalogs missing).\n`;

fs.writeFileSync(logPath, logOutput);
console.log('✓ Relative timestamp formatting passed assertions.');
console.log(`Raw log written to ${logPath}`);
