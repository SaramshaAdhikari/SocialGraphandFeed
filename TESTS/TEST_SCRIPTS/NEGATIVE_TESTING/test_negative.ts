import { Value } from '@sinclair/typebox/value';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  CreatePostInputSchema,
  UserSummarySchema,
  TagSchema,
} from '../../../packages/shared/dist/index.js';

interface NegRecord {
  id: string;
  field: string;
  scenario: string;
  expectedRejection: boolean;
  actualValid: boolean;
  passed: boolean;
}

const records: NegRecord[] = [];

function checkNegative(id: string, field: string, scenario: string, schema: any, data: any) {
  const actualValid = Value.Check(schema, data);
  // Negative test passes if schema validation FAILS (actualValid === false)
  const passed = actualValid === false;
  assert.strictEqual(actualValid, false, `Negative test ${id} failed: Expected input to be rejected, but it was accepted!`);
  records.push({
    id,
    field,
    scenario,
    expectedRejection: true,
    actualValid,
    passed,
  });
}

console.log('=== STARTING NEGATIVE TESTING EXECUTION ===');

checkNegative('NEG-001', 'Username Format', 'Username with special chars ($pecial!chars)', UserSummarySchema, { id: 'u1', username: 'user@bad!', display_name: 'A', avatar_url: '/a.png', is_verified: false });
checkNegative('NEG-002', 'Username Format', 'Username with embedded spaces ("bad user")', UserSummarySchema, { id: 'u1', username: 'bad user', display_name: 'A', avatar_url: '/a.png', is_verified: false });
checkNegative('NEG-003', 'Media URL Format', 'Dangerous URI protocol (javascript:alert(1))', CreatePostInputSchema, { media: [{ id: 'm1', url: 'javascript:alert(1)', aspect_ratio: 1.0 }] });
checkNegative('NEG-004', 'Aspect Ratio', 'Negative aspect ratio (-1.5)', CreatePostInputSchema, { media: [{ id: 'm1', url: '/p.png', aspect_ratio: -1.5 }] });
checkNegative('NEG-005', 'Aspect Ratio', 'Zero aspect ratio (0.0)', CreatePostInputSchema, { media: [{ id: 'm1', url: '/p.png', aspect_ratio: 0.0 }] });
checkNegative('NEG-006', 'Aspect Ratio', 'Excessive aspect ratio (15.0)', CreatePostInputSchema, { media: [{ id: 'm1', url: '/p.png', aspect_ratio: 15.0 }] });
checkNegative('NEG-007', 'Post Type', 'Invalid post type literal ("unknown_format")', CreatePostInputSchema, { post_type: 'unknown_format' as any });
checkNegative('NEG-008', 'Tag Characters', 'Tag with whitespace ("tag name")', TagSchema, 'tag name');
checkNegative('NEG-009', 'Tag Characters', 'Tag with punctuation slug ("tag#trending")', TagSchema, 'tag#trending');
checkNegative('NEG-010', 'Community Identifier', 'Community ID with illegal symbols ("comm;DROP TABLE")', CreatePostInputSchema, { community_id: 'comm;DROP TABLE' });
checkNegative('NEG-011', 'Destination URL', 'Malformed destination URL ("htp:/invalid")', CreatePostInputSchema, { destination_url: 'htp:/invalid' });
checkNegative('NEG-012', 'Additional Properties', 'Unauthorized extraneous payload injection ({ backdoor: true })', CreatePostInputSchema, { backdoor: true } as any);

console.log(`Executed ${records.length} Negative test assertions successfully. All malformed payloads were rejected.`);

// Save raw log
const logPath = path.resolve(__dirname, '../../../testing/execution_logs/negative_execution.log');
fs.writeFileSync(
  logPath,
  `NEGATIVE TESTING EXECUTION LOG - ${new Date().toISOString()}\nTotal Assertions: ${records.length}\n` +
  records.map((r) => `[${r.id}] ${r.field} (${r.scenario}): Rejected cleanly? -> ${r.passed ? 'PASS' : 'FAIL'}`).join('\n')
);
console.log(`Raw log written to ${logPath}`);
