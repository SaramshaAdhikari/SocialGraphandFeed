# Boundary Value Analysis (BVA) Testing Report

---

### 1. Objective
To systematically evaluate software behavior at, just above, and just below numeric, string length, and array capacity boundaries defined in system schemas to ensure constraints are strictly enforced without unhandled exceptions or buffer truncations.

---

### 2. Scope
Covers boundary values across UserSummarySchema (Username [3-30]), UpdateUserProfileInputSchema (Bio [0-250]), CreatePostInputSchema (Title [0-300], Content [0-40,000], Media [0-10], Tags [0-20], Tag length [1-50]), and CreateCommentInputSchema (Content [1-10,000]).

---

### 3. Test Environment
Windows 11 workstation, Node.js v24.13.0, TypeBox v0.34.28 runtime compiler. Baseline commit 94540883ab99b8862ac995fa9afebc2e9eadaa16.

---

### 4. Test Setup and Preconditions
1. TypeBox schemas loaded from built @socialgraph/shared/dist/index.js.
2. Test script test_bva.ts executed via tsx.

---

### 5. Test Cases
| Test ID | Attribute | Boundary Condition | Input Value | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **BVA-001** | Username | Below minimum (2 chars) | `"ab"` | Rejected (Invalid) | Rejected (Invalid) | **PASS** |
| **BVA-002** | Username | Minimum valid (3 chars) | `"abc"` | Accepted (Valid) | Accepted (Valid) | **PASS** |
| **BVA-003** | Username | Just above minimum (4 chars) | `"abcd"` | Accepted (Valid) | Accepted (Valid) | **PASS** |
| **BVA-004** | Username | Just below maximum (29 chars) | `"a" * 29` | Accepted (Valid) | Accepted (Valid) | **PASS** |
| **BVA-005** | Username | Maximum valid (30 chars) | `"a" * 30` | Accepted (Valid) | Accepted (Valid) | **PASS** |
| **BVA-006** | Username | Above maximum (31 chars) | `"a" * 31` | Rejected (Invalid) | Rejected (Invalid) | **PASS** |
| **BVA-007** | Post Title | Empty (0 chars) | `""` | Accepted (Optional) | Accepted (Optional) | **PASS** |
| **BVA-008** | Post Title | Minimum nominal (1 char) | `"T"` | Accepted (Valid) | Accepted (Valid) | **PASS** |
| **BVA-009** | Post Title | Nominal valid (150 chars) | `"A" * 150` | Accepted (Valid) | Accepted (Valid) | **PASS** |
| **BVA-010** | Post Title | Maximum valid (300 chars) | `"A" * 300` | Accepted (Valid) | Accepted (Valid) | **PASS** |
| **BVA-011** | Post Title | Above maximum (301 chars) | `"A" * 301` | Rejected (Invalid) | Rejected (Invalid) | **PASS** |
| **BVA-012** | Post Content | Empty (0 chars) | `""` | Accepted (Optional) | Accepted (Optional) | **PASS** |
| **BVA-013** | Post Content | Minimum valid (1 char) | `"C"` | Accepted (Valid) | Accepted (Valid) | **PASS** |
| **BVA-014** | Post Content | Maximum valid (40,000 chars) | `"X" * 40000` | Accepted (Valid) | Accepted (Valid) | **PASS** |
| **BVA-015** | Post Content | Above maximum (40,001 chars) | `"X" * 40001` | Rejected (Invalid) | Rejected (Invalid) | **PASS** |
| **BVA-016** | Media Array | Zero items (empty) | `[]` | Accepted (Valid) | Accepted (Valid) | **PASS** |
| **BVA-017** | Media Array | Single item | `[item]` | Accepted (Valid) | Accepted (Valid) | **PASS** |
| **BVA-018** | Media Array | Maximum valid (10 items) | `[item] * 10` | Accepted (Valid) | Accepted (Valid) | **PASS** |
| **BVA-019** | Media Array | Above maximum (11 items) | `[item] * 11` | Rejected (Invalid) | Rejected (Invalid) | **PASS** |
| **BVA-020** | Tags Array | Zero items (empty) | `[]` | Accepted (Valid) | Accepted (Valid) | **PASS** |
| **BVA-021** | Tags Array | Maximum valid (20 items) | `["tag"] * 20` | Accepted (Valid) | Accepted (Valid) | **PASS** |
| **BVA-022** | Tags Array | Above maximum (21 items) | `["tag"] * 21` | Rejected (Invalid) | Rejected (Invalid) | **PASS** |
| **BVA-023** | Tag Slug | Minimum valid (1 char) | `"a"` | Accepted (Valid) | Accepted (Valid) | **PASS** |
| **BVA-024** | Tag Slug | Maximum valid (50 chars) | `"a" * 50` | Accepted (Valid) | Accepted (Valid) | **PASS** |
| **BVA-025** | Tag Slug | Above maximum (51 chars) | `"a" * 51` | Rejected (Invalid) | Rejected (Invalid) | **PASS** |
| **BVA-026** | User Bio | Empty bio (0 chars) | `""` | Accepted (Valid) | Accepted (Valid) | **PASS** |
| **BVA-027** | User Bio | Maximum valid (250 chars) | `"B" * 250` | Accepted (Valid) | Accepted (Valid) | **PASS** |
| **BVA-028** | User Bio | Above maximum (251 chars) | `"B" * 251` | Rejected (Invalid) | Rejected (Invalid) | **PASS** |
| **BVA-029** | Comment Content | Below minimum (0 chars) | `""` | Rejected (Invalid) | Rejected (Invalid) | **PASS** |
| **BVA-030** | Comment Content | Minimum valid (1 char) | `"k"` | Accepted (Valid) | Accepted (Valid) | **PASS** |
| **BVA-031** | Comment Content | Maximum valid (10,000 chars) | `"c" * 10000` | Accepted (Valid) | Accepted (Valid) | **PASS** |
| **BVA-032** | Comment Content | Above maximum (10,001 chars) | `"c" * 10001` | Rejected (Invalid) | Rejected (Invalid) | **PASS** |

