import { Value } from '@sinclair/typebox/value';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CreatePostInputSchema,
  UserSummarySchema,
  CreateCommentInputSchema,
  PaginationQuerySchema,
} from '../packages/shared/dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logPath = path.resolve(__dirname, '06_EXECUTION_LOGS/error_guessing_execution.log');

interface ErrorGuessingCase {
  id: string;
  category: string;
  heuristic: string;
  payloadDescription: string;
  testData: any;
  schema: any;
  expectedDefense: string;
  wasDefended: boolean;
}

const cases: ErrorGuessingCase[] = [
  {
    id: 'EG-001',
    category: 'Injection Defense',
    heuristic: 'NoSQL Operator Injection in Identity Payload',
    payloadDescription: 'Injecting MongoDB query operator {"$gt": ""} instead of string',
    testData: { id: 'u1', username: { $gt: '' }, display_name: 'Attacker', avatar_url: '/a.png', is_verified: false },
    schema: UserSummarySchema,
    expectedDefense: 'TypeBox strict string constraint rejects non-primitive object',
    wasDefended: false,
  },
  {
    id: 'EG-002',
    category: 'XSS Sanitization',
    heuristic: 'Dangerous Protocol in Media URL Attachment',
    payloadDescription: 'javascript:alert(1) pseudo-protocol URI',
    testData: { media: [{ id: 'm1', url: 'javascript:alert(document.cookie)', aspect_ratio: 1.0 }] },
    schema: CreatePostInputSchema,
    expectedDefense: 'Schema format validator rejects non-HTTP/HTTPS/relative URI',
    wasDefended: false,
  },
  {
    id: 'EG-003',
    category: 'Path Traversal',
    heuristic: 'Directory Traversal Relative String in Media URL',
    payloadDescription: '../../../../etc/passwd traversal sequence',
    testData: { media: [{ id: 'm1', url: '../../../../etc/passwd', aspect_ratio: 1.0 }] },
    schema: CreatePostInputSchema,
    expectedDefense: 'Schema validator or static media handler rejects relative directory escapes',
    wasDefended: false,
  },
  {
    id: 'EG-004',
    category: 'Prototype Pollution',
    heuristic: 'Extraneous __proto__ and constructor Payload Injection',
    payloadDescription: 'Payload containing forbidden prototype modification property',
    testData: JSON.parse('{"title":"Test","__proto__":{"isAdmin":true}}'),
    schema: CreatePostInputSchema,
    expectedDefense: 'additionalProperties: false strips or rejects unexpected object properties',
    wasDefended: false,
  },
  {
    id: 'EG-005',
    category: 'Numeric Boundary',
    heuristic: 'Floating Point NaN in Aspect Ratio',
    payloadDescription: 'Aspect ratio set to NaN or Infinity string',
    testData: { media: [{ id: 'm1', url: '/p.png', aspect_ratio: NaN }] },
    schema: CreatePostInputSchema,
    expectedDefense: 'TypeBox Type.Number rejects NaN value',
    wasDefended: false,
  },
  {
    id: 'EG-006',
    category: 'Numeric Boundary',
    heuristic: 'Infinite Value in Aspect Ratio',
    payloadDescription: 'Aspect ratio set to Infinity',
    testData: { media: [{ id: 'm1', url: '/p.png', aspect_ratio: Infinity }] },
    schema: CreatePostInputSchema,
    expectedDefense: 'TypeBox Type.Number({ maximum: 10.0 }) rejects Infinity',
    wasDefended: false,
  },
  {
    id: 'EG-007',
    category: 'Pagination Security',
    heuristic: 'Negative Limit in Cursor Pagination Query',
    payloadDescription: 'Query parameter ?limit=-50',
    testData: { limit: -50 },
    schema: PaginationQuerySchema,
    expectedDefense: 'TypeBox minimum: 1 constraint rejects negative pagination limit',
    wasDefended: false,
  },
  {
    id: 'EG-008',
    category: 'Pagination Security',
    heuristic: 'Volumetric Memory Exhaustion via Massive Limit',
    payloadDescription: 'Query parameter ?limit=1000000 to trigger memory exhaustion',
    testData: { limit: 1000000 },
    schema: PaginationQuerySchema,
    expectedDefense: 'TypeBox maximum: 100 constraint enforces bounded query size',
    wasDefended: false,
  },
  {
    id: 'EG-009',
    category: 'Unicode Spoofing',
    heuristic: 'Null Byte Injection in Username',
    payloadDescription: 'Embedded null byte ("admin\\x00fake")',
    testData: { id: 'u1', username: 'admin\x00fake', display_name: 'Admin', avatar_url: '/a.png', is_verified: false },
    schema: UserSummarySchema,
    expectedDefense: 'Regex pattern ^[a-zA-Z0-9_]+$ rejects non-alphanumeric characters',
    wasDefended: false,
  },
  {
    id: 'EG-010',
    category: 'Unicode Spoofing',
    heuristic: 'Right-to-Left Override Character in Username',
    payloadDescription: 'Unicode RTL character \\u202E used to disguise filename or username',
    testData: { id: 'u1', username: 'user\u202Ecod', display_name: 'User', avatar_url: '/a.png', is_verified: false },
    schema: UserSummarySchema,
    expectedDefense: 'Regex pattern ^[a-zA-Z0-9_]+$ cleanly rejects unicode formatting controls',
    wasDefended: false,
  },
];

console.log('=== EXECUTING ERROR GUESSING & EDGE DEFENSE SUITE ===\n');

let defendedCount = 0;
const results: string[] = [];

for (const c of cases) {
  const isValid = Value.Check(c.schema, c.testData);
  // Defended means the malformed / dangerous payload was REJECTED (isValid === false)
  c.wasDefended = isValid === false;
  if (c.wasDefended) defendedCount++;

  const resLine = `[${c.wasDefended ? 'DEFENDED' : 'VULNERABLE'}] ${c.id} | ${c.category} | ${c.heuristic} | Defended? -> ${c.wasDefended ? 'YES (Rejected by Schema)' : 'NO (Accepted)'}`;
  results.push(resLine);
  console.log(resLine);
}

const summaryText = `\nERROR GUESSING TEST EXECUTION SUMMARY\n=====================================\nTotal Evaluated Scenarios: ${cases.length}\nSuccessfully Defended: ${defendedCount}\nVulnerabilities / Leaks: ${cases.length - defendedCount}\nDefense Rate: ${((defendedCount / cases.length) * 100).toFixed(1)}%\nTimestamp: ${new Date().toISOString()}\n\nDetailed Evidence:\n` + results.join('\n');

fs.writeFileSync(logPath, summaryText);
console.log(`\nRaw log written to: ${logPath}`);
