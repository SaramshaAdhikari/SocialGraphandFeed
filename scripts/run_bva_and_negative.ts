import { Value } from '@sinclair/typebox/value';
import {
  CreatePostInputSchema,
  UserSummarySchema,
  UserProfileSchema,
  UpdateUserProfileInputSchema,
  CreateCommentInputSchema,
  TagSchema,
} from '../packages/shared/dist/index.js';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface TestCaseResult {
  id: string;
  category: 'BVA' | 'NEGATIVE';
  description: string;
  fieldOrFeature: string;
  inputValue: string;
  expectedResult: string;
  actualResult: string;
  status: 'PASS' | 'FAIL';
  detail: string;
}

const results: TestCaseResult[] = [];

function runBvaCase(
  id: string,
  field: string,
  desc: string,
  schema: any,
  data: any,
  expectValid: boolean
) {
  const isValid = Value.Check(schema, data);
  const status: 'PASS' | 'FAIL' = isValid === expectValid ? 'PASS' : 'FAIL';
  results.push({
    id,
    category: 'BVA',
    description: desc,
    fieldOrFeature: field,
    inputValue: JSON.stringify(data).slice(0, 100),
    expectedResult: expectValid ? 'Accepted (Valid)' : 'Rejected (Invalid)',
    actualResult: isValid ? 'Accepted (Valid)' : 'Rejected (Invalid)',
    status,
    detail: isValid === expectValid ? 'Matches expected schema boundary' : 'Validation anomaly detected',
  });
}

console.log('--- EXECUTING BOUNDARY VALUE ANALYSIS (BVA) ---');

// 1. Username (Min: 3, Max: 30, pattern: ^[a-zA-Z0-9_]+$)
runBvaCase('BVA-001', 'Username', 'Below minimum length (2 characters)', UserSummarySchema, { id: 'u1', username: 'ab', display_name: 'Test', avatar_url: '/a.png', is_verified: false }, false);
runBvaCase('BVA-002', 'Username', 'Minimum valid length (3 characters)', UserSummarySchema, { id: 'u1', username: 'abc', display_name: 'Test', avatar_url: '/a.png', is_verified: false }, true);
runBvaCase('BVA-003', 'Username', 'Just above minimum length (4 characters)', UserSummarySchema, { id: 'u1', username: 'abcd', display_name: 'Test', avatar_url: '/a.png', is_verified: false }, true);
runBvaCase('BVA-004', 'Username', 'Just below maximum length (29 characters)', UserSummarySchema, { id: 'u1', username: 'a'.repeat(29), display_name: 'Test', avatar_url: '/a.png', is_verified: false }, true);
runBvaCase('BVA-005', 'Username', 'Maximum valid length (30 characters)', UserSummarySchema, { id: 'u1', username: 'a'.repeat(30), display_name: 'Test', avatar_url: '/a.png', is_verified: false }, true);
runBvaCase('BVA-006', 'Username', 'Above maximum length (31 characters)', UserSummarySchema, { id: 'u1', username: 'a'.repeat(31), display_name: 'Test', avatar_url: '/a.png', is_verified: false }, false);

// 2. Post Title (MaxLength: 300)
runBvaCase('BVA-007', 'Post Title', 'Empty title (0 chars - optional)', CreatePostInputSchema, { title: '' }, true);
runBvaCase('BVA-008', 'Post Title', 'Minimum nominal title (1 character)', CreatePostInputSchema, { title: 'T' }, true);
runBvaCase('BVA-009', 'Post Title', 'Nominal valid title (150 characters)', CreatePostInputSchema, { title: 'A'.repeat(150) }, true);
runBvaCase('BVA-010', 'Post Title', 'Maximum valid title (300 characters)', CreatePostInputSchema, { title: 'A'.repeat(300) }, true);
runBvaCase('BVA-011', 'Post Title', 'Above maximum title (301 characters)', CreatePostInputSchema, { title: 'A'.repeat(301) }, false);

