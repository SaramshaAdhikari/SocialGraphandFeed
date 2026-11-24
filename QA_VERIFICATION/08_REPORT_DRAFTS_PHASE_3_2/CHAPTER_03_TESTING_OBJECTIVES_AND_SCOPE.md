# Chapter 3 — Testing Objectives and Scope

## 3.1 Primary Testing Objectives

The primary objective of this quality assurance evaluation is to conduct a rigorous, empirical investigation into the correctness, structural maintainability, boundary resilience, and operational security of the DMND platform across the 45 software testing techniques defined in the JAIN University 23CSE502 curriculum.

The evaluation is designed to achieve the following specific technical objectives:
1. **Verification of Functional Domain Correctness:** Ensure that user onboarding, credential verification, post publishing, algorithmic feed ranking, threaded commenting, social graph mutations, and collections management operate in strict compliance with the Product Requirements Document (PRD).
2. **Mathematical Boundary and Schema Contract Validation:** Subject all API inputs to exhaustive Boundary Value Analysis ($min-1, min, max, max+1$) and Equivalence Partitioning using `@sinclair/typebox` schema compilers to verify that malformed or oversized payloads are rejected before database ingestion.
3. **White-Box Structural Logic and Complexity Auditing:** Evaluate internal control flow structures, branch predicates, and database transaction retry mechanisms. Quantify source code maintainability using McCabe Cyclomatic Complexity across all backend functions to ensure $CC \le 10$, identifying high-complexity routines requiring refactoring.
4. **Assessment of Cryptographic and Security Defenses:** Audit password hashing work factors, verify anti-timing attack defenses in credential verification routines, confirm session fixation protections, and inspect HTTP response headers for Content Security Policy (CSP) and clickjacking protections.
5. **Multi-Tier Integration and Data Consistency Verification:** Validate atomic multi-document transaction behavior in MongoDB replica set `rs0` and verify the single-threaded atomicity of Redis Lua scripts during sliding-window rate limiting.
6. **Cross-Device Responsive Compatibility:** Validate that UI layout containers adapt fluidly across standard desktop, tablet, and mobile viewports without textual truncation, CSS overflow, or broken touch targets.

---

## 3.2 System Boundaries and Scope Specification

To establish absolute clarity regarding what was verified, the scope of testing is formally partitioned into in-scope targets and documented out-of-scope workstation limitations.

### 3.2.1 In-Scope Components and Subsystems
The in-scope evaluation encompasses all active application tiers running within the local production-mode environment:
- **Presentation Tier:** All React 18 UI components, TanStack Query hooks (`useFeed`, `useAuth`), Zustand client state stores, TailwindCSS responsive utility classes, and the HTML5 force-directed canvas visualizer (`GraphPage.tsx`).
- **Reverse Proxy Ingress Tier:** The Node.js reverse proxy (`production-server.mjs`) handling SPA fallback routing, static asset caching headers, and local loopback API proxying.
- **RESTful API Route Layer:** All Fastify route controllers exposed under `/api/v1/*` (`auth`, `users`, `posts`, `feed`, `comments`, `communities`, `graph`, `search`, `messages`, `notifications`, `saved`, `diagnostics`).
- **Shared Schema Contracts:** All `@sinclair/typebox` validation schemas in `packages/shared/src/schemas/`.
- **Database & Cache Integration:** Multi-document transaction execution in MongoDB `rs0` (`transaction.ts`), document seeding integrity, and atomic Lua script execution in Redis (`RateLimitService.ts`).

### 3.2.2 Out-of-Scope Elements and Workstation Constraints
To preserve host system stability, adhere to production safety guidelines, and respect hardware constraints, several operational testing boundaries were established:
- **Multi-Node Cluster Scalability Testing:** Scalability benchmark suites requiring multi-node distributed replica sets (e.g., secondary MongoDB nodes on `127.0.0.1:27018` and Redis replicas on port 6380) were documented as infrastructure-constrained due to single-instance local workstation limits.
- **Destructive Live-Process Killing:** During Recovery Testing, terminating the active background Fastify process or MongoDB Windows service was omitted to avoid terminating the active public demonstration service. Error recovery was audited analytically via process exception handlers and reconnect listeners.
- **Public Cloud High-Concurrency Stress Saturation:** Sustained high-throughput stress benchmarks ($>10,000$ RPS) against live Render Cloud infrastructure were avoided to prevent exhausting the 512MB RAM free-tier allocation and triggering automated IP bans.
- **External Cohort Beta Testing:** External public user cohort deployments were excluded as an academic scope boundary; testing was conducted entirely through automated harnesses and developer-driven alpha verification.

---

