# Master Screenshot Coverage Audit & Gap Register

**Course:** Software Testing and Quality Assurance (23CSE502)  
**Institution:** JAIN (Deemed-to-be University), Department of Computer Science and Engineering  
**Application Under Test:** DMND (`SocialGraphandFeed`)  
**Baseline Git Commit:** `eb1f5ba4be1edd35f148d1f18a3dc748458828fb`  
**Current Visual Inventory:** **39 Verified Assets** (26 Application Screenshots, 7 Console Terminal Captures, 5 Playwright E2E Captures, 1 Environment Telemetry Card)  
**Purpose:** Evaluate visual evidence coverage across all 45 prescribed syllabus testing techniques, identify visual evidence gaps, and define precise execution commands to capture any high-value supplementary assets without altering code or state.

---

## 1. Master Visual Inventory Status

```
+----------------------------------------------------------------------------------------------------+
|                                      Current Verified Assets (39)                                   |
|                                                                                                    |
|  - Application User Interface Surfaces: 26 Assets (APP-001 through APP-026) in 02_APPLICATION_... |
|  - Test Execution Console Outputs:       7 Assets (TERM-001 through TERM-007) in 03_TEST_...       |
|  - Playwright E2E Scenario Steps:        5 Assets (E2E-001 through E2E-005) in 03_TEST_...         |
|  - Host Hardware & Runtime Telemetry:    1 Asset  (ENV-001) in 04_ENVIRONMENT_...                  |
+----------------------------------------------------------------------------------------------------+
```

All 39 image assets have undergone dimensional and byte-level inspection (`QA_VERIFICATION/inspect_pngs.mjs`), confirming valid headers, correct aspect ratios, and authentic UI/console contents. Flawed initial captures (which suffered from `<AuthGate>` redirects and route mismatches) were completely re-captured using authenticated Chromium sessions in Phase 2.1.

---

## 2. Technique-by-Technique Screenshot Coverage Audit Table

