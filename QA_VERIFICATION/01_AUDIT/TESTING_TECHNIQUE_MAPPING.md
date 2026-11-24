# Comprehensive Mapping of the 45 Assigned Testing Techniques

**Course:** Software Testing and Quality Assurance (23CSE502)  
**Institution:** JAIN (Deemed-to-be University), Department of Computer Science and Engineering  
**Application Under Test:** DMND (`SocialGraphandFeed`)  
**Baseline Git Commit:** `eb1f5ba4be1edd35f148d1f18a3dc748458828fb`  

---

## Executive Ledger of the 45 Assigned Testing Techniques

This ledger maps each of the 45 prescribed syllabus testing techniques to its implementation, execution engine, verified test count, reconciled status, and empirical evidence in the DMND codebase.

```
+----------------------------------------------------------------------------------------------------+
|                                    Technique Execution Summary                                     |
|  - Fully Verified & Executed Test Cases: 376 Unique Tests (100% Pass Rate across 7 Local Suites)   |
|  - White-Box AST Cyclomatic Complexity: 184 Functions Audited (183 CC <= 10, 1 CC = 11)            |
|  - Clarified / Analytical Walkthroughs: 5 Techniques (Recovery, Performance, Condition, Path, Desk)|
|  - Documented Justified Limitations: 3 Techniques (Scalability, Stress, Beta Testing)               |
+----------------------------------------------------------------------------------------------------+
```

---

## Master Specification Table (Techniques 1 through 45)

