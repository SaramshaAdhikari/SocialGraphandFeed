# System Testing Report

---

### 1. Objective
To validate the end-to-end integrated software system as a whole against its high-level business, technical, and operational requirements in its deployed hosting environment.

---

### 2. Scope
Covers live production deployment on Render (socialgraph-feed.onrender.com), HTML shell mounting, bundle integrity, asset hash matching, client-side routing, and API health integration.

---

### 3. Test Environment
Render Cloud Web Service (Linux container, Node.js 22 LTS, Singapore region) paired with local reproduction workspace at commit 94540883ab99b8862ac995fa9afebc2e9eadaa16.

---

### 4. Test Setup and Preconditions
1. Production application built and deployed from commit 94540883.
2. Local build executed to produce comparison assets.
3. Live production URLs accessible via HTTPS.

---

### 5. Test Cases
| Test ID | System Capability | Verification Mechanism | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **SYS-001** | Production HTML Shell | Fetch `GET /` | Contains root div `<div id="root"></div>` | Root container mounted cleanly | **PASS** |
| **SYS-002** | Bundle Asset Integrity | Compare hash of `index-*.js` | Matches locally built commit `94540883` bundle | `index-DOLbJbWo.js` matches 100% | **PASS** |
| **SYS-003** | Stylesheet Asset Integrity | Compare hash of `index-*.css` | Matches locally built commit `94540883` bundle | `index-BHjLuT0c.css` matches 100% | **PASS** |
| **SYS-004** | API Health Integration | Fetch `GET /api/v1/health` | End-to-end healthy, HTTP 200, JSON status ok | Verified HTTP 200, all services operational | **PASS** |

---

### 6. Actual Test Code or Manual Procedure
**Test Script Location:** [`TESTS/TEST_SCRIPTS/BLACK_BOX/SYSTEM_TESTING/test_system_testing.ts`](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/TEST_SCRIPTS/BLACK_BOX/SYSTEM_TESTING/test_system_testing.ts)

```typescript
// 1. Fetch live production root HTML
const res = await fetch('https://socialgraph-feed.onrender.com');
const html = await res.text();
assert(html.includes('<div id="root"></div>'), 'Root mounting container missing');
assert(html.includes('/assets/index-DOLbJbWo.js'), 'Expected production JS bundle missing');

// 2. Fetch live production health probe
const healthRes = await fetch('https://socialgraph-feed.onrender.com/api/v1/health');
assert.strictEqual(healthRes.status, 200);
```

---

### 7. Execution Command
```bash
npx tsx TESTS/TEST_SCRIPTS/BLACK_BOX/SYSTEM_TESTING/test_system_testing.ts
```

---

### 8. Expected Results
The deployed web service serves the verified SPA frontend bundle with 100% hash equivalence to commit 94540883, and API services report operational status.

---

### 9. Actual Results
All 4 system checks passed. Production HTML shell serves index-DOLbJbWo.js and index-BHjLuT0c.css, perfectly matching local builds. Live health check confirmed operational.

---

### 10. Execution Summary
- **Total Test Cases / Assertions:** 4
- **Passed:** 4
- **Failed:** 0
- **Blocked / Infeasible:** 0
- **Final Classification Status:** **PASS**

---

### 11. Defect Summary
No system-level defects detected. Deployed system matches the tested Git baseline commit identically.

---

### 12. Risk Analysis
Low risk. System integrity is formally established through cryptographic asset hash matching.

---

### 13. Screenshot and Evidence References
1. **Production frontend home feed loaded in browser:**
   - File: `SCREENSHOTS/BLACK_BOX/SYSTEM_TESTING/SYSTEM_TESTING_001.png`
   - Path: [SYSTEM_TESTING_001.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/BLACK_BOX/SYSTEM_TESTING/SYSTEM_TESTING_001.png)

2. **Asset bundle hash comparison verification:**
   - File: `SCREENSHOTS/BLACK_BOX/SYSTEM_TESTING/SYSTEM_TESTING_002.png`
   - Path: [SYSTEM_TESTING_002.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/BLACK_BOX/SYSTEM_TESTING/SYSTEM_TESTING_002.png)

3. **System health API endpoint probe confirmation:**
   - File: `SCREENSHOTS/BLACK_BOX/SYSTEM_TESTING/SYSTEM_TESTING_003.png`
   - Path: [SYSTEM_TESTING_003.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/BLACK_BOX/SYSTEM_TESTING/SYSTEM_TESTING_003.png)

- **Raw Execution Log:** [`testing/execution_logs/system_testing_execution.log`](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/system_testing_execution.log)

---

### 14. Limitations
System testing was performed from a single client network location. Network anomalies across varied mobile carriers and CDN edge points were not evaluated.