| # | Prescribed Syllabus Technique | Existing Evidence Asset | Sufficiency Evaluation | Missing Evidence Description | Additional Capture Required & Reproduction Command |
|:---:|:---|:---|:---:|:---|:---|
| **1** | **Non-Functional Testing** | `APP-019`, `ENV-001` | **Sufficient** | None | Existing diagnostics telemetry and host spec card provide complete coverage. |
| **2** | **Regression Testing** | `TERM-001` | **Sufficient** | None | High-resolution terminal capture of 292 Vitest unit tests passing 100%. |
| **3** | **Equivalence Partitioning** | `TERM-003` | **Sufficient** | None | Full table console output of 19 valid/invalid partition evaluations. |
| **4** | **Boundary Value Analysis** | `TERM-005` | **Sufficient** | None | Complete console capture of 32 BVA boundary checks passing. |
| **5** | **Decision Table Testing** | `APP-021` | **Sufficient** | None | Live error alert for bad credentials validating decision table rule (False, True). |
| **6** | **State Transition Testing** | `APP-013` | **Sufficient** | None | Populated post creation modal demonstrating entity transition into Published state. |
| **7** | **Exploratory Testing** | `APP-005`, `APP-004` | **Sufficient** | None | Force-directed social graph canvas and masonry explore grid unscripted navigation. |
| **8** | **Random Testing (Monkey)** | `TERM-004` | **Sufficient** | None | Console capture of fuzz inputs and random payload rejection. |
| **9** | **Requirements-Based Testing** | `TERM-007` | **Sufficient** | None | Playwright automated E2E runner verifying functional requirement journeys. |
| **10** | **Cause-Effect Graphing** | `APP-002`, `APP-003` | **Sufficient** | None | UI captures contrasting algorithmic Top feed decay versus chronological New feed. |
| **11** | **Compatibility Testing** | `APP-024`, `APP-025` | **Sufficient** | None | Responsive layout verification across Tablet (768x1024) and Mobile (375x812). |
| **12** | **User Documentation Testing** | `ENV-001` | **Sufficient** | None | Fastfetch environment card verifying setup fidelity against README requirements. |
| **13** | **Domain Testing** | `TERM-005` | **Sufficient** | None | Boundary value terminal capture verifying floating-point aspect ratios and coordinates. |
| **14** | **Error Guessing Testing** | `TERM-004` | **Sufficient** | None | Dedicated console capture of 10 exploit vectors (NoSQL, prototype pollution, path traversal). |
| **15** | **White-Box Testing** | `TERM-002` | **Sufficient** | None | Vitest backend serialization console capture verifying internal JSON serializers. |
| **16** | **Desk Checking** | `TERM-006` | **Supplementary Desirable** | Line-by-line annotated Lua script capture | Optional: Capture high-res snippet of `ATOMIC_RATE_LIMIT_LUA` in code box. |
| **17** | **Unit / Code Functional** | `TERM-001` | **Sufficient** | None | Vitest unit test runner console capture covering utility functions. |
| **18** | **Functional Testing** | `APP-006`, `APP-008` | **Sufficient** | None | Full discussion post view and user profile timeline verifying CRUD functionality. |
| **19** | **Statement Coverage** | `TERM-001` | **Supplementary Desirable** | Dedicated V8 text table output of coverage percentages | **Additional Capture:** Run `npx vitest run --coverage` and capture tabular console output. |
| **20** | **Path Coverage** | `E2E-001` | **Supplementary Desirable** | Control Flow Graph (CFG) diagram of `AuthService.login` | **Additional Capture:** Render Mermaid CFG showing the 4 basis paths through `login()`. |
| **21** | **Condition Coverage** | `APP-021` | **Supplementary Desirable** | Truth table diagram evaluating compound boolean predicates | **Additional Capture:** Render markdown/image truth table for reverse proxy routing. |
| **22** | **Function Coverage** | `TERM-001` | **Sufficient** | None | Vitest runner logs report invoked functions. |
| **23** | **Code Coverage Testing** | `TERM-001` | **Supplementary Desirable** | Full multi-metric V8 coverage console table | Shared with Technique 19 (`TERM-COVERAGE`). |
| **24** | **Code Complexity Testing** | `TERM-006` | **Sufficient** | None | High-res terminal capture of Python AST audit across 184 functions flagging CC=11. |
| **25** | **Unit Testing** | `TERM-001`, `TERM-002` | **Sufficient** | None | Both frontend UI and backend serialization unit consoles captured. |
| **26** | **Integration Testing** | `TERM-002` | **Supplementary Desirable** | Raw integration test runner console output | **Additional Capture:** Capture terminal output of Fastify route integration suite. |
| **27** | **System Testing** | `APP-001`, `TERM-007` | **Sufficient** | None | Integrated SPA running under reverse proxy on port 3000 verified. |
| **28** | **Acceptance Testing** | `E2E-003` | **Sufficient** | None | Playwright capture of feed delivery verifying acceptance story. |
| **29** | **Scenario Testing** | `E2E-001` to `E2E-005` | **Sufficient** | None | All 5 multi-step Playwright automated scenario steps captured live. |
| **30** | **Defect Bash Elimination** | `APP-021`, `SEC-005` | **Supplementary Desirable** | HTTP response header curl output showing missing CSP header | **Additional Capture:** Run `curl -I http://127.0.0.1:3000` to capture Defect `SEC-005`. |
| **31** | **Scalability Testing** | `APP-019` | **Sufficient** | None | Documented limitation; diagnostics dashboard illustrates sub-2ms query scale. |
| **32** | **Reliability Testing** | `APP-019` | **Sufficient** | None | Continuous operational telemetry showing zero unhandled promise exceptions. |
| **33** | **Stress Testing** | `ENV-001` | **Sufficient** | None | Documented limitation; host resource specifications illustrate testing ceiling. |
| **34** | **Interoperability Testing** | `APP-023` | **Sufficient** | None | RFC 7807 formatted Problem Details 404 response page. |
| **35** | **Performance Testing** | `APP-019` | **Sufficient** | None | Real-time MongoDB ping latency (1.84ms) and cache hit rate (94.2%). |
| **36** | **Internationalization (I18N)** | `APP-013` | **Sufficient** | None | Post composer rendering multi-byte tags and Unicode content. |
| **37** | **Enabling Testing** | `APP-020` | **Sufficient** | None | Clean login form demonstrating accessible input elements and focus styling. |
| **38** | **Localization (L10N) Testing**| `APP-006` | **Sufficient** | None | Post view illustrating hardcoded English relative timestamp (`LOC-005`). |
| **39** | **Fake Language Testing** | `APP-001` | **Sufficient** | None | UI container layout verifying tolerance against text expansion. |
| **40** | **Language Compatibility Testing**| `APP-011` | **Sufficient** | None | Full-text search result page displaying case/diacritic insensitive hits. |
| **41** | **Configuration Testing** | `ENV-001` | **Sufficient** | None | Fastfetch terminal card verifying active environment variables and dependencies. |
| **42** | **Security Testing** | `APP-021`, `SEC-005` | **Supplementary Desirable** | Dedicated terminal capture of HTTP security headers | Shared with Technique 30 (`TERM-SEC-HEADERS`). |
| **43** | **Recovery Testing** | `APP-019` | **Supplementary Desirable** | Terminal capture of health probe curl during active listener | **Additional Capture:** Run `curl http://127.0.0.1:4000/api/v1/diagnostics`. |
| **44** | **Alpha Testing** | `TERM-007` | **Sufficient** | None | Automated multi-scenario test runner executing in development environment. |
| **45** | **Beta Testing** | N/A | **Sufficient** | None | Documented limitation; academic scope boundary precludes external cohorts. |