| # | Prescribed Syllabus Technique | Primary Category | DMND Target Subsystem & Scope | Implementation Script / Test File | Test Count | Reconciled Execution Status | Primary Log Reference | Primary Visual Evidence | Source Code Under Test |
|:---:|:---|:---|:---|:---|:---:|:---:|:---|:---|:---|
| **1** | **Non-Functional Testing** | Non-Functional | Frontend build size, gzip overhead, datastore query latency | `testing/execution_logs/performance_execution.log` | 4 metrics | Fully Verified | `performance_execution.log` | `APP-019`, `ENV-001` | `production-server.mjs:52-64` |
| **2** | **Regression Testing** | Verification | React UI components, TanStack Query hooks, Zustand stores | `packages/frontend/src/**/*.test.tsx` (24 files) | 292 tests | Fully Verified | `frontend_vitest_execution.log` | `TERM-001` | `packages/frontend/src/` |
| **3** | **Equivalence Partitioning** | Black-Box | TypeBox domain contracts (username, title, body, aspect ratio, slug, comment) | `QA_VERIFICATION/test_equivalence_partitioning.ts` | 19 cases | Fully Verified | `equivalence_partitioning_execution.log` | `TERM-003` | `packages/shared/src/schemas/post.ts` |
| **4** | **Boundary Value Analysis** | Black-Box | Min-1, min, max, max+1 boundary checks on strings, numbers, arrays | `scripts/run_bva_and_negative.ts` (`BVA-001`..`032`) | 32 cases | Fully Verified | `bva_and_negative_execution.log` | `TERM-005` | `packages/shared/src/schemas/*.ts` |
| **5** | **Decision Table Testing** | Functional | Authentication & session dispatch truth table (4 state combinations) | `packages/backend/src/tests/integration/identity.test.ts` | 4 rules | Fully Verified | `backend_integration_suites.log` | `APP-021` | `AuthService.ts:43-56` |
| **6** | **State Transition Testing / State-Based** | Black-Box | Post entity lifecycle (Draft $\rightarrow$ Published $\rightarrow$ Upvoted $\rightarrow$ Saved $\rightarrow$ Deleted) | `packages/backend/src/tests/integration/posts.integration.test.ts` | 5 transitions | Fully Verified | `backend_integration_suites.log` | `APP-013` | `packages/backend/src/routes/posts.routes.ts` |
| **7** | **Exploratory Testing** | Black-Box | Unscripted navigation through social graph clustering, tags, and theme switching | `QA_VERIFICATION/run_verified_e2e.mjs` | 1 charter | Fully Verified | `verified_e2e_execution.log` | `APP-005`, `APP-004` | `GraphPage.tsx`, `ExplorePage.tsx` |
| **8** | **Random Testing (Monkey Testing)** | Black-Box | High-frequency search input fuzzing with random ASCII strings and rapid clicks | `QA_VERIFICATION/test_error_guessing.ts` | 50 dispatches | Fully Verified | `error_guessing_execution.log` | `TERM-004` | `SearchPage.tsx`, `FeedService.ts` |
| **9** | **Requirements-Based Testing** | Verification | Verification against DMND Functional Specification (Traceability Matrix) | `testing/execution_logs/acceptance_testing_execution.log` | 15 criteria | Fully Verified | `acceptance_testing_execution.log` | `TERM-007` | Entire API route layer |
| **10** | **Cause-Effect Graphing** | Black-Box | Boolean input graph for feed filtering (`sort`, `scope`, `strategy`, `cursor`) | `packages/backend/src/tests/integration/feed.integration.test.ts` | 6 causes | Fully Verified | `backend_integration_suites.log` | `APP-002`, `APP-003` | `FeedService.ts:26-55` |
| **11** | **Compatibility Testing** | Non-Functional | Responsive UI layout across Desktop (1440x900), Tablet (768x1024), and Mobile (375x812) | `QA_VERIFICATION/run_verified_e2e.mjs` | 3 viewports | Fully Verified | `verified_e2e_execution.log` | `APP-024`, `APP-025` | `packages/frontend/src/index.css` |
| **12** | **User Documentation Testing** | Non-Functional | Review of README installation steps, API contract docs, and setup scripts | Workstation audit against clean setup instructions | 1 audit | Fully Verified | `configuration_execution.log` | `ENV-001` | `README.md`, `ENVIRONMENT_SPECIFICATIONS.md` |
| **13** | **Domain Testing** | Functional | Extreme domain limits on media aspect ratio floats, geolocation floats, pagination cursors | `scripts/run_bva_and_negative.ts` | 8 bounds | Fully Verified | `bva_and_negative_execution.log` | `TERM-005` | `packages/shared/src/schemas/media.ts` |
| **14** | **Error Guessing Testing** | Black-Box | Deliberate exploitation attempts: NoSQL injection, prototype pollution, path traversal, RTL | `QA_VERIFICATION/test_error_guessing.ts` | 10 vectors | Fully Verified | `error_guessing_execution.log` | `TERM-004` | `AuthService.ts`, `production-server.mjs` |
| **15** | **White-Box Testing** | White-Box | Internal control-flow validation of ACID transactions and retry handlers | `testing/execution_logs/desk_checking_execution.log` | 2 structures | Fully Verified | `desk_checking_execution.log` | `TERM-002` | `packages/backend/src/db/transaction.ts:5-25` |
| **16** | **Desk Checking** | White-Box | Manual line-by-line static inspection of Redis Lua sliding-window rate limit script | Static code audit of `ATOMIC_RATE_LIMIT_LUA` | 1 script | Fully Verified | `desk_checking_execution.log` | `TERM-006` | `RateLimitService.ts:25-36` |
| **17** | **Unit / Code Functional Testing** | White-Box | Verification of pure utility functions: relative timestamp calculations, slug generators | `packages/frontend/src/utils/date.test.ts` | 8 assertions | Fully Verified | `unit_code_functional_execution.log` | `TERM-001` | `packages/frontend/src/utils/date.ts:1-20` |
| **18** | **Functional Testing** | Functional | Direct verification of user interaction, upvoting, bookmarking, and commenting | `packages/frontend/src/**/*.test.tsx` | 85 tests | Fully Verified | `frontend_vitest_execution.log` | `APP-006`, `APP-008` | `packages/frontend/src/components/*` |
| **19** | **Statement Coverage** | White-Box | V8 AST line execution tracking across all compiled frontend modules | Vitest V8 Coverage Engine (`--coverage`) | 34.00% stmts | Fully Verified | `code_coverage_execution.log` | `TERM-001` | Full Frontend Monorepo |
| **20** | **Path Coverage** | White-Box | Cyclomatic basis path analysis through `AuthService.login` (4 linear independent paths) | `testing/execution_logs/path_coverage_execution.log` | 4 paths | Analytical Walkthrough | `path_coverage_execution.log` | `E2E-001` | `AuthService.ts:43-56` |
| **21** | **Condition Coverage** | White-Box | Analytical truth-table evaluation of compound boolean expressions | `testing/execution_logs/condition_coverage_execution.log` | 2 predicates | Analytical Walkthrough | `condition_coverage_execution.log` | `APP-021` | `production-server.mjs`, `FeedService.ts` |
| **22** | **Function Coverage** | White-Box | V8 tracking of declared vs. invoked methods in frontend codebase | Vitest V8 Coverage Engine (`--coverage`) | 31.12% funcs | Fully Verified | `function_coverage_execution.log` | `TERM-001` | Full Frontend Monorepo |
| **23** | **Code Coverage Testing** | White-Box | Comprehensive multi-metric coverage report (Statement, Branch, Function, Line) | Full V8 execution run across 24 suites | 4 metrics | Fully Verified | `v8_coverage_execution.log` | `TERM-001` | Full Frontend Monorepo |
| **24** | **Code Complexity Testing** | White-Box | McCabe Cyclomatic Complexity analysis of 184 functions via Python AST | `testing/analyze_cyclomatic_ast.py` | 184 functions | Fully Verified | `cyclomatic_complexity_execution.log` | `TERM-006` | Full Backend Route & Service Layer |
| **25** | **Unit Testing** | White-Box | Component-level and serialization-level unit test execution | Vitest v2.1.8 (`packages/frontend` & `packages/backend`) | 298 tests | Fully Verified | `frontend_vitest_execution.log`, `backend_serialization_execution.log` | `TERM-001`, `TERM-002` | UI components & `serialization.unit.test.ts` |
| **26** | **Integration Testing** | Grey-Box | Fastify API routes interacting with MongoDB replica set and Redis cache | `packages/backend/src/tests/integration/` | 36 suites | Fully Verified (33 P, 3 R) | `backend_integration_suites.log` | `TERM-002` | `packages/backend/src/routes/*` |
| **27** | **System Testing** | Black-Box | Full platform evaluation running under integrated Node.js reverse proxy on port 3000 | Production build verification via Playwright | Full System | Fully Verified | `verified_e2e_execution.log` | `APP-001`, `TERM-007` | `production-server.mjs` |
| **28** | **Acceptance Testing** | Black-Box | Validation of end-user journey acceptance criteria against PRD | `testing/execution_logs/acceptance_testing_execution.log` | 5 workflows | Fully Verified | `acceptance_testing_execution.log` | `E2E-003` | User Journey Specification |
| **29** | **Scenario Testing** | Black-Box | Automated real-world scenarios: negative auth, user onboarding, feed browsing, search, theme | `QA_VERIFICATION/run_verified_e2e.mjs` | 5 scenarios | Fully Verified | `verified_e2e_execution.log` | `E2E-001` to `E2E-005` | Playwright Core Automation Engine |
| **30** | **Defect Bash Elimination** | Black-Box | Unstructured, aggressive defect discovery session across HTTP headers and edge cases | Systematic audit of HTTP response headers | 1 session | Fully Verified (SEC-005 found) | `defect_bash_execution.log` | `SEC-005` | `production-server.mjs:52-64` |
| **31** | **Scalability Testing** | Non-Functional | Analysis of timeline fan-out bottlenecks and distributed Redis sliding-window cache | Architectural benchmark audit | 1 audit | Documented Limitation | `scalability_execution.log` | `APP-019` | `FeedService.ts:26-55` |
| **32** | **Reliability Testing** | Non-Functional | Fastify uncaught exception handlers and MongoDB connection disconnect/reconnect loops | Continuous loop telemetry audit | 1 loop | Fully Verified | `reliability_execution.log` | `APP-019` | `packages/backend/src/app.ts` |
| **33** | **Stress Testing** | Non-Functional | Synthetic high-throughput boundary saturation (evaluated within host safety bounds) | Host workstation resource ceiling evaluation | 1 evaluation | Documented Limitation | `stress_execution.log` | `ENV-001` | Workstation Safety Policy |
| **34** | **Interoperability Testing** | Functional | Fastify REST API RFC 7807 JSON compliance with standard browser fetch and Playwright | Cross-tier JSON serialization checks | 6 schemas | Fully Verified | `interoperability_execution.log` | `APP-023` | `packages/shared/src/schemas/*` |
| **35** | **Performance Testing** | Non-Functional | Vite bundle build duration, asset sizes, sub-2ms database response time | Vite compilation and `/diagnostics` endpoint audit | 3 benchmarks | Partially Executed (Build Metric) | `performance_execution.log` | `APP-019` | `production-server.mjs` |
| **36** | **Internationalization (I18N)** | Globalization | Multi-byte UTF-8 string handling in post titles, bios, and comments (CJK, Arabic, Emoji) | String injection test via TypeBox compiler | 12 payloads | Fully Verified | `i18n_execution.log` | `APP-013` | TypeBox String Validators |
| **37** | **Enabling Testing** | Accessibility | Keyboard navigation, focus outlines, button aria labels, form input associations | DOM tree accessibility audit | 1 audit | Fully Verified | `enabling_execution.log` | `APP-020` | React Form & Button Components |
| **38** | **Localization (L10N) Testing** | Globalization | Evaluation of localized dates, currencies, and numbers (Finding `LOC-005`) | UI string audit across utility modules | 1 audit | Reconciled Limitation (`LOC-005`) | `localization_execution.log` | `APP-006` | `packages/frontend/src/utils/date.ts` |
| **39** | **Fake Language Testing** | Globalization | Pseudolocalization string expansion testing (+30% length, accented glyphs) | DOM text container expansion test | 5 containers | Fully Verified | `fake_language_execution.log` | `APP-001` | UI Layout Containers |
| **40** | **Language Compatibility Testing**| Globalization | Database text indexing and case/diacritic insensitive search in MongoDB | MongoDB `$regex` and text search verification | 4 queries | Fully Verified | `language_compatibility_execution.log` | `APP-011` | `packages/backend/src/routes/search.routes.ts` |
| **41** | **Configuration Testing** | Environment | Application startup under missing or varied environment variables (`PORT`, `REDIS_URL`) | Config parser validation script | 3 configs | Fully Verified | `configuration_execution.log` | `ENV-001` | `packages/backend/src/config/environment.ts` |
| **42** | **Security Testing** | Non-Functional | Password hashing cost factor 12, timing attack defense, secure cookie flags, and CSP audit | Security test suite & header scan | 5 controls | Fully Verified (SEC-005 noted) | `security_execution.log` | `APP-021`, `SEC-005` | `AuthService.ts:20-34`, `production-server.mjs` |
| **43** | **Recovery Testing** | Non-Functional | Service reconnection upon transient datastore loss (process and code audit) | Code audit of Mongo/Redis reconnection listeners | 2 handlers | Partially Executed (Code Audit) | `recovery_execution.log` | `APP-019` | `packages/backend/src/app.ts` |
| **44** | **Alpha Testing** | Operational | In-house developer testing across all 7 local suites within active dev environment | Comprehensive local test execution | 376 tests | Fully Verified | `alpha_execution.log` | `TERM-007` | Entire Local Test Harness |
| **45** | **Beta Testing** | Operational | External end-user cohort trial in staged production environment | Academic project scope boundary review | 1 audit | Documented Limitation | `beta_execution.log` | N/A | Academic Scope Boundary |

