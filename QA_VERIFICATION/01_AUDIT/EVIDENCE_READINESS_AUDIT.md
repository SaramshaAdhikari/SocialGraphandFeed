# Comprehensive Evidence Readiness & Testing Technique Audit

**Course:** Software Testing and Quality Assurance (23CSE502)  
**Institution:** JAIN (Deemed-to-be University), Department of Computer Science and Engineering  
**Application Under Test:** DMND (`SocialGraphandFeed`)  
**Baseline Git Commit:** `eb1f5ba4be1edd35f148d1f18a3dc748458828fb`  
**Purpose:** Formal verification and forensic classification of all 45 assigned testing techniques, mathematical reconciliation of test execution tallies, and rigorous cataloging of all defects and technical limitations.

---

## 1. Classification Framework & Verification Standards

To guarantee absolute academic and technical integrity, every assigned testing technique is audited against its concrete codebase presence, testing harness, execution logs, and output evidence. Each technique is mapped strictly into one of seven official evaluation categories:

```
+----------------------------------------------------------------------------------------------------+
|                                 The Seven Evaluation Classifications                               |
|                                                                                                    |
|  1. Independently Executed & Verified: Executed locally during audit; raw logs and captures verified|
|  2. Previously Executed & Independently Verified: Executed in prior phase; re-verified via logs    |
|  3. Implemented but Not Reproduced: Test code exists, but reproduction constrained by host setup   |
|  4. Partially Executed: Executed in limited capacity (e.g. build benchmark or code/process audit)  |
|  5. Analytically Evaluated: Rigorous theoretical/static inspection (e.g. truth tables, basis paths)|
|  6. Not Performed: Technique deferred or omitted with documented academic/engineering justification|
|  7. Not Applicable: Technique fundamentally incompatible with DMND architecture                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Definitive Classification of the 45 Assigned Testing Techniques

| # | Assigned Syllabus Technique | Primary Category | Official Verification Classification | Executed Count / Scope | Supporting Evidence Script / Log | Primary Visual Evidence | Source Code Under Test |
|:---:|:---|:---|:---:|:---:|:---|:---|:---|
| **1** | **Non-Functional Testing** | Non-Functional | **Partially Executed** | 4 metrics | `performance_execution.log` | `APP-019`, `ENV-001` | `production-server.mjs:52-64` |
| **2** | **Regression Testing** | Verification | **Independently Executed & Verified** | 292 tests | `frontend_vitest_execution.log` | `TERM-001` | `packages/frontend/src/**/*.tsx` |
| **3** | **Equivalence Partitioning** | Black-Box | **Independently Executed & Verified** | 19 cases | `equivalence_partitioning_execution.log` | `TERM-003` | `packages/shared/src/schemas/post.ts` |
| **4** | **Boundary Value Analysis** | Black-Box | **Independently Executed & Verified** | 32 cases | `bva_and_negative_execution.log` | `TERM-005` | `packages/shared/src/schemas/*.ts` |
| **5** | **Decision Table Testing** | Functional | **Previously Executed & Indep. Verified** | 4 rules | `backend_integration_suites.log` | `APP-021` | `AuthService.ts:43-56` |
| **6** | **State Transition Testing / State-Based** | Black-Box | **Previously Executed & Indep. Verified** | 5 states | `backend_integration_suites.log` | `APP-013` | `packages/backend/src/routes/posts.routes.ts` |
| **7** | **Exploratory Testing** | Black-Box | **Independently Executed & Verified** | 1 charter | `verified_e2e_execution.log` | `APP-005`, `APP-004` | `GraphPage.tsx`, `ExplorePage.tsx` |
| **8** | **Random Testing (Monkey Testing)** | Black-Box | **Independently Executed & Verified** | 50 dispatches | `error_guessing_execution.log` | `TERM-004` | `SearchPage.tsx`, `FeedService.ts` |
| **9** | **Requirements-Based Testing** | Verification | **Previously Executed & Indep. Verified** | 15 criteria | `acceptance_testing_execution.log` | `TERM-007` | Entire API route layer |
| **10** | **Cause-Effect Graphing** | Black-Box | **Previously Executed & Indep. Verified** | 6 causes | `backend_integration_suites.log` | `APP-002`, `APP-003` | `FeedService.ts:26-55` |
| **11** | **Compatibility Testing** | Non-Functional | **Independently Executed & Verified** | 3 viewports | `verified_e2e_execution.log` | `APP-024`, `APP-025` | `packages/frontend/src/index.css` |
| **12** | **User Documentation Testing** | Non-Functional | **Independently Executed & Verified** | 1 audit | `configuration_execution.log` | `ENV-001` | `README.md`, `ENVIRONMENT_SPECIFICATIONS.md` |
| **13** | **Domain Testing** | Functional | **Independently Executed & Verified** | 8 bounds | `bva_and_negative_execution.log` | `TERM-005` | `packages/shared/src/schemas/media.ts` |
| **14** | **Error Guessing Testing** | Black-Box | **Independently Executed & Verified** | 10 vectors | `error_guessing_execution.log` | `TERM-004` | `AuthService.ts`, `production-server.mjs` |
| **15** | **White-Box Testing** | White-Box | **Previously Executed & Indep. Verified** | 2 structures | `desk_checking_execution.log` | `TERM-002` | `packages/backend/src/db/transaction.ts:5-25` |
| **16** | **Desk Checking** | White-Box | **Analytically Evaluated** | 1 script | `desk_checking_execution.log` | `TERM-006` | `RateLimitService.ts:25-36` |
| **17** | **Unit / Code Functional Testing** | White-Box | **Independently Executed & Verified** | 8 assertions | `unit_code_functional_execution.log` | `TERM-001` | `packages/frontend/src/utils/date.ts:1-20` |
| **18** | **Functional Testing** | Functional | **Independently Executed & Verified** | 85 tests | `frontend_vitest_execution.log` | `APP-006`, `APP-008` | `packages/frontend/src/components/*` |
| **19** | **Statement Coverage** | White-Box | **Independently Executed & Verified** | 34.00% stmts | `code_coverage_execution.log` | `TERM-001` | Full Frontend Monorepo |
| **20** | **Path Coverage** | White-Box | **Analytically Evaluated** | 4 paths | `path_coverage_execution.log` | `E2E-001` | `AuthService.ts:43-56` |
| **21** | **Condition Coverage** | White-Box | **Analytically Evaluated** | 2 predicates | `condition_coverage_execution.log` | `APP-021` | `production-server.mjs`, `FeedService.ts` |
| **22** | **Function Coverage** | White-Box | **Independently Executed & Verified** | 31.12% funcs | `function_coverage_execution.log` | `TERM-001` | Full Frontend Monorepo |
| **23** | **Code Coverage Testing** | White-Box | **Independently Executed & Verified** | 4 metrics | `v8_coverage_execution.log` | `TERM-001` | Full Frontend Monorepo |
| **24** | **Code Complexity Testing** | White-Box | **Independently Executed & Verified** | 184 functions | `cyclomatic_complexity_execution.log` | `TERM-006` | Python AST McCabe Analysis |
| **25** | **Unit Testing** | White-Box | **Independently Executed & Verified** | 298 tests | `frontend_vitest_execution.log`, `backend_serialization_execution.log` | `TERM-001`, `TERM-002` | UI components & serialization tests |
| **26** | **Integration Testing** | Grey-Box | **Previously Executed & Indep. Verified** | 36 suites | `backend_integration_suites.log` | `TERM-002` | `packages/backend/src/tests/integration/` |
| **27** | **System Testing** | Black-Box | **Independently Executed & Verified** | Full System | `verified_e2e_execution.log` | `APP-001`, `TERM-007` | `production-server.mjs` (Port 3000) |
| **28** | **Acceptance Testing** | Black-Box | **Previously Executed & Indep. Verified** | 5 workflows | `acceptance_testing_execution.log` | `E2E-003` | User Journey Specification |
| **29** | **Scenario Testing** | Black-Box | **Independently Executed & Verified** | 5 scenarios | `verified_e2e_execution.log` | `E2E-001` to `E2E-005` | Playwright Core Automation Engine |
| **30** | **Defect Bash Elimination** | Black-Box | **Independently Executed & Verified** | 1 session | `defect_bash_execution.log` | `SEC-005` | `production-server.mjs:52-64` |
| **31** | **Scalability Testing** | Non-Functional | **Implemented but Not Reproduced** | 1 suite | `scalability_execution.log` | `APP-019` | `FeedService.ts:26-55` |
| **32** | **Reliability Testing** | Non-Functional | **Previously Executed & Indep. Verified** | 1 loop | `reliability_execution.log` | `APP-019` | Fastify Error Handler & Reconnect Loop |
| **33** | **Stress Testing** | Non-Functional | **Implemented but Not Reproduced** | 1 suite | `stress_execution.log` | `ENV-001` | Workstation Safety Policy |
| **34** | **Interoperability Testing** | Functional | **Independently Executed & Verified** | 6 schemas | `interoperability_execution.log` | `APP-023` | `packages/shared/src/schemas/*` |
| **35** | **Performance Testing** | Non-Functional | **Partially Executed** | 3 benchmarks | `performance_execution.log` | `APP-019` | Build Pipeline & Diagnostics Telemetry |
| **36** | **Internationalization (I18N)** | Globalization | **Independently Executed & Verified** | 12 payloads | `i18n_execution.log` | `APP-013` | UTF-8 String Handling in Schemas |
| **37** | **Enabling Testing** | Accessibility | **Independently Executed & Verified** | 1 audit | `enabling_execution.log` | `APP-020` | HTML Form Labels & Focus Outlines |
| **38** | **Localization (L10N) Testing** | Globalization | **Previously Executed & Indep. Verified** | 1 audit | `localization_execution.log` | `APP-006` | Hardcoded Suffix Finding `LOC-005` |
| **39** | **Fake Language Testing** | Globalization | **Independently Executed & Verified** | 5 containers | `fake_language_execution.log` | `APP-001` | Pseudolocalization String Expansion |
| **40** | **Language Compatibility Testing**| Globalization | **Independently Executed & Verified** | 4 queries | `language_compatibility_execution.log` | `APP-011` | MongoDB Collation & Regex Search |
| **41** | **Configuration Testing** | Environment | **Independently Executed & Verified** | 3 configs | `configuration_execution.log` | `ENV-001` | Fastify Environment Parser |
| **42** | **Security Testing** | Non-Functional | **Independently Executed & Verified** | 5 controls | `security_execution.log` | `APP-021`, `SEC-005` | Bcrypt Work Factor 12 & Cookie Flags |
| **43** | **Recovery Testing** | Non-Functional | **Partially Executed** | 2 handlers | `recovery_execution.log` | `APP-019` | Fastify Mongo Reconnect Handlers |
| **44** | **Alpha Testing** | Operational | **Independently Executed & Verified** | 376 tests | `alpha_execution.log` | `TERM-007` | Comprehensive Local Test Harness |
| **45** | **Beta Testing** | Operational | **Not Performed** | 0 tests | `beta_execution.log` | N/A | Academic Scope Boundary |

---

## 3. Summary Distribution across Classifications

```
+----------------------------------------------------------------------------------------------------+
|                                    Technique Classification Breakdown                              |
|                                                                                                    |
|  1. Independently Executed & Verified:        27 Techniques (60.0%)                                |
|  2. Previously Executed & Indep. Verified:     9 Techniques (20.0%)                                |
|  3. Implemented but Not Reproduced:            2 Techniques ( 4.4% - Scalability & Stress)         |
|  4. Partially Executed:                        3 Techniques ( 6.7% - Non-Func, Perf, Recovery)     |
|  5. Analytically Evaluated:                    3 Techniques ( 6.7% - Desk Check, Path, Condition)  |
|  6. Not Performed:                             1 Technique  ( 2.2% - Beta Testing)                 |
|  7. Not Applicable:                            0 Techniques ( 0.0%)                                |
|  ------------------------------------------------------------------------------------------------  |
|  Total Prescribed Techniques:                 45 Techniques (100.0%)                               |
+----------------------------------------------------------------------------------------------------+
```

---

## 4. Definitive Test Results Reconciliation

### 4.1 Reconciled Local Independent Test Count: 376 Tests (100% Pass)
The platform features **376 unique test cases** executed across seven local testing engines. All 376 tests passed with zero failures and zero regressions:

```
    292 (Frontend Unit & Component Testing via Vitest / JSDOM)
  +   6 (Backend Unit Serialization Testing via Vitest)
  +  32 (Boundary Value Analysis Testing via TypeBox Compiler)
  +  12 (Negative Rejection Testing via Fastify Schema Validator)
  +  19 (Equivalence Partitioning Testing across 6 Domain Schemas)
  +  10 (Error Guessing Exploit Defense Vectors via Security Harness)
  +   5 (End-to-End Automated Browser Scenarios via Playwright Core)
  ----------------------------------------------------------------------
  = 376 Unique Independently Executed Test Cases (100% Passed)
```

*Explanation of 363 vs. 376 Reconciliation:*  
The preliminary 363 figure in early draft headers arose because the 10 Error Guessing exploit tests and 5 Playwright E2E scenarios were added to the tally after the initial draft was compiled, while 2 raw HTTP smoke probes (`/health` and `/`) were removed from formal test case counting ($363 + 10 + 5 - 2 = 376$).

### 4.2 Preservation of the Separate Backend Integration Suite (36 Suites: 33 Passed, 3 Failed)
The separate Fastify backend integration test suite in `packages/backend/src/tests/integration/` consists of 36 test files:
- **33 test suites passed.**
- **3 test suites failed.**
- Forensic audit confirmed that these 3 failures are **not application code bugs**, but **test assertion/fixture discrepancies** (`BE-INT-001`, `BE-INT-002`, `BE-INT-003`), fully documented below.

### 4.3 Preservation of the AST Cyclomatic Complexity Audit
- **184 functions audited** across backend route handlers, services, and database utilities using Python 3.12 `ast` analysis (`TERM-006`).
- **183 functions (99.5%) adhere to McCabe $CC \le 10$**, demonstrating high maintainability and low defect risk.
- **Exactly 1 function (`buildFeedPipeline` in `FeedService.ts`, Lines 26–55) exhibits $CC = 11$**, driven by compound strategy branching (`fanout_write` vs. `fanout_read`) and sorting algorithms (`hot` vs. `new` vs. `top`).

---

## 5. Master Defect, Anomaly, and Limitation Ledger

| Finding ID | Classification | Component & Exact Path | Severity | Priority | Status | Root Cause & Resolution |
|:---:|:---|:---|:---:|:---:|:---:|:---|
| **`SEC-005`** | **Genuine Code Defect** | `production-server.mjs:52-64` | Medium | P2 | Verified Genuine | The static reverse proxy streams `index.html` without attaching `Content-Security-Policy`, `X-Frame-Options: DENY`, or `X-Content-Type-Options: nosniff`. Remediation patch authored. |
| **`BE-INT-001`** | **Test Assertion Mismatch** | `packages/backend/src/tests/integration/routes.integration.test.ts` | Low | P4 | Reconciled Test Flaw | Test expects `HTTP 400 Bad Request` on unauthenticated post creation. Fastify session preHandler intercepts request and returns `HTTP 401 Unauthorized`. Fastify behavior is correct. |
| **`BE-INT-002`** | **Fixture String Mismatch** | `packages/backend/src/tests/integration/search.integration.test.ts` | Low | P4 | Reconciled Fixture Flaw | Test searches for string `"systems"` expecting user `lucas_t`. Seed expansion modified user bios, removing this exact token. Search engine operates correctly. |
| **`BE-INT-003`** | **Fixture Count Mismatch** | `packages/backend/src/tests/integration/seed.integration.test.ts` | Low | P4 | Reconciled Fixture Flaw | Test asserts `expect(usersCount).toBe(20)`. Seed database was expanded to 115 users to support social graph exploration and cluster physics. |
| **`LOC-005`** | **Architectural Limitation** | `packages/frontend/src/utils/date.ts:1-20` | Info | P5 | Reconciled Limitation | Relative timestamp formatter uses hardcoded English string suffixes (`"just now"`, `"m ago"`, `"h ago"`). Platform lacks internationalized resource bundles (`i18n`). |

---

## 6. Technical Limitations & Environmental Constraints

1. **Scalability Testing (#31):** Benchmark scripts exist in repository (`testing/benchmarks/`), but executing multi-node replica set clusters (`127.0.0.1:27018` and `6380`) requires Docker Compose, which is unavailable on this host workstation.
2. **Stress Testing (#33):** Synthetic high-concurrency saturation scripts exist, but live execution against cloud hosting would exhaust the 512MB RAM free-tier allocation and trigger rate-limiting bans.
3. **Recovery Testing (#43):** Live process killing of backend daemons was omitted to prevent terminating the public demo service; error handling and reconnection listeners were verified via code and process audit.
4. **Beta Testing (#45):** Academic laboratory scope limits evaluation to automated harnesses and internal verification; external user cohort trials were deferred to post-course development.
