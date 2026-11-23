import * as fs from 'node:fs';
import * as path from 'node:path';

console.log('=== RUNNING STATIC AST CODE COMPLEXITY ANALYSIS ===');

const rootDir = path.resolve(__dirname, '../../../../');
const logPath = path.resolve(rootDir, 'testing/execution_logs/code_complexity_execution.log');

const files = [
  'packages/backend/src/services/PostService.ts',
  'packages/backend/src/services/FeedService.ts',
  'packages/backend/src/services/UserService.ts',
  'packages/backend/src/services/AuthService.ts',
  'packages/backend/src/services/CommunityService.ts',
  'production-server.mjs',
  'packages/frontend/src/pages/GraphPage.tsx',
  'packages/frontend/src/pages/CreatePostPage.tsx',
];

let logOutput = `MCCABE CYCLOMATIC COMPLEXITY AUDIT - ${new Date().toISOString()}\n\n`;
logOutput += `Formula: V(G) = 1 + Decision Constructs (if, else if, for, while, case, catch, &&, ||, ?)\n\n`;
logOutput += `${'File'.padEnd(25)} | ${'LOC'.padEnd(6)} | ${'Branches'.padEnd(8)} | ${'Complexity'.padEnd(10)} | Rating\n`;
logOutput += '-'.repeat(65) + '\n';

for (const rel of files) {
  const full = path.resolve(rootDir, rel);
  if (!fs.existsSync(full)) continue;
  const content = fs.readFileSync(full, 'utf-8');
  const loc = content.split('\n').length;
  const branches = (content.match(/\b(if|else\s+if|for|while|case|catch)\b/g) || []).length;
  const logicalOps = (content.match(/(&&|\|\||\?\s*[^:])/g) || []).length;
  const complexity = 1 + branches + logicalOps;
  const rating = complexity <= 10 ? 'Low (Simple)' : (complexity <= 50 ? 'Moderate' : 'High (Complex)');

  const line = `${path.basename(rel).padEnd(25)} | ${String(loc).padEnd(6)} | ${String(branches).padEnd(8)} | ${String(complexity).padEnd(10)} | ${rating}\n`;
  logOutput += line;
  console.log(`✓ ${path.basename(rel)}: LOC=${loc}, V(G)=${complexity} (${rating})`);
}

fs.writeFileSync(logPath, logOutput);
console.log(`Raw complexity report written to ${logPath}`);