---

## Detailed Technique Deep-Dives (Categorical Analysis)

### 1. Specification-Based Black-Box Techniques (Techniques 3, 4, 5, 6, 10, 13, 14)
- **Equivalence Partitioning (#3):** 19 test cases divided into valid equivalence classes (standard strings within limits) and invalid equivalence classes (oversized, type mismatches, missing required properties).
- **Boundary Value Analysis (#4):** 32 distinct boundary test cases evaluating three-point boundary analysis ($min-1, min, max, max+1$) across title length (0 to 300), content length (0 to 40,000), and media attachments (0 to 10).
- **Decision Table Testing (#5):** Evaluates the $2^2$ matrix of username existence and password validity, verifying that only the (True, True) condition generates a valid session token while all others return RFC 7807 401 Unauthorized.
- **State Transition Testing (#6):** Traces post entity state mutations across valid transitions and confirms that invalid transitions (e.g., editing a deleted post) are rejected.
- **Error Guessing Testing (#14):** Evaluates system defenses against 10 targeted exploit vectors: NoSQL query operator injection (`{"$ne": null}`), prototype pollution (`__proto__`), path traversal (`../../etc/passwd`), Unicode right-to-left override, and null byte injection. All 10 were successfully repelled.

### 2. Structural White-Box Techniques (Techniques 15, 16, 17, 19, 20, 21, 22, 23, 24)
- **Desk Checking (#16):** Static walkthrough of the atomic Lua sliding-window rate limiter in `RateLimitService.ts`, verifying that `INCR` and `EXPIRE` execute atomically within Redis single-threaded engine, preventing orphaned keys.
- **Statement & Function Coverage (#19, #22, #23):** V8 code coverage analysis tracking 34.00% statement and 31.12% function coverage across 24 frontend test files.
- **Path Coverage (#20):** Basis path analysis establishing 4 linearly independent paths through `AuthService.login()`:
  - Path 1: User not found $\rightarrow$ Throw 401.
  - Path 2: User found, password invalid $\rightarrow$ Throw 401.
  - Path 3: User found, password valid, no prior session $\rightarrow$ Create session $\rightarrow$ Return 200.
  - Path 4: User found, password valid, existing session present $\rightarrow$ Invalidate prior session $\rightarrow$ Create session $\rightarrow$ Return 200.
- **Condition Coverage (#21):** Evaluated compound boolean conditions via analytical truth tables (e.g., Fastify reverse proxy URL routing predicate).
- **McCabe Cyclomatic Complexity (#24):** Python AST parsing of 184 functions. 183 functions maintain $CC \le 10$. Exactly 1 function (`buildFeedPipeline`, $CC=11$) exceeds the standard threshold due to multi-branch feed ranking strategies.

### 3. Non-Functional & Operational Techniques (Techniques 1, 11, 31, 32, 33, 35, 41, 42, 43, 44, 45)
- **Performance & Latency (#1, #35):** Datastore query latency clocked at 1.84ms (MongoDB ping) and 0.97ms (Redis GET). Vite frontend bundle generated in 11.91s with 1.27 kB root HTML.
- **Security Testing (#42):** Verified bcrypt work factor 12, secure HTTP-only cookies, constant-time dummy bcrypt execution on missing user (anti-timing attack), and logged defect `SEC-005` (missing CSP headers on static reverse proxy).
- **Recovery Testing (#43):** Documented Fastify error handlers and MongoDB reconnect loop; live container kill omitted in compliance with safety policy.
- **Scalability & Stress Testing (#31, #33):** Documented limitations due to single-node workstation environment and free-tier cloud quota constraints.
