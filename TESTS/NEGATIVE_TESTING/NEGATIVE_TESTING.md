# Negative Testing Report

---

### 1. Objective
To verify system resilience, input rejection, and graceful error handling when presented with deliberately invalid, malformed, malicious, or unexpected inputs.

---

### 2. Scope
Covers malformed email addresses, prototype pollution payloads, dangerous URI schemes (javascript:), SQL/NoSQL injection tokens, extra schema properties, negative numeric counts, and non-array types.

---

### 3. Test Environment
Windows 11 workstation, Node.js v24.13.0, TypeBox v0.34.28 runtime validator. Baseline commit 94540883ab99b8862ac995fa9afebc2e9eadaa16.

---

### 4. Test Setup and Preconditions
1. TypeBox schemas loaded from built packages/shared/dist/index.js.
2. Malicious and malformed payload suites prepared.

---

### 5. Test Cases
| Test ID | Negative Input Category | Malicious / Malformed Payload | Expected Behavior | Actual Behavior | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **NEG-001** | Malformed Email | `"not-an-email"` | Rejected by email format regex | Rejected (Invalid) | **PASS** |
| **NEG-002** | Missing Email Domain | `"user@"` | Rejected by email format regex | Rejected (Invalid) | **PASS** |
| **NEG-003** | Missing Email User | `"@domain.com"` | Rejected by email format regex | Rejected (Invalid) | **PASS** |
| **NEG-004** | Prototype Pollution | `{ "__proto__": { "admin": true } }` | Blocked / ignored by schema | Extra property rejected | **PASS** |
| **NEG-005** | Dangerous URI Scheme | `"javascript:alert(1)"` | Blocked by URL scheme validator | Rejected (Invalid URL) | **PASS** |
| **NEG-006** | Data URI Exploitation | `"data:text/html,<script>alert(1)</script>"` | Blocked by URL scheme validator | Rejected (Invalid URL) | **PASS** |
| **NEG-007** | Strict Property Guard | Extra undeclared fields in payload | Rejected by `additionalProperties: false` | Rejected (Invalid) | **PASS** |
| **NEG-008** | Negative Score Count | `score: -1` for unsigned counter | Rejected by minimum value constraint | Rejected (Invalid) | **PASS** |
| **NEG-009** | Type Confusion | String passed where number expected | Rejected by type constraint | Rejected (Invalid) | **PASS** |
| **NEG-010** | Array Confusion | Object passed where array expected | Rejected by type constraint | Rejected (Invalid) | **PASS** |
| **NEG-011** | Null Byte Injection | `"username\0admin"` | Rejected by string format constraint | Rejected (Invalid) | **PASS** |
| **NEG-012** | NoSQL Injection Token | `{ "$gt": "" }` passed as string | Rejected by type constraint | Rejected (Invalid) | **PASS** |

---

### 6. Actual Test Code or Manual Procedure
**Test Script Location:** [`TESTS/TEST_SCRIPTS/NEGATIVE_TESTING/test_negative.ts`](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/TEST_SCRIPTS/NEGATIVE_TESTING/test_negative.ts)

```typescript
// 1. Email format rejection
assert.strictEqual(Value.Check(UserSummarySchema, { ...baseUser, email: 'not-an-email' }), false);
// 2. Dangerous URI scheme rejection
assert.strictEqual(Value.Check(MediaAttachmentSchema, { ...baseMedia, url: 'javascript:alert(1)' }), false);
// 3. Strict schema property guard (additionalProperties: false)
assert.strictEqual(Value.Check(CreatePostInputSchema, { title: 'T', content: 'C', maliciousField: true }), false);
```

---

### 7. Execution Command
```bash
npx tsx TESTS/TEST_SCRIPTS/NEGATIVE_TESTING/test_negative.ts
```

---

### 8. Expected Results
All 12 negative test cases are strictly rejected by the schema validation layer with zero false acceptances.

---

### 9. Actual Results
All 12 malformed and malicious payloads were rejected by the validation layer. Zero unhandled exceptions or crashes occurred.

---

### 10. Execution Summary
- **Total Test Cases / Assertions:** 12
- **Passed:** 12
- **Failed:** 0
- **Blocked / Infeasible:** 0
- **Final Classification Status:** **PASS**

---

### 11. Defect Summary
No defects detected. Fastify and TypeBox strict validation effectively filters hostile and malformed payloads at the perimeter.

---

### 12. Risk Analysis
Low risk. Input validation layers effectively mitigate injection attacks and prototype pollution vulnerabilities.

---

### 13. Screenshot and Evidence References
1. **Malformed email and prototype pollution payload rejection:**
   - File: `SCREENSHOTS/NEGATIVE_TESTING/NEGATIVE_TESTING_001.png`
   - Path: [NEGATIVE_TESTING_001.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/NEGATIVE_TESTING/NEGATIVE_TESTING_001.png)

2. **Dangerous URI scheme and script injection rejection:**
   - File: `SCREENSHOTS/NEGATIVE_TESTING/NEGATIVE_TESTING_002.png`
   - Path: [NEGATIVE_TESTING_002.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/NEGATIVE_TESTING/NEGATIVE_TESTING_002.png)

3. **Strict schema additionalProperties rejection:**
   - File: `SCREENSHOTS/NEGATIVE_TESTING/NEGATIVE_TESTING_003.png`
   - Path: [NEGATIVE_TESTING_003.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/NEGATIVE_TESTING/NEGATIVE_TESTING_003.png)

- **Raw Execution Log:** [`testing/execution_logs/negative_execution.log`](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/negative_execution.log)

---

### 14. Limitations
Testing targeted application-level request validation; network-level packet malformation (e.g. malformed TCP frames) was not evaluated.
