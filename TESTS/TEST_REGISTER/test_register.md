# SocialGraph — Central Test Case Register & Final Evidence Audit

**Audit Completion Date:** November 23, 2026  
**Auditor:** Software Testing & Quality Assurance Agent  
**Baseline Commit:** `94540883ab99b8862ac995fa9afebc2e9eadaa16` (Verified against live Render production deployment)  
**Production URL:** `https://socialgraph-feed.onrender.com` (Render Web Service, Singapore Region)  
**Status:** Formally Audited, Reconciled & Defended (Zero Inflation)  

---

## 1. Master Testing Execution & Script Nature Summary

| Script Nature Classification | Total Scripts | Primary Techniques Included | Genuine Automated Tests / Assertions | Final Evaluation Status |
| :--- | :---: | :--- | :---: | :---: |
| **Automated Behavioral & Contract Tests** | **16** | Unit (BB-01), Integration (BB-02), System (BB-03), Functional (BB-04), Acceptance (BB-05), Scenario (BB-06), Defect Bash (BB-07), I18n (BB-13), Language Compatibility (BB-17), Localization (BB-15), Security (BB-19), BVA (BVA-01), Negative (NEG-01), Unit Code (WB-02), Path CFG (WB-04), Condition (WB-05) | **382 unique assertions / tests** | 12 PASS, 4 PARTIAL |
| **Static Inspection & Coverage Extraction Scripts** | **10** | Enabling (BB-14), Fake Language (BB-16), Configuration (BB-18), Interoperability (BB-11), Performance Build (BB-12), Desk Checking (WB-01), Complexity (WB-08), Statement Coverage (WB-03), Function Coverage (WB-06), Coverage Table (WB-07) | *Static tools / measurements* (V8 Coverage & AST metrics) | 10 PASS (Tool executed & metrics measured) |
| **Documentation & Limitation Checks (Not Performed)** | **6** | Scalability (BB-08), Reliability (BB-09), Stress (BB-10), Recovery (BB-20), Alpha (BB-21), Beta (BB-22) | *0 automated tests* (Formal limitation justifications) | 2 PARTIAL, 4 NOT PERFORMED |
| **TOTALS** | **32** | **32 Techniques** | **382 Automated Tests** | **22 PASS, 6 PARTIAL, 4 NOT PERFORMED** |

---

## 2. Quantitative Verification & Numerical Dissections

### A. Frontend & Backend Automated Unit Test Counts
* **Frontend Vitest Unit Tests (`packages/frontend/src/test/`):** **292 passed tests** across 24 test suites (`npm run test:frontend`).  
  * Note: The functional (74), acceptance (17), scenario (79), and defect bash (19) tests are modular sub-suites included within this 292-test suite collection.
* **Backend Vitest Unit Tests (`packages/backend/test/serialization.test.ts`):** **6 passed tests** (8ms duration).
* **Total Automated Unit Tests in Monorepo:** **298 tests** ($292 + 6 = 298$).
* *Resolution of Inconsistency:* The figure 298 refers to the **total monorepo unit tests** (292 frontend + 6 backend), not frontend alone.

### B. Assertion Count Correction (Dismantling Previous 7,121+ Inflation)
The previously cited total of "7,121+ assertions" was an error caused by summing V8 statement counts (5,594), function counts (645), and branch counts (437) into test assertion totals. In formal QA, source code constructs and AST nodes are **never** counted as test assertions.
* **Genuine Automated Assertions / Executed Tests:**
  * Frontend Component Vitest Tests: **292**
  * Backend Serialization Vitest Tests: **6**
  * Boundary Value Analysis (`test_bva.ts`): **32**
  * Negative Testing Security Payloads (`test_negative.ts`): **12**
  * Live HTTP Network Probes (`test_integration_testing.ts`, `test_system_testing.ts`, `test_security_testing.ts`, `test_language_compatibility.ts`): **17**
  * Internal Code & Logic Truth-Tables (`test_unit_code_functional.ts`, `test_path_coverage.ts`, `test_condition_coverage.ts`, `test_i18n.ts`, `test_localization.ts`): **23**
  * **Verified Total Automated Test Assertions:** **382** (Zero synthetic inflation).

