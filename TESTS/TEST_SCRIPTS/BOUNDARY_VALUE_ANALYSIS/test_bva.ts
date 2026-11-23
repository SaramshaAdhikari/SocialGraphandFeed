import { Value } from '@sinclair/typebox/value';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  CreatePostInputSchema,
  UserSummarySchema,
  UpdateUserProfileInputSchema,
  CreateCommentInputSchema,
  TagSchema,
} from '../../../packages/shared/dist/index.js';

interface BvaRecord {
  id: string;
  field: string;
  condition: string;
  inputSnippet: string;
  expected: boolean;
  actual: boolean;
  passed: boolean;
}

const records: BvaRecord[] = [];

function checkBva(id: string, field: string, condition: string, schema: any, data: any, expected: boolean) {
  const actual = Value.Check(schema, data);
  const passed = actual === expected;
  assert.strictEqual(actual, expected, `Test ${id} failed: Expected ${expected} but got ${actual}`);
  records.push({
    id,
    field,
    condition,
    inputSnippet: JSON.stringify(data).slice(0, 60),
    expected,
    actual,
    passed,
  });
}

console.log('=== STARTING BOUNDARY VALUE ANALYSIS (BVA) EXECUTION ===');

// 1. Username [3, 30]
checkBva('BVA-001', 'Username', 'Below minimum (2 chars)', UserSummarySchema, { id: 'u1', username: 'ab', display_name: 'A', avatar_url: '/a.png', is_verified: false }, false);
checkBva('BVA-002', 'Username', 'Minimum valid (3 chars)', UserSummarySchema, { id: 'u1', username: 'abc', display_name: 'A', avatar_url: '/a.png', is_verified: false }, true);
checkBva('BVA-003', 'Username', 'Just above minimum (4 chars)', UserSummarySchema, { id: 'u1', username: 'abcd', display_name: 'A', avatar_url: '/a.png', is_verified: false }, true);
checkBva('BVA-004', 'Username', 'Just below maximum (29 chars)', UserSummarySchema, { id: 'u1', username: 'a'.repeat(29), display_name: 'A', avatar_url: '/a.png', is_verified: false }, true);
checkBva('BVA-005', 'Username', 'Maximum valid (30 chars)', UserSummarySchema, { id: 'u1', username: 'a'.repeat(30), display_name: 'A', avatar_url: '/a.png', is_verified: false }, true);
checkBva('BVA-006', 'Username', 'Above maximum (31 chars)', UserSummarySchema, { id: 'u1', username: 'a'.repeat(31), display_name: 'A', avatar_url: '/a.png', is_verified: false }, false);

// 2. Post Title [0, 300]
checkBva('BVA-007', 'Post Title', 'Empty (0 chars)', CreatePostInputSchema, { title: '' }, true);
checkBva('BVA-008', 'Post Title', 'Minimum nominal (1 char)', CreatePostInputSchema, { title: 'T' }, true);
checkBva('BVA-009', 'Post Title', 'Nominal valid (150 chars)', CreatePostInputSchema, { title: 'A'.repeat(150) }, true);
checkBva('BVA-010', 'Post Title', 'Maximum valid (300 chars)', CreatePostInputSchema, { title: 'A'.repeat(300) }, true);
checkBva('BVA-011', 'Post Title', 'Above maximum (301 chars)', CreatePostInputSchema, { title: 'A'.repeat(301) }, false);

// 3. Post Content [0, 40,000]
checkBva('BVA-012', 'Post Content', 'Empty (0 chars)', CreatePostInputSchema, { content: '' }, true);
checkBva('BVA-013', 'Post Content', 'Minimum valid (1 char)', CreatePostInputSchema, { content: 'C' }, true);
checkBva('BVA-014', 'Post Content', 'Maximum valid (40,000 chars)', CreatePostInputSchema, { content: 'X'.repeat(40000) }, true);
checkBva('BVA-015', 'Post Content', 'Above maximum (40,001 chars)', CreatePostInputSchema, { content: 'X'.repeat(40001) }, false);

// 4. Media Attachments [0, 10]
const validMedia = { id: 'm1', url: '/p.png', aspect_ratio: 1.0 };
checkBva('BVA-016', 'Media Array', 'Zero items (empty)', CreatePostInputSchema, { media: [] }, true);
checkBva('BVA-017', 'Media Array', 'Single item (1)', CreatePostInputSchema, { media: [validMedia] }, true);
checkBva('BVA-018', 'Media Array', 'Maximum valid (10 items)', CreatePostInputSchema, { media: Array(10).fill(validMedia) }, true);
checkBva('BVA-019', 'Media Array', 'Above maximum (11 items)', CreatePostInputSchema, { media: Array(11).fill(validMedia) }, false);

// 5. Tags Array [0, 20] & Tag Slug [1, 50]
checkBva('BVA-020', 'Tags Array', 'Zero items (empty)', CreatePostInputSchema, { tags: [] }, true);
checkBva('BVA-021', 'Tags Array', 'Maximum valid (20 items)', CreatePostInputSchema, { tags: Array(20).fill('tech') }, true);
checkBva('BVA-022', 'Tags Array', 'Above maximum (21 items)', CreatePostInputSchema, { tags: Array(21).fill('tech') }, false);
checkBva('BVA-023', 'Tag Slug Length', 'Minimum valid (1 char)', TagSchema, 'a', true);
checkBva('BVA-024', 'Tag Slug Length', 'Maximum valid (50 chars)', TagSchema, 'a'.repeat(50), true);
checkBva('BVA-025', 'Tag Slug Length', 'Above maximum (51 chars)', TagSchema, 'a'.repeat(51), false);

// 6. User Bio [0, 250]
checkBva('BVA-026', 'User Bio', 'Empty bio (0 chars)', UpdateUserProfileInputSchema, { bio: '' }, true);
checkBva('BVA-027', 'User Bio', 'Maximum valid (250 chars)', UpdateUserProfileInputSchema, { bio: 'B'.repeat(250) }, true);
checkBva('BVA-028', 'User Bio', 'Above maximum (251 chars)', UpdateUserProfileInputSchema, { bio: 'B'.repeat(251) }, false);

// 7. Comment Content [1, 10,000]
checkBva('BVA-029', 'Comment Content', 'Below minimum (0 chars)', CreateCommentInputSchema, { content: '' }, false);
checkBva('BVA-030', 'Comment Content', 'Minimum valid (1 char)', CreateCommentInputSchema, { content: 'k' }, true);
checkBva('BVA-031', 'Comment Content', 'Maximum valid (10,000 chars)', CreateCommentInputSchema, { content: 'c'.repeat(10000) }, true);
checkBva('BVA-032', 'Comment Content', 'Above maximum (10,001 chars)', CreateCommentInputSchema, { content: 'c'.repeat(10001) }, false);

console.log(`Executed ${records.length} BVA boundary assertions successfully. All assertions passed.`);

// Save raw log
const logPath = path.resolve(__dirname, '../../../testing/execution_logs/bva_execution.log');
fs.writeFileSync(
  logPath,
  `BVA EXECUTION LOG - ${new Date().toISOString()}\nTotal Assertions: ${records.length}\n` +
  records.map((r) => `[${r.id}] ${r.field} (${r.condition}): Expected ${r.expected}, Actual ${r.actual} -> ${r.passed ? 'PASS' : 'FAIL'}`).join('\n')
);
console.log(`Raw log written to ${logPath}`);
