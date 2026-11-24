import fs from 'fs';
import path from 'path';

const feLog = fs.readFileSync('QA_VERIFICATION/06_EXECUTION_LOGS/frontend_vitest_execution.log', 'utf8');
const beLog = fs.readFileSync('QA_VERIFICATION/06_EXECUTION_LOGS/backend_serialization_execution.log', 'utf8');
const bvaLog = fs.readFileSync('QA_VERIFICATION/06_EXECUTION_LOGS/bva_and_negative_execution.log', 'utf8');
const epLog = fs.readFileSync('QA_VERIFICATION/06_EXECUTION_LOGS/equivalence_partitioning_execution.log', 'utf8');
const egLog = fs.readFileSync('QA_VERIFICATION/06_EXECUTION_LOGS/error_guessing_execution.log', 'utf8');
const e2eLog = fs.readFileSync('QA_VERIFICATION/06_EXECUTION_LOGS/verified_e2e_execution.log', 'utf8');
const intLog = fs.readFileSync('testing/execution_logs/backend_integration_suites.log', 'utf8');

console.log('=== TEST COUNTS ANALYSIS ===');

// 1. FE Vitest
const feMatch = feLog.match(/Tests\s+(\d+)\s+passed\s+\((\d+)\)/);
console.log('1. Frontend Vitest Tests:', feMatch ? `${feMatch[1]} passed of ${feMatch[2]}` : 'not matched');

// 2. BE Serialization
const beMatch = beLog.match(/Tests\s+(\d+)\s+passed\s+\((\d+)\)/);
console.log('2. Backend Serialization Unit Tests:', beMatch ? `${beMatch[1]} passed of ${beMatch[2]}` : 'not matched');

// 3. BVA and Negative (run_bva_and_negative.ts)
// Check how many tests run_bva_and_negative.ts executed
const bvaLines = bvaLog.split('\n');
const bvaCases = bvaLines.filter(l => l.includes('✓ BVA-') || l.includes('✓ NEG-') || l.includes('✓'));
console.log('3. BVA & Negative runner total checks:', bvaCases.length);
const bvaOnly = bvaLines.filter(l => l.includes('BVA-'));
const negOnly = bvaLines.filter(l => l.includes('NEG-'));
console.log('   - Specific BVA cases:', bvaOnly.length);
console.log('   - Specific NEG cases:', negOnly.length);

// 4. Equivalence Partitioning
const epCases = epLog.split('\n').filter(l => l.includes('[PASS]'));
console.log('4. Equivalence Partitioning cases:', epCases.length);

// 5. Error Guessing
const egCases = egLog.split('\n').filter(l => l.includes('[DEFENDED]'));
console.log('5. Error Guessing cases:', egCases.length);

// 6. E2E Playwright
const e2eCases = e2eLog.split('\n').filter(l => l.includes('[PASS]'));
console.log('6. Verified E2E Scenarios:', e2eCases.length);

// 7. Backend Integration Suites (historical)
const intMatch = intLog.match(/Tests\s+(\d+)\s+failed\s+\|\s+(\d+)\s+passed\s+\((\d+)\)/);
console.log('7. Backend Integration (Fastify + Mongo + Redis):', intMatch ? `${intMatch[2]} passed, ${intMatch[1]} failed, total ${intMatch[3]}` : 'not matched');

console.log('\n=== SUMMATIONS & INVESTIGATION OF DISCREPANCY ===');
console.log('Sum of all independent executed suites:');
const feCount = 292;
const beCount = 6;
const bvaNegCount = 44; // (32 BVA + 12 Neg in run_bva_and_negative.ts)
const epCount = 19;
const egCount = 10;
const e2eCount = 5;
const totalWithAllBvaNeg = feCount + beCount + bvaNegCount + epCount + egCount + e2eCount;
console.log(`292 (FE) + 6 (BE) + 44 (BVA+Neg) + 19 (EP) + 10 (EG) + 5 (E2E) = ${totalWithAllBvaNeg}`);

console.log('\nWhy did Phase 2 report 363?');
console.log('Notice:');
console.log(`If BVA was counted as 32 (excluding 12 Neg to avoid overlap with negative testing):`);
console.log(`292 + 6 + 32 + 19 + 10 + 5 = 364 (off by 1)`);
console.log(`If BVA was 32, and E2E was counted as workflows (not assertions): 292 + 6 + 32 + 19 + 10 = 359`);
console.log(`What if: 298 (Monorepo Unit) + 44 (BVA/Neg) + 19 (EP) + 2 (something else) = 363? 298 + 44 + 19 = 361 + 2 = 363!`);
console.log(`What if: 292 (FE) + 6 (BE) + 44 (BVA) + 19 (EP) + 2 (sanity/smoke) = 363? Exactly 292 + 6 + 44 + 19 + 2 = 363!`);
console.log(`In that case, the 10 Error Guessing and 5 E2E were added later or omitted from the header total: 363 + 10 (EG) + 5 (E2E) - 2 (smoke) = 376!`);
