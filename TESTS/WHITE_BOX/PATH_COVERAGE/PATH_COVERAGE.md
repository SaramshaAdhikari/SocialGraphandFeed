# Path Coverage Report

---

### 1. Objective
To construct a Control Flow Graph (CFG) for a critical security function and execute all independent basis paths through its decision logic.

---

### 2. Scope
Covers AuthService.login authentication control flow graph: email resolution, password verification, account lock checking, and token issuance.

---

### 3. Test Environment
Local testing workspace with TypeScript and CFG path analyzer. Baseline commit 94540883ab99b8862ac995fa9afebc2e9eadaa16.

---

### 4. Test Setup and Preconditions
1. Control flow graph constructed for AuthService.login.
2. Cyclomatic complexity V(G) = 4 computed, defining exactly 4 independent basis paths.

---

### 5. Test Cases
| Path ID | CFG Decision Flow | Test Input / Condition | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **PATH-001** | User Not Found Path | Invalid email (`user = null`) | Throws `AppError.unauthorized('Invalid email or password')` | Path 1 executed cleanly | **PASS** |
| **PATH-002** | Invalid Password Path | Valid user, invalid password | Throws `AppError.unauthorized('Invalid email or password')` | Path 2 executed cleanly | **PASS** |
| **PATH-003** | Account Locked Path | Valid user & password, `is_locked = true` | Throws `AppError.forbidden('Account is temporarily suspended')` | Path 3 executed cleanly | **PASS** |
| **PATH-004** | Successful Authentication | Valid user & password, active account | Emits session token and user summary | Path 4 executed cleanly | **PASS** |

---

### 6. Actual Test Code or Manual Procedure
**Test Script Location:** [`TESTS/TEST_SCRIPTS/WHITE_BOX/PATH_COVERAGE/test_path_coverage.ts`](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/TEST_SCRIPTS/WHITE_BOX/PATH_COVERAGE/test_path_coverage.ts)

```typescript
console.log('=== RUNNING CONTROL FLOW GRAPH (CFG) BASIS PATH SUITE ===');
// Target: AuthService.login
// CFG Nodes = 8, Edges = 10, Predicates = 3
// Cyclomatic Complexity V(G) = E - N + 2 = 10 - 8 + 2 = 4 Basis Paths
for (const p of basisPaths) {
  const result = executePath(p);
  assert.strictEqual(result.outcome, p.expectedOutcome);
}
```

---

### 7. Execution Command
```bash
npx tsx TESTS/TEST_SCRIPTS/WHITE_BOX/PATH_COVERAGE/test_path_coverage.ts
```

---

### 8. Expected Results
All 4 independent basis paths in AuthService.login are executed 100%, while classifying system-wide path coverage as PARTIAL due to combinatorial explosion.

---

### 9. Actual Results
100% of the 4 basis paths executed for the target routine. System-wide path coverage is formally classified as PARTIAL.

---

### 10. Execution Summary
- **Total Test Cases / Assertions:** 4
- **Passed:** 4
- **Failed:** 0
- **Blocked / Infeasible:** 0
- **Final Classification Status:** **PARTIAL**

---

### 11. Defect Summary
No path execution defects. All branches in the authentication routine produce expected outcomes.

---

### 12. Risk Analysis
Low risk for authentication routines. In large software systems, 100% path coverage of every file is mathematically intractable ($2^N$ paths).

---

### 13. Screenshot and Evidence References
1. **CFG basis path execution log and complexity formula:**
   - File: `SCREENSHOTS/WHITE_BOX/PATH_COVERAGE/PATH_COVERAGE_001.png`
   - Path: [PATH_COVERAGE_001.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/WHITE_BOX/PATH_COVERAGE/PATH_COVERAGE_001.png)

- **Raw Execution Log:** [`testing/execution_logs/path_coverage_execution.log`](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/path_coverage_execution.log)

---

### 14. Limitations
100% path coverage is achievable only for bounded individual functions. Due to combinatorial path explosion, whole-application path coverage is mathematically intractable and is classified as PARTIAL.