### C. Frontend V8 Coverage Breakdown (Empirically Verified)
* **Statement Coverage:** **34.00%** (1,902 / 5,594 statements covered)
* **Line Coverage:** **36.16%** (2,023 / 5,594 lines covered)
* **Branch Coverage:** **33.65%** (215 / 639 branches covered — *corrected from prior misquoted 49.20%*)
* **Function Coverage:** **24.48%** (158 / 645 functions invoked)
* *Assessment:* Running the coverage tool succeeded, but the figures reveal that **~66% of frontend statements and ~75% of functions remain unexercised** by automated tests (predominantly in `GraphPage.tsx` at 13.03% statement coverage and `MessagesPage.tsx` at 14.47%).

---

## 3. Black Box Testing Register (22 Techniques)

| ID | Technique | Primary Modules | Script Path | Script Nature | Assertions / Cases | Status | Report Link | Evidence Logs & Screenshots |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **BB-01** | Unit Testing | MOD-001, 003, 012, 015 | `test_unit_testing.ts` | Vitest Wrapper | 298 tests (292 fe + 6 be) | **PASS** | [UNIT_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/BLACK_BOX/UNIT_TESTING/UNIT_TESTING.md) | `UNIT_TESTING_001.png`, `002.png`, `unit_testing_execution.log` |
| **BB-02** | Integration Testing | MOD-001, 002, 006, 014 | `test_integration_testing.ts` | Live HTTP Probes | 5 live network checks | **PARTIAL** | [INTEGRATION_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/BLACK_BOX/INTEGRATION_TESTING/INTEGRATION_TESTING.md) | `INTEGRATION_TESTING_001.png`, `002.png`, `integration_testing_execution.log` |
| **BB-03** | System Testing | Platform (MOD-001 to 015) | `test_system_testing.ts` | Live HTTP Probes | 4 live checks (DOM/Bundle) | **PASS** | [SYSTEM_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/BLACK_BOX/SYSTEM_TESTING/SYSTEM_TESTING.md) | `SYSTEM_TESTING_001.png` - `003.png`, `system_testing_execution.log` |
| **BB-04** | Functional Testing | MOD-001, 003, 005, 007 | `test_functional_testing.ts` | Vitest Sub-Suites | 74 functional tests | **PASS** | [FUNCTIONAL_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/BLACK_BOX/FUNCTIONAL_TESTING/FUNCTIONAL_TESTING.md) | `FUNCTIONAL_TESTING_001.png` - `003.png`, `functional_testing_execution.log` |
| **BB-05** | Acceptance Testing | UX Standards & Responsive | `test_acceptance_testing.ts` | Vitest Sub-Suites | 17 UX layout tests | **PASS** | [ACCEPTANCE_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/BLACK_BOX/ACCEPTANCE_TESTING/ACCEPTANCE_TESTING.md) | `ACCEPTANCE_TESTING_001.png`, `002.png`, `acceptance_testing_execution.log` |
| **BB-06** | Scenario Testing | MOD-001, 002, 003, 004, 007 | `test_scenario_testing.ts` | Vitest Sub-Suites | 79 user journey tests | **PASS** | [SCENARIO_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/BLACK_BOX/SCENARIO_TESTING/SCENARIO_TESTING.md) | `SCENARIO_TESTING_001.png` - `003.png`, `scenario_testing_execution.log` |
| **BB-07** | Defect Bash Elimination | MOD-002, 003, 007, 015 | `test_defect_bash.ts` | Vitest Sub-Suites | 19 regression tests | **PASS** | [DEFECT_BASH_ELIMINATION.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/BLACK_BOX/DEFECT_BASH_ELIMINATION/DEFECT_BASH_ELIMINATION.md) | `DEFECT_BASH_ELIMINATION_001.png`, `002.png`, `defect_bash_execution.log` |
| **BB-08** | Scalability Testing | MOD-006 (Feed Fanout) | `test_scalability.ts` | Limitation Check | 0 automated tests | **NOT PERFORMED** | [SCALABILITY_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/BLACK_BOX/SCALABILITY_TESTING/SCALABILITY_TESTING.md) | `SCALABILITY_TESTING_001.png`, `scalability_execution.log` |
| **BB-09** | Reliability Testing | MOD-001, 006, 014 | `test_reliability.ts` | Limitation Check | 0 automated tests | **NOT PERFORMED** | [RELIABILITY_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/BLACK_BOX/RELIABILITY_TESTING/RELIABILITY_TESTING.md) | `RELIABILITY_TESTING_001.png`, `reliability_execution.log` |
| **BB-10** | Stress Testing | MOD-001 (Rate Limit), MOD-006 | `test_stress.ts` | Limitation Check | 0 automated tests | **NOT PERFORMED** | [STRESS_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/BLACK_BOX/STRESS_TESTING/STRESS_TESTING.md) | `STRESS_TESTING_001.png`, `stress_execution.log` |
| **BB-11** | Interoperability Testing | MOD-012, MOD-014, Browsers | `test_interoperability.ts` | Static FS Check | 5 existence checks | **PASS** | [INTEROPERABILITY_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/BLACK_BOX/INTEROPERABILITY_TESTING/INTEROPERABILITY_TESTING.md) | `INTEROPERABILITY_TESTING_001.png`, `interoperability_execution.log` |
| **BB-12** | Performance Testing | MOD-006, Frontend Bundle | `test_performance.ts` | Build Benchmark | 2 asset footprint metrics | **PASS** | [PERFORMANCE_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/BLACK_BOX/PERFORMANCE_TESTING/PERFORMANCE_TESTING.md) | `PERFORMANCE_TESTING_001.png`, `performance_execution.log` |
| **BB-13** | Internationalization | MOD-003, MOD-004, UTF-8 | `test_i18n.ts` | Schema Assertions | 5 UTF-8 script assertions | **PASS** | [INTERNATIONALIZATION_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/BLACK_BOX/INTERNATIONALIZATION_TESTING/INTERNATIONALIZATION_TESTING.md) | `INTERNATIONALIZATION_TESTING_001.png`, `i18n_execution.log` |
| **BB-14** | Enabling Testing | Configuration Toggles | `test_enabling.ts` | Env Var Inspection | 3 flag state checks | **PASS** | [ENABLING_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/BLACK_BOX/ENABLING_TESTING/ENABLING_TESTING.md) | `ENABLING_TESTING_001.png`, `enabling_execution.log` |
| **BB-15** | Localization Testing | Relative Time & Date Display | `test_localization.ts` | Logic Assertions | 3 relative time assertions | **PARTIAL** | [LOCALIZATION_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/BLACK_BOX/LOCALIZATION_TESTING/LOCALIZATION_TESTING.md) | `LOCALIZATION_TESTING_001.png`, `localization_execution.log` |
| **BB-16** | Fake Language Testing | Pseudo-Localization Layout | `test_fake_language.ts` | String Transform Check | 4 string expansion checks | **PASS** | [FAKE_LANGUAGE_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/BLACK_BOX/FAKE_LANGUAGE_TESTING/FAKE_LANGUAGE_TESTING.md) | `FAKE_LANGUAGE_TESTING_001.png`, `fake_language_execution.log` |
| **BB-17** | Language Compatibility | Accept-Language Headers | `test_language_compatibility.ts` | Live HTTP Probes | 4 live header HTTP checks | **PASS** | [LANGUAGE_COMPATIBILITY_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/BLACK_BOX/LANGUAGE_COMPATIBILITY_TESTING/LANGUAGE_COMPATIBILITY_TESTING.md) | `LANGUAGE_COMPATIBILITY_TESTING_001.png`, `language_compatibility_execution.log` |
| **BB-18** | Configuration Testing | Local vs Production Env | `test_configuration.ts` | Setup Validator Check | 2 diagnostic output checks | **PASS** | [CONFIGURATION_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/BLACK_BOX/CONFIGURATION_TESTING/CONFIGURATION_TESTING.md) | `CONFIGURATION_TESTING_001.png`, `configuration_execution.log` |
| **BB-19** | Security Testing | MOD-001, MOD-003, Headers | `test_security_testing.ts` | Live HTTP Probes | 4 live security assertions | **PARTIAL** | [SECURITY_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/BLACK_BOX/SECURITY_TESTING/SECURITY_TESTING.md) | `SECURITY_TESTING_001.png`, `security_execution.log` |
| **BB-20** | Recovery Testing | MOD-014, Server Signals | `test_recovery.ts` | Limitation Check | 0 automated tests | **PARTIAL** | [RECOVERY_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/BLACK_BOX/RECOVERY_TESTING/RECOVERY_TESTING.md) | `RECOVERY_TESTING_001.png`, `recovery_execution.log` |
| **BB-21** | Alpha Testing | All Modules | `test_alpha.ts` | Limitation Check | 0 automated user tests | **PARTIAL** | [ALPHA_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/BLACK_BOX/ALPHA_TESTING/ALPHA_TESTING.md) | `ALPHA_TESTING_001.png`, `alpha_execution.log` |
| **BB-22** | Beta Testing | External User Cohorts | `test_beta.ts` | Limitation Check | 0 field tests | **NOT PERFORMED** | [BETA_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/BLACK_BOX/BETA_TESTING/BETA_TESTING.md) | `BETA_TESTING_001.png`, `beta_execution.log` |

