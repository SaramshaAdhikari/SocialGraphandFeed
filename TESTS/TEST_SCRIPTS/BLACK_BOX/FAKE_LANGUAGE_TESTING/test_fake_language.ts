import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';

console.log('=== RUNNING FAKE LANGUAGE / PSEUDO-LOCALIZATION SUITE ===');

const logPath = path.resolve(__dirname, '../../../../testing/execution_logs/fake_language_execution.log');
let logOutput = `FAKE LANGUAGE EXECUTION LOG - ${new Date().toISOString()}\n\n`;

function pseudoLocalize(str: string): string {
  const map: Record<string, string> = {
    a: 'ä', e: 'ë', i: 'ï', o: 'ö', u: 'ü', A: 'Ä', E: 'Ë', I: 'Ï', O: 'Ö', U: 'Ü',
  };
  const transformed = str.split('').map((ch) => map[ch] || ch).join('');
  return `[!!! ${transformed} !!!]`;
}

const strings = [
  'Edit Profile',
  'Communities',
  'Search posts, people, topics...',
  'Following Count: 1,420',
];

for (const s of strings) {
  const pseudo = pseudoLocalize(s);
  const expansionRatio = (pseudo.length - s.length) / s.length;
  assert(expansionRatio >= 0.25, 'Expected at least 25% length expansion for pseudo-localization');
  logOutput += `Original: "${s}" (${s.length}c) -> Pseudo: "${pseudo}" (${pseudo.length}c) -> Expansion: +${(expansionRatio * 100).toFixed(1)}%\n`;
  console.log(`✓ "${s}" -> "${pseudo}" (+${(expansionRatio * 100).toFixed(1)}%)`);
}

fs.writeFileSync(logPath, logOutput);
console.log(`Raw fake language log written to ${logPath}`);