// 3. Post Content (MaxLength: 40,000)
runBvaCase('BVA-012', 'Post Content', 'Empty content (0 characters)', CreatePostInputSchema, { content: '' }, true);
runBvaCase('BVA-013', 'Post Content', 'Minimum valid content (1 character)', CreatePostInputSchema, { content: 'C' }, true);
runBvaCase('BVA-014', 'Post Content', 'Maximum valid content (40,000 characters)', CreatePostInputSchema, { content: 'X'.repeat(40000) }, true);
runBvaCase('BVA-015', 'Post Content', 'Above maximum content (40,001 characters)', CreatePostInputSchema, { content: 'X'.repeat(40001) }, false);

// 4. Media Attachments (MaxItems: 10)
const validMediaItem = { id: 'm1', url: '/img.png', aspect_ratio: 1.0 };
runBvaCase('BVA-016', 'Media Attachments', 'Zero media items (empty array)', CreatePostInputSchema, { media: [] }, true);
runBvaCase('BVA-017', 'Media Attachments', 'Single media item', CreatePostInputSchema, { media: [validMediaItem] }, true);
runBvaCase('BVA-018', 'Media Attachments', 'Maximum valid items (10 media)', CreatePostInputSchema, { media: Array(10).fill(validMediaItem) }, true);
runBvaCase('BVA-019', 'Media Attachments', 'Above maximum items (11 media)', CreatePostInputSchema, { media: Array(11).fill(validMediaItem) }, false);

// 5. Tags Array (MaxItems: 20, Tag length: 1 to 50)
runBvaCase('BVA-020', 'Tags Array', 'Zero tags (empty array)', CreatePostInputSchema, { tags: [] }, true);
runBvaCase('BVA-021', 'Tags Array', 'Maximum valid tags count (20 tags)', CreatePostInputSchema, { tags: Array(20).fill('tech') }, true);
runBvaCase('BVA-022', 'Tags Array', 'Above maximum tags count (21 tags)', CreatePostInputSchema, { tags: Array(21).fill('tech') }, false);
runBvaCase('BVA-023', 'Tag Slug Length', 'Minimum valid tag length (1 char)', TagSchema, 'a', true);
runBvaCase('BVA-024', 'Tag Slug Length', 'Maximum valid tag length (50 chars)', TagSchema, 'a'.repeat(50), true);
runBvaCase('BVA-025', 'Tag Slug Length', 'Above maximum tag length (51 chars)', TagSchema, 'a'.repeat(51), false);

// 6. User Bio (MaxLength: 250)
runBvaCase('BVA-026', 'User Bio', 'Empty bio (0 characters)', UpdateUserProfileInputSchema, { bio: '' }, true);
runBvaCase('BVA-027', 'User Bio', 'Maximum valid bio (250 characters)', UpdateUserProfileInputSchema, { bio: 'B'.repeat(250) }, true);
runBvaCase('BVA-028', 'User Bio', 'Above maximum bio (251 characters)', UpdateUserProfileInputSchema, { bio: 'B'.repeat(251) }, false);

// 7. Comment Content (MinLength: 1, MaxLength: 10,000)
runBvaCase('BVA-029', 'Comment Content', 'Below minimum comment (0 chars)', CreateCommentInputSchema, { content: '' }, false);
runBvaCase('BVA-030', 'Comment Content', 'Minimum valid comment (1 char)', CreateCommentInputSchema, { content: 'k' }, true);
runBvaCase('BVA-031', 'Comment Content', 'Maximum valid comment (10,000 chars)', CreateCommentInputSchema, { content: 'c'.repeat(10000) }, true);
runBvaCase('BVA-032', 'Comment Content', 'Above maximum comment (10,001 chars)', CreateCommentInputSchema, { content: 'c'.repeat(10001) }, false);

console.log('--- EXECUTING NEGATIVE TESTING ---');

