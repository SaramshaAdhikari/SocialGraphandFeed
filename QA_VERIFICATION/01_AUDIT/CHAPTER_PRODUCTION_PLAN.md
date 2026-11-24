# Master Chapter Production Plan & Academic Drafting Roadmap

**Course:** Software Testing and Quality Assurance (23CSE502)  
**Institution:** JAIN (Deemed-to-be University), Department of Computer Science and Engineering  
**Application Under Test:** DMND (`SocialGraphandFeed`) — Social Graph and Scalable Feed System  
**Baseline Git Commit:** `eb1f5ba4be1edd35f148d1f18a3dc748458828fb`  
**Approved Architecture:** 10-Chapter Canonical Model (Front Matter + Chapters 1 through 10)  
**Estimated Volume:** 135–150 Pages (Calibri / Times New Roman, 1.15 line spacing, 11pt body, academic tables and independent figures)

---

## 1. Master Page Allocation & Structural Target

To ensure publication-grade academic thoroughness matching the 161-page JAIN University exemplar, page allocations are deliberately weighted toward empirical testing, code verification, and defect analysis.

```
+----------------------------------------------------------------------------------------------------+
|                                    Target Page Distribution Matrix                                 |
|                                                                                                    |
|  Preliminary Pages:   Pages i - vii   ( 7 Pages)  - Cover, Abstract, TOC, Figures, Tables, Gloss.  |
|  Chapter 1:           Pages 1 - 6     ( 6 Pages)  - Introduction to Software Testing & DMND        |
|  Chapter 2:           Pages 7 - 20    (14 Pages)  - Application & 15 Module Architecture           |
|  Chapter 3:           Pages 21 - 26   ( 6 Pages)  - Testing Objectives, Scope & Technique Roster   |
|  Chapter 4:           Pages 27 - 42   (16 Pages)  - Environment, Tooling & 14 Workflow Demos      |
|  Chapter 5 (CORE):    Pages 43 - 114  (72 Pages)  - Testing Techniques & Implementation (45 Techs) |
|  Chapter 6:           Pages 115 - 124 (10 Pages)  - Test Results, Coverage & AST CC Analysis       |
|  Chapter 7:           Pages 125 - 134 (10 Pages)  - Defect Identification, SEC-005, Fixes & Diffs  |
|  Chapter 8:           Pages 135 - 138 ( 4 Pages)  - Conclusion & Academic Synthesis                |
|  Chapter 9:           Pages 139 - 142 ( 4 Pages)  - Future Enhancements & CI/CD Roadmap            |
|  Chapter 10:          Pages 143 - 145 ( 3 Pages)  - Academic References & IEEE Standards           |
|  ------------------------------------------------------------------------------------------------  |
|  Total Target Volume: 145 - 152 Pages                                                              |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Chapter-by-Chapter Production Specifications

### Preliminary Pages (Pages i – vii)
- **Required Content:**
  - `Page i`: University Cover Page — Replicate JAIN University Faculty of Engineering and Technology title template (2026-2027, 23CSE502) with student name and USN placeholders.
  - `Page ii`: Abstract — Formal synthesis of testing goals, DMND context, 45 techniques evaluated, 376 tests passing (100%), AST cyclomatic complexity (184 functions, 1 CC=11), and defect classification (`SEC-005`).
  - `Pages iii–iv`: Table of Contents — Automated hierarchical list of all chapters, sections, and subsections with page numbers.
  - `Page v`: List of Figures — Catalog of Figures 1.1 through 7.4 (39 visual evidence assets + system diagrams).
  - `Page vi`: List of Tables — Catalog of Tables 1.1 through 7.3 (Test case matrices, environment specs, defect tables).
  - `Page vii`: List of Abbreviations — Glossary of terms (API, AST, BVA, CC, CFG, CSP, E2E, EP, MC/DC, RFC, RWD, STLC, V8, etc.).
- **Evidence Sources:** `REPORT_ARCHITECTURE_FINAL.md`, reference PDF cover page design.
- **Formatting Requirement:** Roman numerals (`i` through `vii`). Cover page has no visible page number.

---

### Chapter 1: Introduction (Pages 1 – 6)
- **Required Subsections:**
  - `1.1 Foundations of Software Testing`: Principles of verification vs. validation (IEEE 1012), Software Testing Life Cycle (STLC), and V-Model alignment.
  - `1.2 Background of the DMND System`: Overview of DMND as a high-throughput social networking engine implementing Meta TAO graph architecture and hybrid feed generation.
  - `1.3 Problem Statement & Testing Imperatives`: Technical challenges in high-concurrency feeds (cache invalidation anomalies, race conditions, markdown boundary truncation, and session fixation).
  - `1.4 Report Organization`: Structural roadmap of Chapters 2 through 10.
- **Evidence Sources:** `QA_VERIFICATION/07_DIAGRAMS_AND_DOCUMENTATION/ARCHITECTURE_DIAGRAMS.md`.
- **Relevant Figures & Diagrams:**
  - `Figure 1.1`: The Software Testing Life Cycle (STLC) and V-Model Alignment.
  - `Figure 1.2`: Testing Pyramid Model across Unit, Integration, and E2E Tiers.
- **Target Page Count:** ~6 pages.

---

### Chapter 2: Application and Module Description (Pages 7 – 20)
- **Required Subsections:**
  - `2.1 Overview of DMND`: Conceptual role and operational capabilities.
  - `2.2 System Runtime & Network Topology`: 3-tier decoupled architecture (Client SPA on port 3000, Reverse Proxy, Fastify REST microservice on port 4000, MongoDB replica set `rs0` on port 27017, and Redis on port 6379).
  - `2.3 Detailed Description of the 15 Application Modules`:
    - 2.3.1 Feed Service (`FeedService.ts`): Hybrid push/pull fan-out engine.
    - 2.3.2 Authentication Controller (`auth.routes.ts`): Bcrypt hashing, sessions, cookie preHandlers.
    - 2.3.3 Post & Media Contract (`post.ts`): TypeBox schema definitions, string bounds, and media array constraints.
    - 2.3.4 Social Graph Engine (`graph.routes.ts`): Adjacency list querying, follow/unfollow operations.
    - 2.3.5 User Profile & Identity (`user.routes.ts`): Bio updates, avatar storage, follower/following stats.
    - 2.3.6 Comment Engine (`comment.routes.ts`): Nested discussion trees, parent-child thread pointers.
    - 2.3.7 Full-Text Search Engine (`search.routes.ts`): Regex sanitization and tokenized text search.
    - 2.3.8 Communities Directory (`community.routes.ts`): Categorized topical hubs, rules, moderators.
    - 2.3.9 Direct Messaging System (`messages.routes.ts`): Peer-to-peer conversations, active chat.
    - 2.3.10 Notifications Center (`notification.routes.ts`): Interaction events (upvotes, replies, follows).
    - 2.3.11 Saved Collections (`saved.routes.ts`): User bookmark management and filtering.
    - 2.3.12 System Diagnostics (`diagnostics.routes.ts`): Latency telemetry, cache hit rates, node health.
    - 2.3.13 Frontend TanStack Query State (`useFeed.ts`, `useAuth.ts`): Client-side caching and mutations.
    - 2.3.14 Force-Directed Graph Visualizer (`GraphPage.tsx`): HTML5 canvas physics clustering.
    - 2.3.15 Reverse Proxy & Static Asset Server (`production-server.mjs`): SPA routing and API proxying.
  - `2.4 Module Interactions & Data Flow`: Sequential trace from client dispatch to datastore commit.
- **Evidence Sources:** `packages/backend/src/`, `packages/frontend/src/`, `packages/shared/src/`, `ARCHITECTURE_DIAGRAMS.md`.
- **Relevant Figures & Diagrams:**
  - `Figure 2.1`: System Runtime & Network Topology Architecture Diagram.
  - `Figure 2.2`: Meta TAO Hybrid Feed Distribution Pipeline (Push vs. Pull Cutoff).
  - `Figure 2.3`: Responsive Masonry Grid on Discover Page (`APP-004`).
- **Relevant Code Excerpts:** Code Excerpt 5 (`FeedService.ts:26-55`), Code Excerpt 6 (`schemas/post.ts:75-105`).
- **Target Page Count:** ~14 pages.

---

### Chapter 3: Testing Objectives and Scope (Pages 21 – 26)
- **Required Subsections:**
  - `3.1 Primary Testing Objectives`: Verifying functional correctness, boundary validation, white-box complexity bounds, security defenses, and integration fidelity.
  - `3.2 Scope of Testing`:
    - 3.2.1 In-Scope Components: All Fastify REST endpoints, React SPA components, TypeBox contracts, database transaction logic, and reverse proxy handlers.
    - 3.2.2 Out-of-Scope Elements & Workstation Constraints: Multi-node Docker replica clustering (due to single-instance host configuration) and destructive container termination during live execution.
  - `3.3 Assigned Testing Techniques Catalog`: Overview of the 45 techniques assigned under Course 23CSE502.
  - `3.4 Applicability Matrix`: Mapping the 45 techniques to DMND subsystems with justification of execution mode.
- **Evidence Sources:** `TESTING_TECHNIQUE_MAPPING.md`, `EVIDENCE_READINESS_AUDIT.md`.
- **Relevant Tables:**
  - `Table 3.1`: Applicability & Classification Matrix for all 45 Assigned Testing Techniques.
- **Target Page Count:** ~6 pages.

---

### Chapter 4: Testing Environment, Tooling, and Application Execution (Pages 27 – 42)
- **Required Subsections:**
  - `4.1 Hardware and Software Environment`: Physical machine specifications (Dell 00JGRJ, Intel Core i3-1005G1 CPU @ 1.20 GHz, 8 GB RAM, Windows 11 Pro 25H2, Node 26.7.0, Python 3.12, Mongo 7.0 rs0, Redis 8.10.1). High-resolution Fastfetch evidence (`ENV-001`).
  - `4.2 Testing Tools and Framework Configuration`: Vitest v2.1.8, JSDOM, Playwright Core, TypeBox v0.32, Python `ast` module.
  - `4.3 Repository Setup & Datastore Initialization`: Cloning, package resolution, MongoDB replica set initialization, Redis daemon startup.
  - `4.4 Application Build & Service Startup`: Fastify backend launch (port 4000), Vite production bundle compilation, reverse proxy launch (port 3000).
  - `4.5 Database Seeding Verification`: Seeding of 115 users, 510 posts, 18 communities (`seed.ts`).
  - `4.6 Step-by-Step Application Workflow Demonstrations (14 Visual Workflows)`:
    - Workflow 1: Public Feed Landing (`APP-001`).
    - Workflow 2: Top vs. New Feed Algorithmic Sorting (`APP-002`, `APP-003`).
    - Workflow 3: Discover Responsive Masonry Grid (`APP-004`).
    - Workflow 4: User Authentication & Negative Alert Validation (`APP-020`, `APP-021`, `APP-026`).
    - Workflow 5: Interactive Social Graph Cluster Navigation (`APP-005`).
    - Workflow 6: Post Inspection & Threaded Comment Discussion (`APP-006`, `APP-007`).
    - Workflow 7: Profile Editing & Dark/Light Theme Switching (`APP-017`, `APP-018`).
    - Workflow 8: Communities Directory & Scoped Hub Feed (`APP-009`, `APP-010`).
    - Workflow 9: Universal Full-Text Search Execution (`APP-011`).
    - Workflow 10: Post Creation Modal with Character Counter Validation (`APP-012`, `APP-013`).
    - Workflow 11: Saved Bookmarks & Collections Management (`APP-014`).
    - Workflow 12: Direct Messaging Split-Pane Interface (`APP-015`).
    - Workflow 13: System Diagnostics Operational Telemetry (`APP-019`).
    - Workflow 14: Responsive Viewport Fidelity (Tablet `APP-024`, Mobile `APP-025`).
- **Evidence Sources:** `SCREENSHOT_MAPPING.md`, `ENVIRONMENT_SPECIFICATIONS.md`.
- **Relevant Figures:** Figures 4.1 through 4.26 (All 26 Application Screenshots + `ENV-001`).
- **Target Page Count:** ~16 pages.

---

### Chapter 5: Testing Techniques and Implementation (Pages 43 – 114) — [PRIMARY CORE CHAPTER]
This chapter receives the greatest technical depth. Subsections 5.1 through 5.45 document every assigned technique.

**Mandatory Academic Structure for Every Technique Sub-section:**
1. **Objective:** Formal definition of testing goals and property verified.
2. **Scope:** Target subsystem, modules, schemas, and files under test.
3. **Structured Test Case Specification Table:**
   `Test Case ID | Name | Type | Preconditions | Input / Test Data | Steps | Expected Result | Actual Result | Status`
4. **Source Code Under Test:** Dedicated syntax-highlighted code block citing exact file path and line numbers.
5. **Execution Output & Visual Evidence:** Detailed log citations and high-resolution figure reference (`TERM-XXX`, `E2E-XXX`, or `APP-XXX`).
6. **Execution Summary:** Quantified pass/fail metrics, duration, and engine.
7. **Defect Summary:** Cataloged findings (`SEC-005`, `LOC-005`) or "Zero defects observed".
8. **Risk Analysis:** Operational and architectural risk evaluation.
9. **Environment Details:** Host runtime, datastore state, and port bindings.

**Techniques to Detail (5.1 to 5.45):**
- *5.1 Non-Functional Testing:* Frontend bundle build metrics (11.91s, 1.27 kB HTML), sub-2ms DB latency, memory profile (`APP-019`, `ENV-001`).
- *5.2 Regression Testing:* 292 Vitest frontend unit tests rerun with 100% pass rate (`TERM-001`).
- *5.3 Equivalence Partitioning:* 19 test cases across 6 TypeBox contracts (valid strings, empty values, oversized payloads, `TERM-003`).
- *5.4 Boundary Value Analysis:* 32 boundary tests: $min-1, min, max, max+1$ across title, content, media count (`TERM-005`).
- *5.5 Decision Table Testing:* Authentication permission matrix (4 state combinations), user lookup vs. password validity (`APP-021`).
- *5.6 State Transition Testing:* Post entity lifecycle (Draft $\rightarrow$ Published $\rightarrow$ Upvoted $\rightarrow$ Saved $\rightarrow$ Deleted, `APP-013`).
- *5.7 Exploratory Testing:* Unscripted user journeys through social graph, tags, masonry explore grid (`APP-005`, `APP-004`).
- *5.8 Random Testing (Monkey Testing):* High-frequency search input fuzzing with random ASCII strings and rapid click dispatches (`TERM-004`).
- *5.9 Requirements-Based Testing:* PRD Traceability Matrix mapping functional requirements to verified test cases (`TERM-007`).
- *5.10 Cause-Effect Graphing:* Boolean graph mapping feed query parameters (`sort`, `scope`, `strategy`, `cursor`) to delivery output (`APP-002`, `APP-003`).
- *5.11 Compatibility Testing:* Responsive UI verification across Desktop (1440x900), Tablet (`APP-024`), and Mobile (`APP-025`).
- *5.12 User Documentation Testing:* Verification of README setup steps, API contract annotations, and clean workstation install (`ENV-001`).
- *5.13 Domain Testing:* Domain boundaries on aspect ratio floats, geolocation coordinates, and ISO 8601 timestamps (`TERM-005`).
- *5.14 Error Guessing Testing:* 10 exploit vectors: NoSQL `$ne`, prototype pollution, path traversal, RTL override, null bytes (`TERM-004`).
- *5.15 White-Box Testing:* Internal logic verification of transaction retry loop and constant-time password verification (`TERM-002`).
- *5.16 Desk Checking:* Line-by-line manual code audit of atomic Lua rate limit script in Redis (`RateLimitService.ts:25-36`).
- *5.17 Unit / Code Functional Testing:* Direct function evaluation of `formatRelativeTime` and `resolveLoginUsername` (`TERM-001`).
- *5.18 Functional Testing:* Verification of core user CRUD operations across posts, comments, follows (`APP-006`, `APP-008`).
- *5.19 Statement Coverage:* V8 AST line execution tracking across React frontend modules (34.00% statements, `TERM-001`).
- *5.20 Path Coverage:* Basis path walkthrough of 4 linear independent paths through `AuthService.login` (`E2E-001`).
- *5.21 Condition Coverage:* Analytical truth-table walkthrough of compound boolean predicates in routing and feed pipelines (`APP-021`).
- *5.22 Function Coverage:* V8 method invocation tracking across frontend codebase (31.12% functions, `TERM-001`).
- *5.23 Code Coverage Testing:* Comprehensive multi-metric coverage report (Statement, Branch, Function, Line, `TERM-001`).
- *5.24 Code Complexity Testing:* AST McCabe Cyclomatic Complexity analysis across 184 functions; identify $CC=11$ pipeline (`TERM-006`).
- *5.25 Unit Testing:* Detailed review of 298 isolated unit tests across frontend UI and backend serialization (`TERM-001`, `TERM-002`).
- *5.26 Integration Testing:* Fastify routes interacting with MongoDB replica set and Redis cache (33 passed, 3 reconciled, `TERM-002`).
- *5.27 System Testing:* Full application verification running as integrated production server on port 3000 (`APP-001`, `TERM-007`).
- *5.28 Acceptance Testing:* Verification against defined User Acceptance Criteria for social feed consumption (`E2E-003`).
- *5.29 Scenario Testing:* 5 multi-step real-world end-to-end user workflows executed via Playwright (`E2E-001` to `E2E-005`).
- *5.30 Defect Bash Elimination:* Systematic bug-hunting session identifying static header omission `SEC-005`.
- *5.31 Scalability Testing:* Evaluation of Redis sliding-window throughput and MongoDB indexing; single-node limitation documented (`APP-019`).
- *5.32 Reliability Testing:* Continuous query loops verifying zero memory leaks or unhandled promise rejections (`APP-019`).
- *5.33 Stress Testing:* Theoretical limits and host machine safety constraints documented; cloud tier protection (`ENV-001`).
- *5.34 Interoperability Testing:* Fastify REST JSON compatibility with browser fetch API and Playwright client (`APP-023`).
- *5.35 Performance Testing:* Frontend bundle build duration (11.91s), datastore latency sub-2ms (`APP-019`).
- *5.36 Internationalization (I18N) Testing:* UTF-8 multi-byte character encoding verification in titles, bios, comments (`APP-013`).
- *5.37 Enabling Testing:* Accessibility inspection of DOM attributes, focus states, aria labels (`APP-020`).
- *5.38 Localization (L10N) Testing:* Evaluation of relative timestamp strings; documented lack of localized resource bundles (`LOC-005`, `APP-006`).
- *5.39 Fake Language Testing:* Pseudolocalization test checking string expansion tolerance and layout clipping (`APP-001`).
- *5.40 Language Compatibility Testing:* Inspection of language headers and UTF-8 collation in MongoDB indices (`APP-011`).
- *5.41 Configuration Testing:* Verification of application behavior under varied environment variables and ports (`ENV-001`).
- *5.42 Security Testing:* Audit of bcrypt hashing, session token entropy, anti-timing defense, and CSP header gap `SEC-005` (`APP-021`).
- *5.43 Recovery Testing:* Code and process audit of Fastify error handling and MongoDB reconnect loop; live kill omitted (`APP-019`).
- *5.44 Alpha Testing:* Internal engineering verification within development workspace (`TERM-007`).
- *5.45 Beta Testing:* Formal documentation of academic scope boundary and external user cohort deferral.
- **Evidence Sources:** `TESTING_TECHNIQUE_MAPPING.md`, `SOURCE_CODE_REFERENCE_MAP.md`, `QA_VERIFICATION/06_EXECUTION_LOGS/`.
- **Relevant Figures:** Figures 5.1 through 5.12 (7 Terminal Captures + 5 E2E Captures).
- **Relevant Code Excerpts:** Code Excerpts 1 through 10.
- **Target Page Count:** ~72 pages.

---

### Chapter 6: Test Results and Analysis (Pages 115 – 124)
- **Required Subsections:**
  - `6.1 Overall Testing Results`:
    - Reconciliation of all 376 test cases across 7 independent execution engines.
    - 100% pass rate (376 passed / 376 executed, 0 failed, 0 regressions).
    - Resolution of the 363 vs. 376 discrepancy.
    - Execution time summary across suites.
  - `6.2 Coverage and Complexity Results`:
    - V8 coverage metrics: Statement (34.00%), Branch (28.45%), Function (31.12%), Line (34.18%).
    - Analysis of untested areas (animation visualizers, test mock harnesses).
    - McCabe Cyclomatic Complexity distribution: 184 functions audited; 162 functions (88.0%) with $CC \in [1, 5]$; 21 functions (11.4%) with $CC \in [6, 10]$; 1 function (`buildFeedPipeline`, $CC=11$, 0.5%) exceeding maintainability threshold.
  - `6.3 Performance, Scalability, and Reliability Results`:
    - Vite production build efficiency: bundle generated in 11.91s, root HTML 1.27 kB.
    - Datastore telemetry from `/diagnostics`: MongoDB ping latency 1.84ms, Redis cache hit rate 94.2%.
- **Evidence Sources:** `cyclomatic_complexity_execution.log`, `code_coverage_execution.log`, `PHASE_2_1_VALIDATION.md`.
- **Relevant Figures:** `Figure 6.1`: McCabe Cyclomatic Complexity Distribution Histogram, `Figure 6.2`: V8 Code Coverage Distribution Chart.
- **Target Page Count:** ~10 pages.

---

### Chapter 7: Defect Identification and Analysis (Pages 125 – 134)
- **Required Subsections:**
  - `7.1 Master Defect & Anomaly Ledger`: Structured matrix of all 5 cataloged findings (`SEC-005`, `BE-INT-001`, `BE-INT-002`, `BE-INT-003`, `LOC-005`).
  - `7.2 Technical Root Cause Analysis`: Deep post-mortem of `SEC-005` (static reverse proxy omitting Helmet headers), explaining clickjacking / framing risks.
  - `7.3 Defect Density and Severity Distribution`: Breakdown by severity (1 Moderate, 3 Low/Fixture, 1 Informational).
  - `7.4 Corrective Action Plan & Verified Code Patches`: Code diff for `production-server.mjs` attaching CSP, X-Frame-Options, and nosniff headers.
- **Evidence Sources:** `defect_bash_execution.log`, `security_execution.log`, `SOURCE_CODE_REFERENCE_MAP.md`.
- **Relevant Figures & Diagrams:**
  - `Figure 7.1`: Defect Classification & Triage Lifecycle State Diagram (`ARCHITECTURE_DIAGRAMS.md`).
  - `Figure 7.2`: Code Diff & Verification Patch for Defect `SEC-005`.
- **Target Page Count:** ~10 pages.

---

### Chapter 8: Conclusion (Pages 135 – 138)
- **Required Subsections:**
  - `8.1 Quality Verdict on DMND`: Synthesis of findings confirming the robust functional correctness, high maintainability ($99.5\%$ functions $CC \le 10$), and sub-2ms datastore latency.
  - `8.2 Fulfillment of Testing Objectives`: Systematic audit showing that all verification goals set in Chapter 3 were met.
  - `8.3 Academic and Practical Learnings`: Reflections on modern TypeScript QA, schema boundary validation, AST complexity parsing, and evidence-driven QA methodologies.
- **Target Page Count:** ~4 pages.

---

### Chapter 9: Future Enhancements (Pages 139 – 142)
- **Required Subsections:**
  - `9.1 Continuous Integration & Automated Regression Pipeline`: GitHub Actions workflow integrating Vitest, TypeBox compiler, and headless Playwright on every PR.
  - `9.2 Distributed Stress Testing via Dedicated Infrastructure`: Deploying distributed k6 / Autocannon load generators on multi-node test clusters.
  - `9.3 Internationalization (i18n) Framework Adoption`: Adopting `react-i18next` with localized JSON translation catalogs and dynamic RTL stylesheet support.
  - `9.4 Automated Visual Regression Testing`: Pixel-diffing visual regression harnesses (Playwright visual comparisons) to catch unintended styling shifts across releases.
- **Target Page Count:** ~4 pages.

---

### Chapter 10: References (Pages 143 – 145)
- **Required Content:** Formal academic citations following standard IEEE style:
  - IEEE Standard for Software and System Test Documentation (IEEE 829-2008 / ISO/IEC/IEEE 29119-3).
  - IEEE Standard for System and Software Verification and Validation (IEEE 1012-2016).
  - Pressman, R. S., & Maxim, B. R. *Software Engineering: A Practitioner's Approach*. McGraw-Hill.
  - Myers, G. J., Sandler, C., & Badgett, T. *The Art of Software Testing*. John Wiley & Sons.
  - McCabe, T. J. (1976). *A Complexity Measure*. IEEE Transactions on Software Engineering.
  - Fastify Web Framework: *Fastify Documentation & Best Practices* (fastify.dev).
  - React Documentation: *React 18 Architecture and State Hooks* (react.dev).
  - TypeBox Schema Documentation: *JSON Schema Type Builder with Static Type Resolution* (github.com/sinclairzx81/typebox).
  - Vitest Testing Framework: *Next Generation Testing Framework* (vitest.dev).
  - Playwright: *Fast and reliable end-to-end testing for modern web apps* (playwright.dev).
  - MongoDB Inc.: *MongoDB Server Manual & Transaction Specification* (mongodb.com/docs).
  - Redis Ltd.: *Redis Commands and Lua Scripting Guide* (redis.io/docs).
  - RFC 7807: *Problem Details for HTTP APIs* (datatracker.ietf.org/doc/html/rfc7807).
- **Target Page Count:** ~3 pages.

---

## 3. Mandatory Formatting & Document Construction Rules

In strict compliance with assignment guidelines, the following rules govern all subsequent report drafting and compilation:

1. **Monospaced Code Blocks Outside Tables:** Source code must appear in dedicated, syntax-highlighted monospaced code blocks with file path and line number labels. **Never place source code inside tables.**
2. **Tabular Data:** Structured tables are reserved for test case specifications, execution matrices, defect ledgers, and environment specifications. Tables must not overflow page boundaries.
3. **Figure Placement & Captions:** Application screenshots and execution console outputs must appear as independent, properly numbered figures with descriptive captions placed below the image (e.g., `Figure 4.1: Desktop Home Feed Interface (APP-001)`).
4. **Architecture Diagrams:** Architecture diagrams must be displayed independently (flowcharts, sequence diagrams) and explained in accompanying analytical paragraphs.
5. **No Layout Hacks:** Avoid placing screenshots, lengthy prose descriptions, or code blocks inside tables merely to control page layout.
6. **Heading Hierarchy:** Strict numbering hierarchy: Chapter (Heading 1, 18pt), Section (Heading 2, 14pt, `X.Y`), Subsection (Heading 3, 12pt, `X.Y.Z`).
7. **Cover Page Isolation:** Only the first page of the supplied PDF exemplar is reused for university title formatting. All remaining body pages must use clean, independent academic formatting with restrained visual styling.
8. **Dual-Format Delivery:** Phase 3.2 will author `FINAL_QA_REPORT.md` and compile it to `FINAL_QA_REPORT.docx` and inspect the generated PDF independently.