---

## 4. White Box Testing Register (8 Techniques)

| ID | Technique | Primary Target | Script Path | Script Nature | Evaluated Value | Status | Report Link | Evidence Logs & Screenshots |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **WB-01** | Desk Checking | MOD-001, MOD-002 (`UserService`) | `desk_checking_walkthrough.ts` | Manual Trace Doc | 7 trace steps | **PASS** | [DESK_CHECKING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/WHITE_BOX/DESK_CHECKING/DESK_CHECKING.md) | `DESK_CHECKING_001.png`, `desk_checking_execution.log` |
| **WB-02** | Unit/Code Functional | HotScore, Serialization, AppError | `test_unit_code_functional.ts` | Unit Code Assertions | 5 code-level assertions | **PASS** | [UNIT_CODE_FUNCTIONAL_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/WHITE_BOX/UNIT_CODE_FUNCTIONAL_TESTING/UNIT_CODE_FUNCTIONAL_TESTING.md) | `UNIT_CODE_FUNCTIONAL_TESTING_001.png`, `unit_code_functional_execution.log` |
| **WB-03** | Statement Coverage | Frontend Codebase (57 files) | `run_statement_coverage.ts` | V8 Tool Reporter | 34.00% Statements (36.16% Lines) | **PASS** | [STATEMENT_COVERAGE.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/WHITE_BOX/STATEMENT_COVERAGE/STATEMENT_COVERAGE.md) | `STATEMENT_COVERAGE_001.png`, `statement_coverage_execution.log` |
| **WB-04** | Path Coverage | `AuthService.login` CFG | `test_path_coverage.ts` | Model CFG Assertions | 4 basis path assertions | **PARTIAL** | [PATH_COVERAGE.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/WHITE_BOX/PATH_COVERAGE/PATH_COVERAGE.md) | `PATH_COVERAGE_001.png`, `path_coverage_execution.log` |
| **WB-05** | Condition Coverage | Proxy & Idempotency Predicates | `test_condition_coverage.ts` | Truth-Table Assertions | 6 truth-table assertions | **PASS** | [CONDITION_COVERAGE.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/WHITE_BOX/CONDITION_COVERAGE/CONDITION_COVERAGE.md) | `CONDITION_COVERAGE_001.png`, `condition_coverage_execution.log` |
| **WB-06** | Function Coverage | Frontend & Shared Constructors | `run_function_coverage.ts` | V8 Tool Reporter | 24.48% Functions (158 / 645) | **PASS** | [FUNCTION_COVERAGE.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/WHITE_BOX/FUNCTION_COVERAGE/FUNCTION_COVERAGE.md) | `FUNCTION_COVERAGE_001.png`, `function_coverage_execution.log` |
| **WB-07** | Code Coverage Testing | Monorepo Unit Test Suites | `run_code_coverage.ts` | V8 Tool Reporter | Full V8 Coverage Matrix | **PASS** | [CODE_COVERAGE_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/WHITE_BOX/CODE_COVERAGE_TESTING/CODE_COVERAGE_TESTING.md) | `CODE_COVERAGE_TESTING_001.png`, `code_coverage_execution.log` |
| **WB-08** | Code Complexity | Core Services & Page Views | `analyze_complexity.ts` | Static AST Analyzer | $V(G) = 10 \text{ to } 190$ across 8 files | **PASS** | [CODE_COMPLEXITY_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/WHITE_BOX/CODE_COMPLEXITY_TESTING/CODE_COMPLEXITY_TESTING.md) | `CODE_COMPLEXITY_TESTING_001.png`, `code_complexity_execution.log` |