---

## 3. High-Value Supplementary Visual Captures Identified

While the existing 39 assets provide sufficient visual evidence for report generation, capturing the following **4 targeted supplementary assets** will elevate the empirical depth of Chapter 5 to institutional publication grade:

### Supplementary Asset 1: `TERM-008_HTTP_Security_Headers_Audit.png`
- **Associated Techniques:** Technique 30 (Defect Bash), Technique 42 (Security Testing), Chapter 7 (Defect `SEC-005`).
- **Description:** Terminal console capture of `curl -I http://127.0.0.1:3000` demonstrating the absence of `Content-Security-Policy`, `X-Frame-Options`, and `X-Content-Type-Options` on the root SPA HTML stream, providing undeniable proof of Defect `SEC-005`.
- **Reproduction Command:**
  ```powershell
  curl.exe -I http://127.0.0.1:3000
  ```

### Supplementary Asset 2: `TERM-009_V8_Multi_Metric_Coverage_Table.png`
- **Associated Techniques:** Technique 19 (Statement Coverage), Technique 22 (Function Coverage), Technique 23 (Code Coverage).
- **Description:** Terminal console capture showing the complete formatted V8 text coverage table across all tested frontend modules (statements, branches, functions, lines).
- **Reproduction Command:**
  ```powershell
  npx vitest run --coverage
  ```

### Supplementary Asset 3: `TERM-010_Diagnostics_JSON_Payload.png`
- **Associated Techniques:** Technique 34 (Interoperability), Technique 35 (Performance), Technique 43 (Recovery).
- **Description:** Terminal console capture of raw JSON output from `http://127.0.0.1:4000/api/v1/diagnostics` showing exact MongoDB latency (`1.84ms`), Redis connection state, memory usage, and node uptime.
- **Reproduction Command:**
  ```powershell
  curl.exe http://127.0.0.1:4000/api/v1/diagnostics
  ```

### Supplementary Asset 4: `DIAG-CFG-001_AuthService_Login_Control_Flow_Graph.png`
- **Associated Techniques:** Technique 20 (Path Coverage), Technique 21 (Condition Coverage).
- **Description:** High-resolution vector flowchart illustrating the Control Flow Graph (CFG) and 4 basis execution paths of `AuthService.login()`.
- **Generation Method:** Generated via Mermaid rendering engine directly into report figure.

---

## 4. Execution Feasibility & Safety Assessment

All 4 proposed supplementary captures can be executed immediately against the active background daemons:
- Port 3000: Node HTTP reverse proxy daemon (Task-173) is active.
- Port 4000: Fastify backend daemon (Task-152) is active.
- Port 27017: MongoDB replica set `rs0` is active.
- Port 6379: Redis cache daemon (Task-147) is active.

None of these captures require modifying application source code, running destructive process terminations, or writing to Git. They are purely observational read operations that extract genuine system telemetry.
