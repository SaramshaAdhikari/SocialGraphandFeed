# Forensic Audit of Existing Software Testing Reports (Markdown & Word)

**Document Audited:** `FINAL_QA_REPORT.md` and `FINAL_QA_REPORT.docx`  
**Audit Baseline Commit:** `eb1f5ba4be1edd35f148d1f18a3dc748458828fb`  
**Auditor:** Independent Software Testing & Quality Assurance Verification Agent  
**Date:** November 24, 2026  

---

## 1. Executive Summary & Purpose

This audit evaluates the existing Software Testing & Quality Assurance documentation handed over by T1 (Saramsha Adhikari) against the stringent requirements of an academic and technical engineering report.

While the existing reports establish a solid preliminary framework and correctly document key findings under a strict code freeze, they suffer from structural, visual, and technical limitations that prevent them from serving as the final academic submission:
1. **Omission of Source-Code Demonstrations**: The reports discuss testing techniques in the abstract, providing almost zero code excerpts from the actual application (`packages/backend/src`, `packages/frontend/src`, `packages/shared/src`).
2. **Absence of Detailed Test Case Tables**: Most testing techniques provide only a summary pass/fail count rather than explicit test-case tables detailing Test ID, Input Data, Preconditions, Execution Steps, Expected Output, Actual Output, and Verdict.
3. **Synthetic Evidence Substitution**: Almost all screenshots in Part B are programmatically generated PIL canvas renderings (fake terminal boxes) rather than genuine captures of the running React web application or real OS terminal sessions.
4. **Discrepancy Between Module Counts**: Part A of the report documents only 7 application modules, whereas the underlying application and `TESTS/module_inventory.md` define 15 distinct functional modules (`MOD-001` through `MOD-015`).
5. **Mechanically Generated Content**: Technique descriptions in Part B follow a rigid, repetitive 7-point boilerplate that recycles generic phrasing.

---

## 2. Detailed Gap Analysis Against Prescribed Academic Format

### 2.1 Missing Sections & Incomplete Coverage
- **Data Dictionary / Schema Model Reference**: The report lacks a formal data dictionary detailing MongoDB collections (`users`, `posts`, `comments`, `follows`, `communities`, `notifications`, `rate_limits`), field constraints, BSON types, and index definitions.
- **Testing Process & Defect Lifecycle Workflow**: Lacks visual diagrams representing the test execution lifecycle, triage hierarchy, and defect classification pipeline.
- **Detailed Equivalence Partitioning (EP)**: While Boundary Value Analysis (BVA) is documented, Equivalence Partitioning is not explicitly partitioned into valid and invalid equivalence classes for each critical domain entity (usernames, passwords, post bodies, aspect ratios, slugs).
- **Module Coverage Discrepancy**:
  - `FINAL_QA_REPORT.md` describes 7 modules: (1) Identity, (2) Social Graph, (3) Content Ingestion, (4) Dual-Strategy Feed, (5) Search Engine, (6) Threaded Comments, (7) Frontend Shell.
  - Actual Monorepo Architecture defines 15 modules: Adding Notifications (`MOD-005`), Media Management (`MOD-008`), Rate Limiting (`MOD-010`), Moderation (`MOD-011`), Server-Sent Events (`MOD-014`), and UI Primitives (`MOD-015`).

### 2.2 Insufficient Explanations & Technical Depth
- **Algorithmic Underpinning**: Key algorithms are mentioned by name without technical exposition:
  - Meta TAO Fan-Out-On-Write (FOOW) vs. Fan-Out-On-Read (FOOR) hybrid cutoff threshold ($N = 1,000$ followers).
  - Reddit-style HotScore calculation: $Score = \log_{10}(\max(1, |U - D|)) + \frac{\text{sign}(U-D) \cdot t}{45000}$.
  - Distributed Sliding-Window Rate Limiting using Redis sorted sets (`ZADD`, `ZREMRANGEBYSCORE`, `ZCARD`).
- **White-Box Coverage Nuance**: Explains V8 percentages (34% statement coverage), but fails to explain *why* coverage is distributed unevenly (e.g. interactive canvas in `GraphPage.tsx` having 13% coverage due to canvas rendering context mock limitations in JSDOM).

### 2.3 Missing Source-Code Examples
The existing report contains almost zero code excerpts:
- No Fastify route controller definitions showing RFC 7807 problem details error handling.
- No TypeBox schema contracts showing validation decorators (`Type.String({ minLength: 3, maxLength: 30 })`).
- No MongoDB multi-document ACID transaction wrapper (`withTransaction`).
- No React hooks demonstration (`useFeed`, `useCreatePost`, `useSocialGraph`).
- No Playwright browser automation snippets.

