import { Value } from '@sinclair/typebox/value';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CreatePostInputSchema,
  UserSummarySchema,
  CreateCommentInputSchema,
  TagSchema,
} from '../packages/shared/dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logPath = path.resolve(__dirname, '06_EXECUTION_LOGS/equivalence_partitioning_execution.log');

interface EPTestCase {
  id: string;
  partition: string;
  entity: string;
  field: string;
  inputDescription: string;
  data: any;
  schema: any;
  expectedValid: boolean;
  actualValid?: boolean;
  verdict?: 'PASS' | 'FAIL';
}

const testCases: EPTestCase[] = [
  // --- USERNAME EQUIVALENCE PARTITIONS ---
  {
    id: 'EP-USER-001',
    partition: 'Valid Equivalence Class (Nominal)',
    entity: 'UserSummary',
    field: 'username',
    inputDescription: 'Alphanumeric string of 8 characters ("dev_user")',
    data: { id: 'u1', username: 'dev_user', display_name: 'Dev', avatar_url: '/a.png', is_verified: false },
    schema: UserSummarySchema,
    expectedValid: true,
  },
  {
    id: 'EP-USER-002',
    partition: 'Invalid Equivalence Class (Below Minimum)',
    entity: 'UserSummary',
    field: 'username',
    inputDescription: 'Length < 3 characters ("ab")',
    data: { id: 'u1', username: 'ab', display_name: 'Dev', avatar_url: '/a.png', is_verified: false },
    schema: UserSummarySchema,
    expectedValid: false,
  },
  {
    id: 'EP-USER-003',
    partition: 'Invalid Equivalence Class (Above Maximum)',
    entity: 'UserSummary',
    field: 'username',
    inputDescription: 'Length > 30 characters (35 chars)',
    data: { id: 'u1', username: 'a'.repeat(35), display_name: 'Dev', avatar_url: '/a.png', is_verified: false },
    schema: UserSummarySchema,
    expectedValid: false,
  },
  {
    id: 'EP-USER-004',
    partition: 'Invalid Equivalence Class (Illegal Characters)',
    entity: 'UserSummary',
    field: 'username',
    inputDescription: 'Contains spaces and symbols ("user name!")',
    data: { id: 'u1', username: 'user name!', display_name: 'Dev', avatar_url: '/a.png', is_verified: false },
    schema: UserSummarySchema,
    expectedValid: false,
  },

  // --- POST TITLE EQUIVALENCE PARTITIONS ---
  {
    id: 'EP-POST-001',
    partition: 'Valid Equivalence Class (Nominal Title)',
    entity: 'CreatePostInput',
    field: 'title',
    inputDescription: 'Standard English title 45 characters',
    data: { title: 'Understanding Meta TAO Architecture in Depth' },
    schema: CreatePostInputSchema,
    expectedValid: true,
  },
  {
    id: 'EP-POST-002',
    partition: 'Valid Equivalence Class (Omitted / Empty Optional)',
    entity: 'CreatePostInput',
    field: 'title',
    inputDescription: 'Empty string title (permitted for visual-only posts)',
    data: { title: '' },
    schema: CreatePostInputSchema,
    expectedValid: true,
  },
  {
    id: 'EP-POST-003',
    partition: 'Invalid Equivalence Class (Exceeds Maximum Length)',
    entity: 'CreatePostInput',
    field: 'title',
    inputDescription: 'String of 350 characters (> 300)',
    data: { title: 'T'.repeat(350) },
    schema: CreatePostInputSchema,
    expectedValid: false,
  },

  // --- POST CONTENT EQUIVALENCE PARTITIONS ---
  {
    id: 'EP-POST-004',
    partition: 'Valid Equivalence Class (Nominal Markdown Body)',
    entity: 'CreatePostInput',
    field: 'content',
    inputDescription: 'Standard markdown text (1,500 characters)',
    data: { content: '## Architecture Review\n\n' + 'Body text paragraph. '.repeat(50) },
    schema: CreatePostInputSchema,
    expectedValid: true,
  },
  {
    id: 'EP-POST-005',
    partition: 'Invalid Equivalence Class (Exceeds 40,000 chars)',
    entity: 'CreatePostInput',
    field: 'content',
    inputDescription: 'Oversized text payload (45,000 characters)',
    data: { content: 'X'.repeat(45000) },
    schema: CreatePostInputSchema,
    expectedValid: false,
  },

  // --- MEDIA ASPECT RATIO EQUIVALENCE PARTITIONS ---
  {
    id: 'EP-MEDIA-001',
    partition: 'Valid Equivalence Class (Standard 16:9 Landscape)',
    entity: 'CreatePostInput',
    field: 'aspect_ratio',
    inputDescription: 'Float 1.7777 (16:9 ratio)',
    data: { media: [{ id: 'm1', url: '/uploads/img1.png', aspect_ratio: 1.778 }] },
    schema: CreatePostInputSchema,
    expectedValid: true,
  },
  {
    id: 'EP-MEDIA-002',
    partition: 'Valid Equivalence Class (Standard 1:1 Square)',
    entity: 'CreatePostInput',
    field: 'aspect_ratio',
    inputDescription: 'Float 1.0 (1:1 ratio)',
    data: { media: [{ id: 'm1', url: '/uploads/img1.png', aspect_ratio: 1.0 }] },
    schema: CreatePostInputSchema,
    expectedValid: true,
  },
  {
    id: 'EP-MEDIA-003',
    partition: 'Invalid Equivalence Class (Negative Aspect Ratio)',
    entity: 'CreatePostInput',
    field: 'aspect_ratio',
    inputDescription: 'Float -1.5 (Geometric impossibility)',
    data: { media: [{ id: 'm1', url: '/uploads/img1.png', aspect_ratio: -1.5 }] },
    schema: CreatePostInputSchema,
    expectedValid: false,
  },
  {
    id: 'EP-MEDIA-004',
    partition: 'Invalid Equivalence Class (Zero Aspect Ratio)',
    entity: 'CreatePostInput',
    field: 'aspect_ratio',
    inputDescription: 'Float 0.0 (Zero dimension)',
    data: { media: [{ id: 'm1', url: '/uploads/img1.png', aspect_ratio: 0.0 }] },
    schema: CreatePostInputSchema,
    expectedValid: false,
  },
  {
    id: 'EP-MEDIA-005',
    partition: 'Invalid Equivalence Class (Excessive Ratio > 10.0)',
    entity: 'CreatePostInput',
    field: 'aspect_ratio',
    inputDescription: 'Float 15.0 (Extreme banner distortion)',
    data: { media: [{ id: 'm1', url: '/uploads/img1.png', aspect_ratio: 15.0 }] },
    schema: CreatePostInputSchema,
    expectedValid: false,
  },

  // --- TAG SLUG EQUIVALENCE PARTITIONS ---
  {
    id: 'EP-TAG-001',
    partition: 'Valid Equivalence Class (Standard Slug)',
    entity: 'TagSchema',
    field: 'slug',
    inputDescription: 'Lowercase hyphenated slug ("distributed-systems")',
    data: 'distributed-systems',
    schema: TagSchema,
    expectedValid: true,
  },
  {
    id: 'EP-TAG-002',
    partition: 'Invalid Equivalence Class (Uppercase & Spaces)',
    entity: 'TagSchema',
    field: 'slug',
    inputDescription: 'Contains spaces and uppercase ("Distributed Systems")',
    data: 'Distributed Systems',
    schema: TagSchema,
    expectedValid: false,
  },

  // --- THREADED COMMENT EQUIVALENCE PARTITIONS ---
  {
    id: 'EP-COMMENT-001',
    partition: 'Valid Equivalence Class (Nominal Comment)',
    entity: 'CreateCommentInput',
    field: 'content',
    inputDescription: 'Markdown comment of 120 characters',
    data: { content: 'Great analysis of Meta TAO cache consistency barriers. What was the invalidation latency?' },
    schema: CreateCommentInputSchema,
    expectedValid: true,
  },
  {
    id: 'EP-COMMENT-002',
    partition: 'Invalid Equivalence Class (Empty Comment)',
    entity: 'CreateCommentInput',
    field: 'content',
    inputDescription: 'Empty string ""',
    data: { content: '' },
    schema: CreateCommentInputSchema,
    expectedValid: false,
  },
  {
    id: 'EP-COMMENT-003',
    partition: 'Invalid Equivalence Class (Exceeds 10,000 chars)',
    entity: 'CreateCommentInput',
    field: 'content',
    inputDescription: 'String of 12,000 characters',
    data: { content: 'C'.repeat(12000) },
    schema: CreateCommentInputSchema,
    expectedValid: false,
  },
];

