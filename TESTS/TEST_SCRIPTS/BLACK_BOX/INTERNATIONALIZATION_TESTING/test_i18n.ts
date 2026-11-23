import { Value } from '@sinclair/typebox/value';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CreatePostInputSchema } from '../../../../packages/shared/dist/index.js';

console.log('=== RUNNING INTERNATIONALIZATION (I18N) ENCODING SUITE ===');

const logPath = path.resolve(__dirname, '../../../../testing/execution_logs/i18n_execution.log');
let logOutput = `I18N TESTING EXECUTION LOG - ${new Date().toISOString()}\n\n`;

const cases = [
  { id: 'I18N-001', lang: 'Indic (Devanagari)', text: 'नमस्ते विश्व - वितरित प्रणाली' },
  { id: 'I18N-002', lang: 'East Asian (CJK)', text: '分散システム アーキテクチャ' },
  { id: 'I18N-003', lang: 'Semitic (Arabic RTL)', text: 'هندسة الأنظمة الموزعة' },
  { id: 'I18N-004', lang: 'Emoji Sequences', text: '🚀 ⚡ 🔥 🎨' },
  { id: 'I18N-005', lang: 'Latin Extended Diacritics', text: 'Café Münchën Résumé' },
];

for (const c of cases) {
  const payload = {
    title: c.text,
    content: `Content in ${c.lang}: ${c.text}`,
  };
  const isValid = Value.Check(CreatePostInputSchema, payload);
  assert.strictEqual(isValid, true, `Failed validation for ${c.lang}`);
  logOutput += `[${c.id}] ${c.lang}: "${c.text}" -> Validated UTF-8: ${isValid}\n`;
  console.log(`✓ ${c.id}: ${c.lang} parsed cleanly.`);
}

fs.writeFileSync(logPath, logOutput);
console.log(`Raw i18n log written to ${logPath}`);