### 2.4 Missing Test-Case Input/Output Tables
For academic evaluation, each testing technique requires a clear table:
```
+---------+----------------------------------+------------------+-----------------+---------------+--------+
| Test ID | Test Scenario                    | Input Data       | Expected Result | Actual Result | Status |
+---------+----------------------------------+------------------+-----------------+---------------+--------+
```
The existing report provides bulleted text summaries without structured per-test inputs and expected outputs.

### 2.5 Insufficient & Synthetic Screenshots
- Total embedded images in `FINAL_QA_REPORT.docx`: **14 shapes**.
- Nature of existing images:
  - 10 are PIL-drawn simulated terminal frames with colored text on a black rectangle.
  - Only 4 show actual browser layouts, and those are limited in scope.
- Missing genuine screenshots:
  - Responsive layouts (Mobile 375px, Tablet 768px, Desktop 1440px).
  - Dark mode vs. Light mode vs. Noir mode.
  - Interactive Social Graph force-directed canvas.
  - Direct Messaging and Conversation Thread views.
  - Threaded comment reply collapse and expansion.
  - Post Composer markdown preview split-view.
  - Form validation states (password mismatch, slug character violations, empty content).

### 2.6 Environment & Reproducibility Documentation Issues
- The documentation in `LOCAL_ENVIRONMENT_SETUP.md` references a specific workstation path (`C:\Users\saram\Projects\SocialGraphandFeed_Testing`) and assumes Docker is hosted inside WSL2 Ubuntu 22.04.
- On standard developer machines lacking WSL2 or with stopped Docker services, the application can actually execute with native Windows Node.js, native Windows MongoDB (port 27017), and native Windows Redis (port 6379), or in frontend Mock mode via `MockAdapter`. This native fallback is not documented in the main report.

---

## 3. Defect & Reconciliation Audit

| Finding ID | Classification | Location | Report Presentation Issue | Reconciled Reality |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-005** | Genuine Defect (Medium) | `production-server.mjs:57-63` | Correctly analyzed in Part C, but omitted from Executive Summary. | Root SPA HTML document lacks CSP, X-Frame-Options, X-Content-Type-Options headers. |
| **BE-INT-001** | Test Assumption (Low) | `feed-routes.test.ts:155` | Labeled as a test failure without clearly contrasting HTTP 401 vs 400. | Auth hook fails closed before parsing body; standard security behavior. |
| **BE-INT-002** | Test Fixture Error (Low) | `mongo-integration.test.ts:513` | Presented as database query issue. | Seed bio for `lucas_t` lacks the word "systems"; test fixture text mismatch. |
| **BE-INT-003** | Test Mode Error (Low) | `mongo-integration.test.ts:720` | Presented as an idempotency bug. | `seedDatabase` defaulted to expanded mode (110 users) instead of baseline (20 users). |
| **LOC-005** | Unimplemented Feature | `packages/frontend/src` | Occasionally grouped with defects. | Absence of i18n translation catalogs; scope boundary, not a code defect. |

---

## 4. Word Document Presentation & Formatting Audit

1. **Table Widths and Cell Wrapping**: Several tables generated by `convert_to_docx.py` have fixed-width columns that cause text wrapping on 2-letter words.
2. **ASCII Diagram Degradation**: ASCII box-drawing diagrams in Section 1.2 render as single-cell table text blocks with uneven font proportions rather than high-resolution vector figures.
3. **Header/Footer Page Numbering**: Document header contains hardcoded title strings without dynamic section name tracking.
4. **Figure Captions**: Figure captions are rendered as plain italicized paragraphs rather than Word native caption elements linked to cross-references.

---

## 5. Required Actions for the Subsequent Report Phase

1. **Expand Module Inventory to all 15 Functional Subsystems**.
2. **Incorporate Real Production Code Excerpts** with exact file paths and line ranges.
3. **Capture 25+ Genuine High-Resolution Browser Screenshots** covering every application module, user journey, and error boundary.
4. **Capture Real Terminal Execution Screenshots** showing Vitest, TypeBox, AST complexity, and Playwright runs.
5. **Construct Structured Test Case Tables** for all 22 Black-Box and 8 White-Box techniques.
6. **Provide Clear Architectural & Workflow Diagrams** using formal notation.
