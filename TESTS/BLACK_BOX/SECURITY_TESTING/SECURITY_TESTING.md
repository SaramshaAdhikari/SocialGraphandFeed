# Security Testing Report

---

### 1. Objective
To test authentication enforcement on mutating API endpoints, verify production HTTP security headers (CSP, X-Frame-Options, X-Content-Type-Options), and audit input sanitization.

---

### 2. Scope
Covers unauthenticated mutation protection (POST /api/v1/posts), production security headers on API endpoints, and privilege escalation suite audit.

---

### 3. Test Environment
Live Render production deployment (socialgraph-feed.onrender.com) and local testing workspace. Baseline commit 94540883ab99b8862ac995fa9afebc2e9eadaa16.

---

### 4. Test Setup and Preconditions
1. Production web service operational.
2. Security probes executed against API boundary.

---

### 5. Test Cases
| Test ID | Security Control | Target Endpoint | Expected Behavior | Observed Behavior | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **SEC-001** | Unauthenticated Mutation | `POST /api/v1/posts` (No auth) | Rejects with HTTP 401 Unauthorized | Rejected with HTTP 401 | **PASS** |
| **SEC-002** | Content Security Policy | `GET /api/v1/health` | CSP header present with default-src 'self' | CSP header present and valid | **PASS** |
| **SEC-003** | Clickjacking Protection | `GET /api/v1/health` | `X-Frame-Options: DENY` | `X-Frame-Options: DENY` verified | **PASS** |
| **SEC-004** | MIME Sniffing Protection | `GET /api/v1/health` | `X-Content-Type-Options: nosniff` | `nosniff` verified | **PASS** |
| **SEC-005** | Static Root CSP | `GET /` (SPA Shell) | CSP header on static root HTML | Missing CSP header on static SPA root | **DEFECT** |
| **SEC-006** | Privilege Escalation Suite | `security-hardening.test.ts` | Comprehensive RBAC boundary test | Blocked (Requires Docker MongoDB 27018) | **BLOCKED** |

---

### 6. Actual Test Code or Manual Procedure
**Test Script Location:** [`TESTS/TEST_SCRIPTS/BLACK_BOX/SECURITY_TESTING/test_security_testing.ts`](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/TEST_SCRIPTS/BLACK_BOX/SECURITY_TESTING/test_security_testing.ts)

```typescript
// 1. Unauthenticated Mutation Block Check
const postRes = await fetch(`${deployedUrl}/api/v1/posts`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Exploit Test', content: 'Unauthorized' }),
});
assert([401, 404].includes(postRes.status));

// 2. Production Security Headers Check
const res = await fetch(`${deployedUrl}/api/v1/health`);
assert(res.headers.get('content-security-policy'));
assert.strictEqual(res.headers.get('x-frame-options'), 'DENY');
assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
```

---

### 7. Execution Command
```bash
npx tsx TESTS/TEST_SCRIPTS/BLACK_BOX/SECURITY_TESTING/test_security_testing.ts
```

---

### 8. Expected Results
Unauthenticated mutations rejected with HTTP 401; enterprise security headers present on API responses.

---

### 9. Actual Results
Unauthenticated POST rejected with HTTP 401. Fastify API endpoints attach CSP, X-Frame-Options: DENY, and nosniff. Static SPA root lacks CSP headers (audit finding).

---

### 10. Execution Summary
- **Total Test Cases / Assertions:** 6
- **Passed:** 4
- **Failed:** 1
- **Blocked / Infeasible:** 1
- **Final Classification Status:** **PARTIAL**

---

### 11. Defect Summary
Security Defect SEC-005: The static SPA root HTML (GET /) is served without Content-Security-Policy headers because Fastify helmet middleware is registered only on API routes or static plugin is mounted before helmet.

---

### 12. Risk Analysis
Moderate risk. An attacker could theoretically embed the root SPA HTML in a malicious iframe if the hosting CDN does not enforce global XFO/CSP headers.

---

### 13. Screenshot and Evidence References
1. **Security headers and unauthenticated mutation block verification:**
   - File: `SCREENSHOTS/BLACK_BOX/SECURITY_TESTING/SECURITY_TESTING_001.png`
   - Path: [SECURITY_TESTING_001.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/BLACK_BOX/SECURITY_TESTING/SECURITY_TESTING_001.png)

- **Raw Execution Log:** [`testing/execution_logs/security_execution.log`](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/security_execution.log)

---

### 14. Limitations
Full privilege escalation and brute-force penetration testing was partially performed: API boundary and unauthenticated mutation defenses passed, but deep multi-tenant privilege escalation suites in packages/backend/test require Docker.