---

### 6. Actual Test Code or Manual Procedure
**Test Script Location:** [`TESTS/TEST_SCRIPTS/BOUNDARY_VALUE_ANALYSIS/test_bva.ts`](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/TEST_SCRIPTS/BOUNDARY_VALUE_ANALYSIS/test_bva.ts)

```typescript
// 1. Username boundary evaluations
assert.strictEqual(Value.Check(UserSummarySchema, { ...baseUser, username: 'ab' }), false);
assert.strictEqual(Value.Check(UserSummarySchema, { ...baseUser, username: 'abc' }), true);
assert.strictEqual(Value.Check(UserSummarySchema, { ...baseUser, username: 'a'.repeat(30) }), true);
assert.strictEqual(Value.Check(UserSummarySchema, { ...baseUser, username: 'a'.repeat(31) }), false);

// 2. Post Content boundary evaluations
assert.strictEqual(Value.Check(CreatePostInputSchema, { title: 'T', content: 'X'.repeat(40000) }), true);
assert.strictEqual(Value.Check(CreatePostInputSchema, { title: 'T', content: 'X'.repeat(40001) }), false);
```

---

### 7. Execution Command
```bash
npx tsx TESTS/TEST_SCRIPTS/BOUNDARY_VALUE_ANALYSIS/test_bva.ts
```

---

### 8. Expected Results
All 32 boundary tests behave strictly according to specification: values inside boundaries are accepted, values outside are rejected.

---

### 9. Actual Results
All 32 boundary assertions executed successfully. TypeBox compiler rejected all out-of-bounds inputs and accepted all in-bounds values.

---

### 10. Execution Summary
- **Total Test Cases / Assertions:** 32
- **Passed:** 32
- **Failed:** 0
- **Blocked / Infeasible:** 0
- **Final Classification Status:** **PASS**

---

### 11. Defect Summary
No boundary value defects detected. Schema definitions strictly match specification.

---

### 12. Risk Analysis
Low risk. Edge inputs are rejected at the Fastify request validation layer before reaching business logic or database queries.

---

### 13. Screenshot and Evidence References
1. **Username [3-30] and Bio [0-250] character boundary execution:**
   - File: `SCREENSHOTS/BOUNDARY_VALUE_ANALYSIS/BOUNDARY_VALUE_ANALYSIS_001.png`
   - Path: [BOUNDARY_VALUE_ANALYSIS_001.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/BOUNDARY_VALUE_ANALYSIS/BOUNDARY_VALUE_ANALYSIS_001.png)

2. **Post Title [0-300] and Content [0-40,000] boundary execution:**
   - File: `SCREENSHOTS/BOUNDARY_VALUE_ANALYSIS/BOUNDARY_VALUE_ANALYSIS_002.png`
   - Path: [BOUNDARY_VALUE_ANALYSIS_002.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/BOUNDARY_VALUE_ANALYSIS/BOUNDARY_VALUE_ANALYSIS_002.png)

3. **Media attachments array capacity [0-10] boundary execution:**
   - File: `SCREENSHOTS/BOUNDARY_VALUE_ANALYSIS/BOUNDARY_VALUE_ANALYSIS_003.png`
   - Path: [BOUNDARY_VALUE_ANALYSIS_003.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/BOUNDARY_VALUE_ANALYSIS/BOUNDARY_VALUE_ANALYSIS_003.png)

4. **Tags array [0-20] and Comment length [1-10,000] boundary execution:**
   - File: `SCREENSHOTS/BOUNDARY_VALUE_ANALYSIS/BOUNDARY_VALUE_ANALYSIS_004.png`
   - Path: [BOUNDARY_VALUE_ANALYSIS_004.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/BOUNDARY_VALUE_ANALYSIS/BOUNDARY_VALUE_ANALYSIS_004.png)

- **Raw Execution Log:** [`testing/execution_logs/bva_execution.log`](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/bva_execution.log)

---

### 14. Limitations
BVA was executed against TypeBox schemas; physical MongoDB BSON 16MB document size limits represent an outer secondary boundary.
