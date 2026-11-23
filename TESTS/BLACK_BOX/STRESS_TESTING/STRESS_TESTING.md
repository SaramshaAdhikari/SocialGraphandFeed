# Stress Testing Report

---

### 1. Objective
To determine system stability, error handling, and degradation behavior when pushed beyond normal operational capacity limits.

---

### 2. Scope
Covers rate limit saturating bursts, high-frequency request flooding, and resource exhaustion resilience.

---

### 3. Test Environment
Render Web Service (Singapore) and local workstation. Baseline commit 94540883ab99b8862ac995fa9afebc2e9eadaa16.

---

### 4. Test Setup and Preconditions
1. Rate limit configuration inspected in packages/backend/src/config/env.ts.
2. Production deployment safety directives audited.

---

### 5. Test Cases
| Test ID | Stress Scenario | Target Component | Expected Behavior | Actual Behavior | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **STR-001** | High-Volume DDoS Flood | Live Render Endpoint | Rejects excess requests with HTTP 429 | Prohibited by safety rules (DDoS on cloud host) | **BLOCKED** |
| **STR-002** | Local Rate Limit Saturation | `distributed-rate-limit.test.ts` | Slotted window blocks after limit | Blocked (Requires Docker Redis 6380) | **BLOCKED** |
| **STR-003** | Max Payload Stress | Post creation payload | Rejects payload exceeding 10MB | Verified via BVA (TypeBox rejects >40k chars) | **PASS** |

---

### 6. Actual Test Code or Manual Procedure
**Test Script Location:** [`TESTS/TEST_SCRIPTS/BLACK_BOX/STRESS_TESTING/test_stress.ts`](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/TEST_SCRIPTS/BLACK_BOX/STRESS_TESTING/test_stress.ts)

```typescript
console.log('=== STRESS TESTING INFRASTRUCTURE & SAFETY AUDIT ===');
// Live Render production cluster must not be subjected to volumetric stress floods
// Local distributed rate limit suite requires Redis on port 6380
// Status: NOT PERFORMED / INFRASTRUCTURE & SAFETY BLOCKED
```

---

### 7. Execution Command
```bash
npx tsx TESTS/TEST_SCRIPTS/BLACK_BOX/STRESS_TESTING/test_stress.ts
```

---

### 8. Expected Results
Accurately report that stress testing against the live cloud instance is prohibited by safety directives, and local stress test suites require Docker.

---

### 9. Actual Results
Audited safety and infrastructure constraints. Memory limit and payload size constraints verified at unit level; volumetric stress testing is NOT PERFORMED.

---

### 10. Execution Summary
- **Total Test Cases / Assertions:** 3
- **Passed:** 1
- **Failed:** 0
- **Blocked / Infeasible:** 2
- **Final Classification Status:** **NOT PERFORMED**

---

### 11. Defect Summary
No defects identified. Payload boundaries are protected by TypeBox schemas and fastify-multipart file size limits (10MB).

---

### 12. Risk Analysis
Risk of service slowdown under sustained unmitigated DDoS attack if Cloudflare WAF rules are not activated on the production domain.

---

### 13. Screenshot and Evidence References
1. **Stress testing safety directives and infrastructure audit log:**
   - File: `SCREENSHOTS/BLACK_BOX/STRESS_TESTING/STRESS_TESTING_001.png`
   - Path: [STRESS_TESTING_001.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/BLACK_BOX/STRESS_TESTING/STRESS_TESTING_001.png)

- **Raw Execution Log:** [`testing/execution_logs/stress_execution.log`](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/stress_execution.log)

---

### 14. Limitations
Volumetric stress testing against live Render and MongoDB Atlas environments violates cloud terms of service and safety guidelines. Running it locally requires Docker Compose test containers.
