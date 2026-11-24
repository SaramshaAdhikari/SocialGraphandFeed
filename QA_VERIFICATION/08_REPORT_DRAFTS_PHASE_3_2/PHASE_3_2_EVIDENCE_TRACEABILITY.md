# Phase 3.2 Evidence Traceability Matrix: Chapters 1–4

**Course:** Software Testing (23CSE502)  
**Institution:** JAIN (Deemed-to-be University), Department of Computer Science and Engineering  
**Application Under Test:** DMND (`SocialGraphandFeed`)  
**Baseline Git Commit:** `eb1f5ba4be1edd35f148d1f18a3dc748458828fb`  
**Purpose:** Formal audit trail mapping every factual claim, architectural parameter, test metric, source code citation, and visual figure in Chapters 1 through 4 to its authoritative underlying repository file, test script, execution log, or audit document.

---

## 1. Master Evidence Traceability Register

```
Left-Aligned Traceability Audit Matrix:

Report Section / Claim              Claim Specification                             Authoritative Repository Source / Log                      Verification Asset ID
----------------------------------  ----------------------------------------------  ---------------------------------------------------------  ---------------------
Ch. 1.2: Runtime Topology Ports     Port 3000 (Proxy), 4000 (API), 27017, 6379      production-server.mjs, packages/backend/src/index.ts       Figure 2.1 (DIAG-TOPO)
Ch. 1.3: Concurrency Race Defense   Atomic Lua script & E11000 retry transaction    packages/backend/src/services/RateLimitService.ts:25-36    Code Excerpt 4 (Desk)
Ch. 2.2: Decoupled 3-Tier Hosting   Reverse proxy, Fastify microservice, datastores production-server.mjs, packages/backend/src/app.ts         Figure 2.1 (DIAG-TOPO)
Ch. 2.3: 15 Modular Subsystems      All 15 modules verified in monorepo source      packages/backend/src/routes/*, packages/frontend/src/*     15 Source Files
Ch. 2.4: Technology Stack Versions  React 18.3, Fastify 4.28, Mongo 7.0, Redis 8.1  packages/frontend/package.json, packages/backend/pkg.json  Table 2.1 (Stack)
Ch. 2.5: Hybrid Feed Strategy       Meta TAO cutoff: author followers > 10,000      packages/backend/src/services/FeedService.ts:26-55         Figure 2.2 (DIAG-FEED)
Ch. 2.6: ACID Transaction Retry     session.withTransaction with attempt <= 2       packages/backend/src/db/transaction.ts:5-25                Code Excerpt 2.2
Ch. 2.7: Functional Requirements    12 Functional Requirements (FR-01 to FR-12)     packages/backend/src/routes/*, packages/shared/schemas     Table 2.2 (Reqs)
Ch. 3.2: Scope Boundaries           In-Scope vs. Out-of-Scope (Host Limits)         QA_VERIFICATION/01_AUDIT/REPORT_ARCHITECTURE_FINAL.md      Section 3.2
Ch. 3.4: 45 Technique Status        27 Indep, 9 Prev, 2 Impl, 3 Part, 3 Analyt, 1 N QA_VERIFICATION/01_AUDIT/EVIDENCE_READINESS_AUDIT.md       Table 3.2 (Master)
Ch. 4.2: Hardware Telemetry         Dell 00JGRJ, i3-1005G1, 7.77 GiB RAM, Win 11    QA_VERIFICATION/04_ENVIRONMENT_EVIDENCE/ENV-SPEC.md        Figure 4.1 (ENV-001)
Ch. 4.3: Testing Frameworks         Vitest v2.1.8, Playwright Core, TypeBox v0.32   vitest.config.ts, packages/frontend/package.json           Table 4.2 (Tools)
Ch. 4.4: Seed Dataset Scale         115 Users, 510 Posts, 18 Communities            packages/backend/src/db/seed.ts:15-120                     MongoDB rs0 Audit
Ch. 4.5: 376 Independent Tests      292 FE Unit, 6 BE Serial, 32 BVA, 12 Neg, 19 EP QA_VERIFICATION/reconcile_test_counts.mjs                  TERM-001 to TERM-007
Ch. 4.5: 36 Integration Suites      33 Passed, 3 Failed (Reconciled Fixtures)       testing/execution_logs/backend_integration_suites.log      BE-INT-001 to 003
Ch. 4.7: Defect SEC-005             Static reverse proxy omits Helmet security hdrs production-server.mjs:52-64, defect_bash_execution.log    Figure 4.2 (DIAG-DEF)
Ch. 4.7: Defect BE-INT-001          Fastify 401 Unauthorized vs. expected 400      packages/backend/src/tests/integration/routes.integration  Log Lines 412-425
Ch. 4.7: Defect BE-INT-002          Search bio string fixture discrepancy           packages/backend/src/tests/integration/search.integration  Log Lines 188-195
Ch. 4.7: Defect BE-INT-003          Seed user count fixture discrepancy (115 vs 20) packages/backend/src/tests/integration/seed.integration    Log Lines 72-80
Ch. 4.7: Limitation LOC-005         Hardcoded English suffixes in relative time     packages/frontend/src/utils/date.ts:1-20                   localization.log
Ch. 4.8: 14 Workflow Demonstrations All 14 visual workflows verified on port 3000   QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-001..026    Figures 4.3 to 4.24
```

---

## 2. Integrity Verification Certification

I hereby certify that:
1. Every numerical count (376 independent tests, 292 frontend unit tests, 6 backend serialization tests, 32 BVA tests, 12 negative tests, 19 EP tests, 10 error-guessing tests, 5 E2E tests, 36 integration suites, 184 cyclomatic complexity functions) corresponds exactly to machine-readable test outputs.
2. The Fastify integration failures (`BE-INT-001` through `003`) are reported transparently and are not concealed or merged into the 376 passing tests.
3. Defect `SEC-005` is accurately identified as a genuine production code vulnerability in `production-server.mjs`.
4. No application source code, baseline reports, Git branch, or commit history was modified during this phase.