function runNegativeCase(
  id: string,
  field: string,
  desc: string,
  schema: any,
  data: any,
  expectedErrorPattern: string
) {
  const isValid = Value.Check(schema, data);
  const status: 'PASS' | 'FAIL' = !isValid ? 'PASS' : 'FAIL';
  results.push({
    id,
    category: 'NEGATIVE',
    description: desc,
    fieldOrFeature: field,
    inputValue: JSON.stringify(data).slice(0, 100),
    expectedResult: `Rejected with error matching: ${expectedErrorPattern}`,
    actualResult: !isValid ? 'Rejected appropriately by validation contract' : 'Unexpectedly Accepted (DEFECT)',
    status,
    detail: !isValid ? 'Schema violation caught cleanly' : 'Failed to reject invalid input',
  });
}

// Negative Tests
runNegativeCase('NEG-001', 'Username Format', 'Username with invalid characters ($pecial!chars)', UserSummarySchema, { id: 'u1', username: 'user@bad!', display_name: 'Test', avatar_url: '/a.png', is_verified: false }, 'pattern');
runNegativeCase('NEG-002', 'Username Format', 'Username with spaces ("bad username")', UserSummarySchema, { id: 'u1', username: 'bad user', display_name: 'Test', avatar_url: '/a.png', is_verified: false }, 'pattern');
runNegativeCase('NEG-003', 'Media URL Format', 'Invalid media URL protocol (javascript:alert(1))', CreatePostInputSchema, { media: [{ id: 'm1', url: 'javascript:alert(1)', aspect_ratio: 1.0 }] }, 'pattern');
runNegativeCase('NEG-004', 'Media Aspect Ratio', 'Negative aspect ratio (-1.5)', CreatePostInputSchema, { media: [{ id: 'm1', url: '/img.png', aspect_ratio: -1.5 }] }, 'minimum');
runNegativeCase('NEG-005', 'Media Aspect Ratio', 'Zero aspect ratio (0.0)', CreatePostInputSchema, { media: [{ id: 'm1', url: '/img.png', aspect_ratio: 0.0 }] }, 'minimum');
runNegativeCase('NEG-006', 'Media Aspect Ratio', 'Excessive aspect ratio (15.0)', CreatePostInputSchema, { media: [{ id: 'm1', url: '/img.png', aspect_ratio: 15.0 }] }, 'maximum');
runNegativeCase('NEG-007', 'Post Type', 'Invalid post type literal ("unknown_format")', CreatePostInputSchema, { post_type: 'unknown_format' as any }, 'literal');
runNegativeCase('NEG-008', 'Tag Characters', 'Tag with whitespace ("tag name")', TagSchema, 'tag name', 'pattern');
runNegativeCase('NEG-009', 'Tag Characters', 'Tag with punctuation slug ("tag#trending")', TagSchema, 'tag#trending', 'pattern');
runNegativeCase('NEG-010', 'Community Identifier', 'Community ID with illegal symbols ("comm;DROP TABLE")', CreatePostInputSchema, { community_id: 'comm;DROP TABLE' }, 'pattern');
runNegativeCase('NEG-011', 'Destination URL', 'Malformed destination URL ("htp:/invalid")', CreatePostInputSchema, { destination_url: 'htp:/invalid' }, 'pattern');
runNegativeCase('NEG-012', 'Additional Properties', 'Unauthorized extraneous payload injection ({ backdoor: true })', CreatePostInputSchema, { backdoor: true } as any, 'additionalProperties');

const total = results.length;
const passed = results.filter((r) => r.status === 'PASS').length;
const failed = results.filter((r) => r.status === 'FAIL').length;

console.log(`\nExecution Complete: ${total} Total Tests | ${passed} Passed | ${failed} Failed`);

// Write JSON artifact
fs.writeFileSync(
  path.join(__dirname, '../testing/test-results/bva_and_negative_results.json'),
  JSON.stringify(results, null, 2)
);

console.log('Results written to testing/test-results/bva_and_negative_results.json');