---

## 5. Specialized Disciplines Register

| ID | Technique | Target Constraints | Script Path | Script Nature | Assertions / Cases | Status | Report Link | Evidence Logs & Screenshots |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **BVA-01** | Boundary Value Analysis | Username, Bio, Title, Content, Media, Tags, Comments | `test_bva.ts` | TypeBox Assertions | 32 boundary assertions | **PASS** | [BOUNDARY_VALUE_ANALYSIS.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/BOUNDARY_VALUE_ANALYSIS/BOUNDARY_VALUE_ANALYSIS.md) | `BOUNDARY_VALUE_ANALYSIS_001.png` - `004.png`, `bva_execution.log` |
| **NEG-01** | Negative Testing | Malformed emails, prototype pollution, injection, extra properties | `test_negative.ts` | TypeBox Assertions | 12 security assertions | **PASS** | [NEGATIVE_TESTING.md](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/TESTS/NEGATIVE_TESTING/NEGATIVE_TESTING.md) | `NEGATIVE_TESTING_001.png` - `003.png`, `negative_execution.log` |

---

## 6. Defect Catalog & Architectural Findings

| Finding ID | Classification | Location / Endpoint | Exact Description & Evidence | Remediation / Future Roadmap |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-005** | **Genuine Security Defect** | `GET https://socialgraph-feed.onrender.com/` (`production-server.mjs:57-63`) | The SPA root HTML document is served with **no security headers** (missing `Content-Security-Policy`, missing `X-Frame-Options: DENY`, missing `X-Content-Type-Options: nosniff`). Fastify Helmet was only attached to `/api/*` and `/uploads/*` upstream routes, leaving the HTML document vulnerable to Clickjacking framing attacks. | Apply security headers directly inside `production-server.mjs` on static `.html` responses or configure global headers in the hosting CDN. |
| **LOC-005** | **Unimplemented Feature** *(Not a defect)* | `packages/frontend/src/` | The application lacks an internationalization UI resource catalog (e.g. `i18next`). Hardcoded English strings prevent translating the UI into French, Spanish, Japanese, or German. (Existing relative time formatter works correctly in English). | Extract hardcoded React JSX strings into JSON translation catalogs (`en.json`, `es.json`) in future internationalization sprints. |
| **DOCKER-001**| **Infrastructure Limitation** | `packages/backend/test/` | Backend mutating integration suites (`cache-consistency.test.ts`, `distributed-rate-limit.test.ts`, `security-hardening.test.ts`) require isolated MongoDB (port 27018) and Redis (port 6380) instances. Blocked because `com.docker.service` is stopped on the Windows host. | Start the Docker service on the host machine to execute backend integration tests. |
