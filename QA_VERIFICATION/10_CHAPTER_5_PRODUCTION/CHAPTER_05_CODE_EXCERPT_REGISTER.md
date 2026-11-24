# Chapter 5 Master Code Excerpt Register

**Course:** Software Testing (23CSE502)  
**Institution:** JAIN (Deemed-to-be University), Department of Computer Science and Engineering  
**Application Under Test:** DMND (`SocialGraphandFeed`)  
**Baseline Git Commit:** `eb1f5ba4be1edd35f148d1f18a3dc748458828fb`  
**Working Directory:** `QA_VERIFICATION/10_CHAPTER_5_PRODUCTION/`  
**Purpose:** Formal academic registry of all production source code excerpts, test scripts, and assertion blocks embedded in Chapter 5, establishing exact file paths, line ranges, and testing technique linkages.

---

## 1. Master Code Excerpt Index

```
Left-Aligned Code Excerpt Index:

Excerpt ID         Descriptive Title                               Target File Path                                            Line Range  Technique Linkage
-----------------  ----------------------------------------------  ----------------------------------------------------------  ----------  ------------------------------------------
Code Excerpt 5.1   Frontend Auth Context Login Unit Test           packages/frontend/src/auth/AuthContext.test.tsx             Lines 45-72 5.2 (Regression), 5.25 (Unit)
Code Excerpt 5.2   TypeBox Post Schema Boundary Contracts          packages/shared/src/schemas/post.ts                         Lines 75-1055.3 (Equivalence), 5.4 (BVA)
Code Excerpt 5.3   Boundary Value Analysis Test Runner Script      scripts/run_bva_and_negative.ts                             Lines 18-52 5.4 (BVA), 5.13 (Domain)
Code Excerpt 5.4   Decision Table Authentication Route Handler     packages/backend/src/routes/auth.ts                         Lines 32-68 5.5 (Decision Table)
Code Excerpt 5.5   Post State Transition Lifecycle Integration Testpackages/backend/src/tests/integration/posts.integration.tsLines 60-95 5.6 (State Transition)
Code Excerpt 5.6   Playwright Exploratory Navigation Test Script   QA_VERIFICATION/run_verified_e2e.mjs                        Lines 85-1205.7 (Exploratory), 5.29 (Scenario)
Code Excerpt 5.7   Random Input Fuzzing Test Script                QA_VERIFICATION/test_error_guessing.ts                      Lines 40-75 5.8 (Random / Monkey)
Code Excerpt 5.8   Multi-Clause Feed Query Boolean Pipeline        packages/backend/src/services/FeedService.ts                Lines 80-1155.10 (Cause-Effect Graphing)
Code Excerpt 5.9   Responsive CSS Grid Breakpoint Utilities        packages/frontend/src/index.css                             Lines 1-35  5.11 (Compatibility Testing)
Code Excerpt 5.10  Aspect Ratio Float Domain Boundary Validator    packages/shared/src/schemas/media.ts                        Lines 20-45 5.13 (Domain Testing)
Code Excerpt 5.11  Error Guessing Exploit Defense Vectors Harness  QA_VERIFICATION/test_error_guessing.ts                      Lines 12-48 5.14 (Error Guessing Testing)
Code Excerpt 5.12  ACID Multi-Document Transaction Retry Loop      packages/backend/src/db/transaction.ts                      Lines 5-25  5.15 (White-Box), 5.26 (Integration)
Code Excerpt 5.13  Atomic Redis Sliding-Window Lua Script          packages/backend/src/services/RateLimitService.ts           Lines 25-36 5.16 (Desk Checking), 5.31 (Scalability)
Code Excerpt 5.14  Relative Timestamp Formatter Utility Function   packages/frontend/src/utils/date.ts                         Lines 1-20  5.17 (Unit / Code), 5.38 (Localization)
Code Excerpt 5.15  Post Detail Discussion React Component Test     packages/frontend/src/pages/PostDetailPage.test.tsx         Lines 35-65 5.18 (Functional Testing)
Code Excerpt 5.16  Vitest V8 Coverage Configuration File           vitest.config.ts                                            Lines 15-35 5.19 (Statement), 5.23 (Coverage)
Code Excerpt 5.17  Basis Path Authentication Method Implementation packages/backend/src/services/AuthService.ts               Lines 43-56 5.20 (Path Coverage)
Code Excerpt 5.18  Compound Boolean Predicate Routing Logic        production-server.mjs                                       Lines 52-64 5.21 (Condition), 5.30 (Defect Bash)
Code Excerpt 5.19  Fastify Backend JSON Serialization Unit Suite   packages/backend/src/tests/unit/serialization.unit.test.ts  Lines 10-40 5.25 (Unit Testing)
Code Excerpt 5.20  Single-Origin Reverse Proxy Ingress Handler     production-server.mjs                                       Lines 40-75 5.27 (System Testing)
Code Excerpt 5.21  Playwright E2E Multi-Step User Scenarios Runner QA_VERIFICATION/run_verified_e2e.mjs                        Lines 15-55 5.29 (Scenario Testing)
Code Excerpt 5.22  RFC 7807 Problem Details Interoperability Schemapackages/shared/src/schemas/error.ts                        Lines 1-25  5.34 (Interoperability Testing)
Code Excerpt 5.23  Multi-Byte UTF-8 String Internationalization Testpackages/backend/src/tests/integration/posts.integration.tsLines 110-135.36 (I18N Testing)
Code Excerpt 5.24  Keyboard Accessibility Focus & ARIA Form Labels packages/frontend/src/pages/AuthPage.tsx                   Lines 25-50 5.37 (Enabling / Accessibility)
Code Excerpt 5.25  Pseudolocalization Text Expansion Wrapper       packages/frontend/src/utils/test-i18n.ts                    Lines 1-22  5.39 (Fake Language Testing)
Code Excerpt 5.26  MongoDB Universal Search Regex & Collation Querypackages/backend/src/routes/search.ts                       Lines 18-42 5.40 (Language Compatibility)
Code Excerpt 5.27  Fastify Environment Configuration Parser        packages/backend/src/config/env.ts                          Lines 10-38 5.41 (Configuration Testing)
Code Excerpt 5.28  Password Hashing & Constant-Time Dummy Defense  packages/backend/src/services/AuthService.ts               Lines 20-34 5.42 (Security Testing)
Code Excerpt 5.29  MongoDB Reconnect Listener & Health Probe       packages/backend/src/db/mongo.ts                            Lines 45-70 5.43 (Recovery Testing)
```

---

## 2. Technical Excerpt Details

Every code excerpt cited above is extracted verbatim from the active repository at baseline commit `eb1f5ba4be1edd35f148d1f18a3dc748458828fb`. In strict compliance with report formatting standards, all source code excerpts appear as independent monospaced blocks outside tables, preserving original TypeScript/JavaScript indentation and accompanied by analytical commentary.