console.log('=== EXECUTING EQUIVALENCE PARTITIONING SUITE ===\n');

let passCount = 0;
let failCount = 0;
const results: string[] = [];

for (const tc of testCases) {
  const actualValid = Value.Check(tc.schema, tc.data);
  tc.actualValid = actualValid;
  const isPass = actualValid === tc.expectedValid;
  tc.verdict = isPass ? 'PASS' : 'FAIL';

  if (isPass) passCount++;
  else failCount++;

  const resLine = `[${tc.verdict}] ${tc.id} | ${tc.entity}.${tc.field} | ${tc.partition} | Expected: ${tc.expectedValid ? 'VALID' : 'REJECT'} | Actual: ${actualValid ? 'VALID' : 'REJECT'}`;
  results.push(resLine);
  console.log(resLine);
}

const summaryText = `\nEQUIVALENCE PARTITIONING EXECUTION SUMMARY\n==========================================\nTotal Test Cases: ${testCases.length}\nPassed: ${passCount}\nFailed: ${failCount}\nPass Rate: ${((passCount / testCases.length) * 100).toFixed(1)}%\nTimestamp: ${new Date().toISOString()}\n\nDetailed Results:\n` + results.join('\n');

fs.writeFileSync(logPath, summaryText);
console.log(`\nExecution log successfully written to: ${logPath}`);
