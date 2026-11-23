# Unit / Code-Level Functional Testing Report

---

### 1. Objective
To test low-level internal algorithms, mathematical decay curves, data projection helpers, and RFC 7807 error factories directly at the code level.

---

### 2. Scope
Covers calculateHotScore monotonic temporal decay (packages/backend/src/utils/pagination.ts), toUserSummary credential sanitization (packages/backend/src/db/serialization.ts), and AppError Problem Details factory (packages/shared/src/errors/index.ts).

---

### 3. Test Environment
Windows 11 workstation, Node.js v24.13.0, TypeScript. Baseline commit 94540883ab99b8862ac995fa9afebc2e9eadaa16.

---

### 4. Test Setup and Preconditions
1. Workspace compiled.
2. Internal helper functions imported directly.

---

### 5. Test Cases
| Test ID | Internal Algorithm | Test Input / Scenario | Expected Invariant | Actual Invariant | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **UCF-001** | `calculateHotScore` | Compare post at T0 vs T0+12h (same score) | Newer post has higher rank | Newer (1.96) > Older (1.00) | **PASS** |
| **UCF-002** | `toUserSummary` | User document with password_hash & email | Password hash and email stripped | Stripped (undefined) | **PASS** |
| **UCF-003** | `AppError.badRequest` | Factory invocation with message | statusCode: 400, code: "BAD_REQUEST" | statusCode: 400, code: "BAD_REQUEST" | **PASS** |
| **UCF-004** | `AppError.unauthorized` | Factory invocation with message | statusCode: 401, code: "UNAUTHORIZED" | statusCode: 401, code: "UNAUTHORIZED" | **PASS** |
| **UCF-005** | `AppError.notFound` | Factory invocation with message | statusCode: 404, code: "NOT_FOUND" | statusCode: 404, code: "NOT_FOUND" | **PASS** |

---

### 6. Actual Test Code or Manual Procedure
**Test Script Location:** [`TESTS/TEST_SCRIPTS/WHITE_BOX/UNIT_CODE_FUNCTIONAL_TESTING/test_unit_code_functional.ts`](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/TEST_SCRIPTS/WHITE_BOX/UNIT_CODE_FUNCTIONAL_TESTING/test_unit_code_functional.ts)

```typescript
// 1. calculateHotScore Mathematical Invariant
const t1 = new Date('2026-10-31T00:00:00Z');
const t2 = new Date('2026-10-31T12:00:00Z');
const scoreOlder = calculateHotScore(10, t1);
const scoreNewer = calculateHotScore(10, t2);
assert(scoreNewer > scoreOlder, 'Newer post with same score must have higher hot rank');

// 2. toUserSummary Data Sanitization Invariant
const summary = toUserSummary(mockDbUser);
assert.strictEqual((summary as any).password_hash, undefined);
assert.strictEqual((summary as any).email, undefined);
```

---

### 7. Execution Command
```bash
npx tsx TESTS/TEST_SCRIPTS/WHITE_BOX/UNIT_CODE_FUNCTIONAL_TESTING/test_unit_code_functional.ts
```

---

### 8. Expected Results
All internal algorithms adhere strictly to mathematical invariants and data privacy sanitization rules.

---

### 9. Actual Results
All 5 code-level assertions passed cleanly. HotScore decay, credential stripping, and RFC 7807 error contracts verified.

---

### 10. Execution Summary
- **Total Test Cases / Assertions:** 5
- **Passed:** 5
- **Failed:** 0
- **Blocked / Infeasible:** 0
- **Final Classification Status:** **PASS**

---

### 11. Defect Summary
No code-level algorithmic defects identified.

---

### 12. Risk Analysis
Low risk. Algorithmic invariants are covered by automated assertions.

---

### 13. Screenshot and Evidence References
1. **Code-level functional algorithm execution log:**
   - File: `SCREENSHOTS/WHITE_BOX/UNIT_CODE_FUNCTIONAL_TESTING/UNIT_CODE_FUNCTIONAL_TESTING_001.png`
   - Path: [UNIT_CODE_FUNCTIONAL_TESTING_001.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/WHITE_BOX/UNIT_CODE_FUNCTIONAL_TESTING/UNIT_CODE_FUNCTIONAL_TESTING_001.png)

- **Raw Execution Log:** [`testing/execution_logs/unit_code_functional_execution.log`](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/unit_code_functional_execution.log)

---

### 14. Limitations
Testing verifies unit algorithm correctness; macro-level load effects on hot score rankings were evaluated in feed tests.