## 3.3 Functional Testing Targets vs. Non-Functional Criteria

Testing activities balanced functional verification (evaluating system features against business rules) with non-functional quality evaluation (evaluating operational performance, security, and maintainability).

```
Table 3.1: Quality Attribute Verification Matrix: Functional vs. Non-Functional

Category          Quality Dimension             Verification Criteria & Thresholds                 Target Subsystem
---------------   ----------------------------  -------------------------------------------------  ---------------------------
Functional        User Authentication           Bcrypt work factor 12; invalid credential alert    Auth Controller (auth.ts)
Functional        Algorithmic Feed Sorting      Deterministic Top decay vs. New chronological      Feed Service (FeedService.ts)
Functional        Contract Validation           TypeBox rejection of out-of-bound string lengths   Shared Schemas (schemas/post.ts)
Functional        Social Graph Traversal        1-hop and 2-hop neighborhood adjacency querying    Graph Engine (graph.routes.ts)
Functional        Threaded Discussions          Adjacency list nested comments with reply pointers Comment Engine (comment.ts)
Functional        Full-Text Universal Search    Regex sanitization; case/diacritic insensitivity   Search Engine (search.routes.ts)
Non-Functional    Operational Latency           Datastore response times sub-2ms under load        MongoDB rs0 & Redis Cache
Non-Functional    Structural Maintainability    McCabe Cyclomatic Complexity CC <= 10              Full Backend Source Code
Non-Functional    Code Coverage                 Statement coverage tracking across UI components   Frontend Monorepo (V8)
Non-Functional    Deployment Security           HTTP security headers (CSP, X-Frame, nosniff)      Reverse Proxy (production-server)
Non-Functional    Responsive Compatibility      Zero visual clipping across 1440, 768, 375 px      Presentation Tier (CSS Grid)
Non-Functional    Data Resilience               Zero partial updates during transaction rollback   MongoDB Transaction Tier
```

---

## 3.4 The 45 Prescribed Testing Techniques and Applicability Matrix

Under the JAIN University 23CSE502 curriculum, 45 testing techniques are prescribed. Each technique was audited against its codebase presence, testing harness, execution logs, and output evidence, resulting in seven distinct classification categories:

```
Table 3.2: Master Classification and Applicability of the 45 Assigned Techniques

#    Technique Name                    Category         Verification Classification           Scope / Subsystem Evaluated
---  --------------------------------  ---------------  ------------------------------------  ------------------------------------------------
1    Non-Functional Testing            Non-Functional   Partially Executed                    Build metrics, sub-2ms datastore latency
2    Regression Testing                Verification     Independently Executed & Verified     292 Vitest unit tests rerun (100% pass)
3    Equivalence Partitioning          Black-Box        Independently Executed & Verified     19 cases across 6 TypeBox contracts
4    Boundary Value Analysis           Black-Box        Independently Executed & Verified     32 boundary checks (min-1, min, max, max+1)
5    Decision Table Testing            Functional       Previously Executed & Indep. Verified 4-rule auth credential matrix
6    State Transition Testing          Black-Box        Previously Executed & Indep. Verified Post lifecycle (Draft -> Published -> Saved)
7    Exploratory Testing               Black-Box        Independently Executed & Verified     Unscripted graph visualizer and feed navigation
8    Random Testing (Monkey)           Black-Box        Independently Executed & Verified     50 fuzzing dispatches on search and textareas
9    Requirements-Based Testing        Verification     Previously Executed & Indep. Verified PRD requirements traceability matrix
10   Cause-Effect Graphing             Black-Box        Previously Executed & Indep. Verified Feed query parameter boolean combinations
11   Compatibility Testing             Non-Functional   Independently Executed & Verified     Responsive UI across Desktop, Tablet, Mobile
12   User Documentation Testing        Non-Functional   Independently Executed & Verified     README setup verification on clean workstation
13   Domain Testing                    Functional       Independently Executed & Verified     Aspect ratio floats and pagination limits
14   Error Guessing Testing            Black-Box        Independently Executed & Verified     10 exploit vectors (NoSQL, prototype pollution)
15   White-Box Testing                 White-Box        Previously Executed & Indep. Verified Transaction retry loop and constant-time bcrypt
16   Desk Checking                     White-Box        Analytically Evaluated                Static inspection of atomic Redis Lua script
17   Unit / Code Functional Testing    White-Box        Independently Executed & Verified     Pure utility functions (formatRelativeTime)
18   Functional Testing                Functional       Independently Executed & Verified     Core CRUD operations across components
19   Statement Coverage                White-Box        Independently Executed & Verified     V8 AST line execution tracking (34.00%)
20   Path Coverage                     White-Box        Analytically Evaluated                Basis path analysis through AuthService.login (4)
21   Condition Coverage                White-Box        Analytically Evaluated                Truth-table analysis of compound predicates
22   Function Coverage                 White-Box        Independently Executed & Verified     V8 method invocation tracking (31.12%)
23   Code Coverage Testing             White-Box        Independently Executed & Verified     Comprehensive V8 multi-metric report
24   Code Complexity Testing           White-Box        Independently Executed & Verified     McCabe AST Cyclomatic Complexity (184 funcs)
25   Unit Testing                      White-Box        Independently Executed & Verified     298 unit tests (292 frontend + 6 backend)
26   Integration Testing               Grey-Box         Previously Executed & Indep. Verified 36 backend suites (33 passed, 3 reconciled)
27   System Testing                    Black-Box        Independently Executed & Verified     Integrated single-origin platform on port 3000
28   Acceptance Testing                Black-Box        Previously Executed & Indep. Verified User story acceptance verification
29   Scenario Testing                  Black-Box        Independently Executed & Verified     5 automated Playwright browser workflows
30   Defect Bash Elimination           Black-Box        Independently Executed & Verified     Systematic header inspection finding SEC-005
31   Scalability Testing               Non-Functional   Implemented but Not Reproduced        Multi-node replica clustering constrained
32   Reliability Testing               Non-Functional   Previously Executed & Indep. Verified Unhandled promise rejection error monitors
33   Stress Testing                    Non-Functional   Implemented but Not Reproduced        Host safety & cloud quota limits preserved
34   Interoperability Testing          Functional       Independently Executed & Verified     Fastify REST JSON matching browser fetch
35   Performance Testing               Non-Functional   Partially Executed                    Vite bundle build metric (11.91s), DB ping
36   Internationalization (I18N)       Globalization    Independently Executed & Verified     Multi-byte UTF-8 handling in titles and bios
37   Enabling Testing                  Accessibility    Independently Executed & Verified     DOM accessibility attributes, keyboard focus
38   Localization (L10N) Testing       Globalization    Previously Executed & Indep. Verified Hardcoded English suffix limitation (LOC-005)
39   Fake Language Testing             Globalization    Independently Executed & Verified     Pseudolocalization string expansion (+30%)
40   Language Compatibility Testing    Globalization    Independently Executed & Verified     MongoDB regex and UTF-8 collation queries
41   Configuration Testing             Environment      Independently Executed & Verified     Fastify environment variable parser
42   Security Testing                  Non-Functional   Independently Executed & Verified     Bcrypt cost 12, timing attack, SEC-005 gap
43   Recovery Testing                  Non-Functional   Partially Executed                    Fastify error handlers & Mongo reconnect code
44   Alpha Testing                     Operational      Independently Executed & Verified     Developer verification across 7 local runners
45   Beta Testing                      Operational      Not Performed                         Academic scope boundary (cohort deferred)
```

### Summary Breakdown of Classifications:
- **Independently Executed and Verified:** 27 Techniques (60.0%)
- **Previously Executed and Independently Verified:** 9 Techniques (20.0%)
- **Implemented but Not Reproduced:** 2 Techniques (4.4% — Scalability and Stress testing)
- **Partially Executed:** 3 Techniques (6.7% — Non-Functional, Performance, and Recovery testing)
- **Analytically Evaluated:** 3 Techniques (6.7% — Desk Checking, Path Coverage, Condition Coverage)
- **Not Performed:** 1 Technique (2.2% — Beta testing)
- **Not Applicable:** 0 Techniques (0.0%)

---

## 3.5 Testing Assumptions and Risk Boundaries

The execution and interpretation of testing results rely on several verified architectural assumptions:
1. **Fixture State Stability:** Seeding the MongoDB database with expanded fixtures (115 users, 510 posts, 18 communities) was verified as necessary to support meaningful social graph clustering and multi-hop traversal. All unit and schema boundary tests run against isolated in-memory constructs without mutating persistent seeded collections.
2. **Deterministic Loopback Latency:** Because all services execute locally via loopback interfaces (`127.0.0.1`), network transit latencies are sub-2ms. While this accurately isolates compute and database query overhead, it assumes that production WAN network jitter is handled by client-side retry policies in TanStack Query.
3. **Strict Code Freeze Enforcement:** Testing was conducted under a strict code freeze on branch `qa/testing-report-handoff` at commit `eb1f5ba4be1edd35f148d1f18a3dc748458828fb`. Application source code was not modified to force tests to pass. Discrepancies were tracked as genuine defects (`SEC-005`) or reconciled fixture mismatches (`BE-INT-001` through `003`).
