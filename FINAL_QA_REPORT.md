# Formal Software Testing & Quality Assurance Report

**Project Title**: SocialGraph & Feed Engineering Platform  
**Architecture Inspiration**: Meta TAO (The Associations and Objects) Distributed Data Store  
**Deployed Commit Baseline**: `94540883ab99b8862ac995fa9afebc2e9eadaa16`  
**Evaluation Scope**: Formal Verification, Local Test Execution, and Multi-Tier Quality Assurance  
**Testing Environment**: Isolated Local Testing Workspace (`SocialGraphandFeed_Testing`)  
**Document Classification**: Academic & Technical Quality Assurance Submission  

---

# Table of Contents
1. **PART A — Project Report**
   - 1.1 Abstract
   - 1.2 Introduction & Architectural Overview
   - 1.3 Hardware and Software Requirements
   - 1.4 Module Descriptions
   - 1.5 System Execution & Local Reproduction
   - 1.6 Future Enhancements & Architectural Roadmap
2. **PART B — Software Testing & Quality Assurance**
   - 2.1 Quality Assurance Methodology & Unified Scorecard
   - 2.2 Black Box Testing Techniques
     - 2.2.1 Functional Testing
     - 2.2.2 Integration Testing
     - 2.2.3 System Testing (End-to-End Browser Workflows)
     - 2.2.4 Acceptance Testing
     - 2.2.5 Boundary Value Analysis (BVA)
     - 2.2.6 Negative Testing
     - 2.2.7 Scenario Testing
     - 2.2.8 Security Testing
     - 2.2.9 Performance Testing
     - 2.2.10 Compatibility Testing
     - 2.2.11 Internationalization & Localization Testing
     - 2.2.12 Scalability Testing (Not Performed)
     - 2.2.13 Stress Testing (Not Performed)
   - 2.3 White Box Testing Techniques
     - 2.3.1 Unit Testing
     - 2.3.2 Statement Coverage
     - 2.3.3 Branch / Decision Coverage
     - 2.3.4 Function Coverage
     - 2.3.5 Path Coverage
     - 2.3.6 Condition Coverage
     - 2.3.7 Cyclomatic Complexity Testing
     - 2.3.8 Desk Checking & Static Code Inspection
     - 2.3.9 Regression Testing
3. **PART C — Consolidated Defect & Risk Audit**
   - 3.1 Defect Classification & Root-Cause Matrix
   - 3.2 Analysis of the Three Backend Integration Failures
   - 3.3 Analysis of Production Security Finding SEC-005
   - 3.4 Residual Risk Assessment & Sign-Off

---

# PART A — Project Report

## 1.1 Abstract
The **SocialGraph & Feed Engineering Platform** is an enterprise-grade social networking and feed distribution web application inspired by Meta’s TAO (The Associations and Objects) distributed data model. The platform addresses fundamental engineering challenges in high-concurrency social applications: dual-strategy feed generation (hybrid Fan-Out-On-Write and Fan-Out-On-Read), real-time graph edge management, multi-layered Redis caching with explicit invalidation barriers, multi-document atomic MongoDB transactions, and sliding-window distributed rate limiting. 

This Software Testing and Quality Assurance Report presents a forensic, evidence-backed evaluation of the application at commit `94540883ab99b8862ac995fa9afebc2e9eadaa16`. Testing was conducted under a **strict application code freeze** without modifying application source files or business logic. Verification encompassed distinct testing tiers: 527 distinct automated Vitest test cases (232 passed and 3 failed in backend integration; 292 passed in frontend unit/component tests), 32 standalone schema boundary assertions (all passed), 10 browser-driven end-to-end workflows executed via Playwright (all passed), and 5 live production security probes against Render Cloud (4 passed, 1 security finding SEC-005). Core data flows, transactions, distributed rate limiting, and browser user journeys operate reliably.

---

## 1.2 Introduction & Architectural Overview
Modern social networks experience asymmetrical read-to-write traffic patterns characterized by extreme fan-out dynamics. A post published by a creator with hundreds of thousands of followers can overwhelm traditional relational database schemas if fan-out operations are executed synchronously.

The SocialGraph platform implements a decoupled, multi-tiered architecture:
- **Client Tier**: A responsive single-page application built with React 19, TypeScript, Tailwind CSS, and Lucide icons, offering fluid feed scrolling, rich Markdown authoring, optimistic follow toggles, and live theme customization (Dark, Light, Noir).
- **Edge / Reverse Proxy Tier**: A production single-origin server (`production-server.mjs`) serving pre-compiled frontend assets and proxying API mutations (`/api/*`) and media storage (`/uploads/*`) to maintain same-origin session security.
- **Application Server Tier**: A high-performance Node.js service powered by Fastify, TypeBox schema compilation, and RFC 7807 problem details error handling.
- **Persistence Tier**: MongoDB 7.0.14 configured as a single-node replica set (`rs0`) to support multi-document ACID transactions across posts, comments, votes, and graph edges.
- **Caching & Coordination Tier**: Redis 7.4.2 providing distributed sliding-window rate limiting, session storage, and in-memory feed delivery timelines.

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT BROWSER                                     |
|                      React 19 SPA • Tailwind CSS • Lucide Icons                       |
+-------------------------------------------+-------------------------------------------+
                                            | HTTP / Same-Origin
                                            v
+---------------------------------------------------------------------------------------+
|                 SINGLE-ORIGIN PRODUCTION SERVER (production-server.mjs)               |
|            Serves Static Assets (Port 3000) • Proxies /api/* to Port 4000            |
+-------------------------------------------+-------------------------------------------+
                                            | Reverse Proxy Loopback
                                            v
+---------------------------------------------------------------------------------------+
|                              FASTIFY BACKEND API (Port 4000)                          |
|    Schema Validation (TypeBox) • Identity & CSRF Hooks • Rate Limiting (Sliding Window)   |
+---------------------+-------------------------------------------+---------------------+
                      |                                           |
                      v                                           v
+-------------------------------------+   +---------------------------------------------+
|    MONGODB REPLICA SET (rs0:27027)  |   |           REDIS CACHE (Port 6387)           |
|  - Users & Session Stores           |   |  - User Timeline Queues                     |
|  - Posts & Threaded Comments        |   |  - Sliding-Window Rate Limit Keys           |
|  - Follow Graph Edges (rs0 Txns)    |   |  - Distributed Invalidation Barriers        |
+-------------------------------------+   +---------------------------------------------+
```

---

## 1.3 Hardware and Software Requirements

### Hardware Requirements
- **Host Processor**: 64-bit multi-core CPU (Intel Core i5/i7 or AMD Ryzen 5/7, minimum 4 physical cores).
- **Random Access Memory (RAM)**: Minimum 8 GB RAM (16 GB recommended for concurrent Docker, WSL2, and browser automation).
- **Storage**: Minimum 10 GB available SSD space for container layers, Node modules, build dists, and test evidence.
- **Display Resolution**: Minimum 1280x720 (1440x900 viewport utilized for standard E2E test captures).

### Software Requirements
- **Host Operating System**: Microsoft Windows 11 Home (64-bit, Version 24H2, Build 26100.3194).
- **Virtualization Subsystem**: Windows Subsystem for Linux (WSL2), Linux Kernel 5.15.167.4.
- **Linux Distribution**: Ubuntu 22.04 LTS (`Ubuntu-22.04`).
- **Container Engine**: Docker Engine v28.5.1 with Docker Compose v2.40.3.
- **JavaScript Runtime**: Node.js v22.14.0 (Windows Native).
- **Package Manager**: npm v10.9.2.
- **Automation Browser**: Google Chrome v130.0.6723.117 (Windows x64).
- **Test Automation Frameworks**: Vitest v5.1.1, Playwright Core v1.65.1, TypeBox v0.34.28.

### Network Configuration & Port Matrix
- `127.0.0.1:3000`: Frontend Single-Origin Server (HTTP/1.1)
- `127.0.0.1:4000`: Fastify Backend REST API Service
- `127.0.0.1:27027`: Development MongoDB Replica Set (`rs0`)
- `127.0.0.1:6387`: Development Redis In-Memory Cache
- `127.0.0.1:27018`: Isolated Test MongoDB Replica Set (`rs0`)
- `127.0.0.1:6380`: Isolated Test Redis In-Memory Cache

---

## 1.4 Module Descriptions

### Module 1: Identity, Authentication & Session Boundary
- **Files**: `packages/backend/src/services/AuthService.ts`, `packages/backend/src/routes/identity.ts`
- **Functionality**: Manages user registration, login, logout, and session restoration. Passwords are encrypted using `bcryptjs` with an adaptive work factor of 12. Generates cryptographically secure, session-bound CSRF tokens. Employs `httpOnly`, `sameSite=lax` session cookies. Protects against user enumeration by returning identical RFC 7807 401 error payloads for missing and invalid users.

### Module 2: Social Graph & Association Engine
- **Files**: `packages/backend/src/services/FollowService.ts`, `packages/backend/src/routes/users.ts`
- **Functionality**: Implements directed social graph edges (follower/following). Supports atomic follow/unfollow operations using MongoDB replica set transactions to guarantee counter consistency (`followers_count`, `following_count`). Enforces idempotent graph writes and prevents self-following.

### Module 3: Content Ingestion & Discussion Publishing
- **Files**: `packages/backend/src/services/PostService.ts`, `packages/backend/src/routes/posts.ts`
- **Functionality**: Provides unified publishing for discussion posts and visual media pins. Enforces payload validation (maximum 300 character title, 40,000 character Markdown body, maximum 10 media items, 20 tags). Implements client-driven idempotency keys (`Idempotency-Key` header) backed by Redis to prevent duplicate submissions on network retries.

### Module 4: Dual-Strategy Feed Delivery Engine
- **Files**: `packages/backend/src/services/FeedService.ts`, `packages/backend/src/routes/feed.ts`
- **Functionality**: Employs a hybrid delivery architecture inspired by Meta TAO:
  - **Standard Users (< 500 followers)**: Fan-Out-On-Write (FOOW) pushes post pointers to follower timeline lists in Redis upon publishing.
  - **High-Degree Creators (> 500 followers)**: Fan-Out-On-Read (FOOR) avoids write amplification by dynamically merging celebrity posts into timelines during query execution.
  - **Ranking Algorithms**: Generates real-time feeds sorted by `Hot` (Hacker News gravity decay formula), `Top` (vote score), and `New` (chronological).

### Module 5: Universal Multi-Entity Search Engine
- **Files**: `packages/backend/src/services/SearchService.ts`, `packages/backend/src/routes/search.ts`
- **Functionality**: Executes multi-entity search queries across three distinct collections: Discussions (`posts`), Communities (`communities`), and Users (`users`). Implements text index scoring, prefix matching, and category filtering (`all`, `discussions`, `communities`, `people`).

### Module 6: Threaded Comments & Content Lifecycle
- **Files**: `packages/backend/src/services/CommentService.ts`, `packages/backend/src/services/ModerationService.ts`
- **Functionality**: Supports hierarchical threaded comments with parent-child relationships. Uses atomic transaction rollbacks if comment count increments fail. Moderation service manages user reporting, report rate limits (5 per minute), and administrative review actions.

### Module 7: Frontend Application Shell & Generative UI
- **Files**: `packages/frontend/src/App.tsx`, `packages/frontend/src/components/*`
- **Functionality**: React 19 single-page application with responsive layouts for mobile (320px-430px), tablet (768px), and desktop (1280px-1440px). Features an interactive masonry grid, live theme switcher (Dark, Light, Noir), and custom client-side router with deep linking.

---

## 1.5 System Execution & Local Reproduction

### Step 1: Environment & Persistence Activation
Launch the persistent WSL2 daemon keeper to ensure Docker containers and network forwarders remain active:
```powershell
wsl -d Ubuntu-22.04 -- sleep 86400
```

### Step 2: Container Infrastructure Startup
Start the isolated development containers for MongoDB replica set and Redis:
```powershell
wsl -d Ubuntu-22.04 docker compose -f docker-compose.yml up -d mongodb redis
```

### Step 3: Database Seeding
Populate the development replica set with baseline fixtures (110 users, 500 posts, 298 comments, 435 graph edges, 18 communities):
```powershell
cd C:\Users\saram\Projects\SocialGraphandFeed_Testing
npm run seed --workspace=@socialgraph/backend
```

### Step 4: Fastify Backend API Service Startup
Start the backend service on port 4000:
```powershell
node packages/backend/dist/index.js
```
*Expected Output*: `🚀 Backend server listening on http://127.0.0.1:4000`

### Step 5: Frontend Single-Origin Server Startup
Start the production reverse proxy server on port 3000:
```powershell
node production-server.mjs
```
*Expected Output*: `Production server listening on http://0.0.0.0:3000, proxying /api to http://127.0.0.1:4000`

### Step 6: Browser Access & Verification
Open Google Chrome and navigate to `http://127.0.0.1:3000/`. Verify health at `http://127.0.0.1:3000/api/v1/health`.

---

## 1.6 Future Enhancements & Architectural Roadmap
1. **Security Header Hardening (Defect SEC-005 Remediation)**: Add security headers (`Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`) to `production-server.mjs` for the root SPA HTML document.
2. **Internationalization & Localization (i18n)**: Implement `react-i18next` with JSON translation catalogs (`es.json`, `fr.json`, `de.json`) to address Finding LOC-005.
3. **Multi-Region Distributed Replication**: Expand MongoDB replica set from a single-node testing cluster (`rs0`) to a multi-region distributed replica set across cloud availability zones.
4. **WebSocket Multi-User Direct Messaging**: Upgrade real-time notifications to bidirectional WebSocket messaging with typing indicators and read receipts.
5. **High-Concurrency Load Simulation**: Deploy distributed k6 worker nodes against a staging cluster to benchmark feed delivery under 50,000 requests/second.

---

# PART B — Software Testing & Quality Assurance

## 2.1 Quality Assurance Methodology & Unified Scorecard
The quality assurance campaign was conducted using a strict, multi-tiered testing hierarchy combining automated unit tests, container-backed integration suites, standalone schema boundary analysis, browser-driven end-to-end workflows, and live production security audits.

| Testing Category | Target / Scope | Result / Status | Notes |
| :--- | :--- | :--- | :--- |
| **Backend Integration Tests** | Docker Containers (`rs0`: 27018, Redis: 6380) | 232 passed, 3 failed (235 total) | Includes the 6 serialization tests |
| **Frontend Unit & Component Tests**| Vitest / JSDOM (`packages/frontend`) | 292 passed (292 total) | Component & hook tests |
| **Distinct Vitest Test Cases** | Monorepo Automated Test Suite | **527 distinct cases** (524 pass, 3 fail) | 235 backend + 292 frontend |
| **Browser E2E Workflows** | Playwright / Chrome (`http://127.0.0.1:3000`)| 10 reported passed | User journeys across running local stack |
| **Live Production Security Probes**| Render Cloud (`onrender.com`) | 4 passed, 1 failed (5 total) | Endpoint & security header audits |
| **Boundary Value Schema Assertions**| Standalone TypeBox Validator | 32 passed, reported separately | Standalone schema boundary checks |

> [!NOTE]
> **Audit Reconciliation Note**: The 6 backend serialization tests are executed as part of the 235 backend integration suite run. To maintain scientific rigor and prevent double-counting, they are reported as part of the 235 backend total rather than as a separate unit-testing count. Furthermore, the 527 Vitest cases, 10 browser workflows, and 5 production probes represent distinct testing categories with differing execution models and are evaluated separately.

---

## 2.2 Black Box Testing Techniques

---

### 2.2.1 Functional Testing

#### 1. Objective
To verify that all application features, routing behaviors, authentication controls, and data mutations adhere to specified business requirements from an external user/client perspective.

#### 2. Scope
Testing HTTP route contracts, request parameter parsing, authenticated mutation boundaries, and API responses across Fastify backend routes.

#### 3. Condition and Output
- **Execution Steps**:
  1. Initialize Fastify backend test harness using `app.inject()`.
  2. Issue HTTP requests with valid and invalid payloads across auth, posts, comments, communities, and votes.
  3. Validate HTTP status codes, response headers, and RFC 7807 problem detail payloads.
  4. Compare output against TypeBox API response contracts.

| Test ID | Condition / Input | Expected Result | Actual Result | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `FUNC-001` | `POST /api/v1/auth/login` with valid credentials | 200 OK + `sg_session` cookie + CSRF token | 200 OK + session cookie set | **PASS** | [functional_testing.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/functional_testing.log) |
| `FUNC-002` | `POST /api/v1/posts` with valid title, body, and tags | 201 Created + PostCard object | 201 Created + PostCard JSON | **PASS** | [functional_testing.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/functional_testing.log) |
| `FUNC-003` | `POST /api/v1/posts/:id/vote` with direction `1` | 200 OK + score incremented | 200 OK + updated score | **PASS** | [functional_testing.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/functional_testing.log) |
| `FUNC-004` | `GET /api/v1/feed?sort=hot` | 200 OK + FeedResponseSchema matching array | 200 OK + sorted feed | **PASS** | [functional_testing.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/functional_testing.log) |
| `FUNC-005` | `POST /api/v1/users/:username/follow` | 200 OK + follower count incremented | 200 OK + updated user profile | **PASS** | [functional_testing.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/functional_testing.log) |

#### 4. Execution Summary
- **Test Cases Executed**: 28 route functional validation cases.
- **Passed**: 27.
- **Failed**: 1 (`feed-routes.test.ts:155` — authentication precedence over schema validation).

#### 5. Defect Summary
One test failure recorded (`BE-INT-001`). The route returned `HTTP 401 Unauthorized` instead of `HTTP 400 Bad Request` because Fastify's authentication hook executed prior to schema validation.

#### 6. Risk Analysis
Low risk. Unauthenticated requests are rejected fail-closed with 401, preserving system security.

#### 7. Environment Details
Windows 11 with WSL2 Ubuntu-22.04, Node.js v22.14, Vitest v5.1.1, Fastify HTTP injector.

---

### 2.2.2 Integration Testing

#### 1. Objective
To verify that independent services—Fastify HTTP layer, MongoDB replica set, and Redis in-memory cache—interoperate reliably under concurrent transactional workflows.

#### 2. Scope
Testing database persistence, multi-document ACID transaction commit/rollback, cache-invalidation barriers, distributed rate limiting, and dual-strategy feed fan-out across real Docker containers.

#### 3. Condition and Output
- **Execution Steps**:
  1. Start Docker containers: MongoDB replica set on port 27018, Redis on port 6380.
  2. Set environment variables `MONGODB_TEST_URI` and `REDIS_TEST_URL`.
  3. Execute `npx vitest run --no-file-parallelism` across all 15 backend integration test suites.
  4. Capture transaction rollbacks, index constraints, and cache operations.

| Test ID | Condition / Input | Expected Result | Actual Result | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `INT-001` | Concurrent duplicate report submissions | Safe race handling: one 201, one 409 | Handled safely via unique index | **PASS** | [backend_integration_suites.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/backend_integration_suites.log#L150) |
| `INT-002` | Vote score update failure mid-transaction | Rollback vote record, score unchanged | Transaction aborted and rolled back | **PASS** | [backend_integration_suites.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/backend_integration_suites.log#L205) |
| `INT-003` | Sliding-window Redis login brute-force | Block client with 429 after 5 attempts | 429 Too Many Requests + Retry-After | **PASS** | [backend_integration_suites.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/backend_integration_suites.log#L310) |
| `INT-004` | Follower crosses 500 threshold | Transition from FOOW to FOOR cleanly | Zero duplicate items, correct order | **PASS** | [backend_integration_suites.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/backend_integration_suites.log#L450) |
| `INT-005` | Search for term `"systems"` across entities | Matches discussions, communities, user | User `lucas_t` not found | **FAIL** | [backend_integration_suites.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/backend_integration_suites.log#L513) |

#### 4. Execution Summary
- **Test Cases Executed**: 235 distinct integration tests across 15 test suites.
- **Passed**: 232 (98.7%).
- **Failed**: 3 (1.3%).
- **Execution Duration**: 109.20 seconds.

#### 5. Defect Summary
Three test failures recorded:
1. `feed-routes.test.ts:155` (`BE-INT-001`): Auth 401 precedence over 400 validation.
2. `mongo-integration.test.ts:513` (`BE-INT-002`): Fixture mismatch where `lucas_t` profile lacks the search term `"systems"`.
3. `mongo-integration.test.ts:720` (`BE-INT-003`): `seedDatabase` defaults to expanded mode (110 users), conflicting with test's baseline mode expectation (20 users).

#### 6. Risk Analysis
The three failures are test fixture and expectation mismatches. Core data integrity, transactions, and distributed caching operate without defect.

#### 7. Environment Details
Windows 11 host connecting to Docker containers on WSL2: `socialgraph-test-mongodb-test-1` (port 27018, `rs0`) and `socialgraph-test-redis-test-1` (port 6380).

---

### 2.2.3 System Testing (End-to-End Browser Workflows)

#### 1. Objective
To validate complete, integrated user journeys from the browser DOM through the reverse proxy to the backend and databases under real-world conditions.

#### 2. Scope
Testing authentication, feed rendering, post composition, database mutations, social graph following, commenting, searching, and theming on `http://127.0.0.1:3000`.

#### 3. Condition and Output
- **Execution Steps**:
  1. Start local application stack (ports 3000, 4000, 27027, 6387).
  2. Launch Google Chrome headless via Playwright Core (viewport: 1440x900).
  3. Execute 10 automated user journeys.
  4. Capture full-resolution PNG screenshots.

| Test ID | User Journey | Action & Verification | Result | Screenshot Evidence |
| :--- | :--- | :--- | :--- | :--- |
| `LOCAL_E2E_001` | Negative Login | Submit invalid credentials; verify alert banner | **PASS** | [LOCAL_E2E_001_AUTH_INVALID.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_001_AUTH_INVALID.png) |
| `LOCAL_E2E_002` | User Registration | Register user `qa_lead_39265`; verify session redirect | **PASS** | [LOCAL_E2E_002_REGISTRATION_SUCCESS.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_002_REGISTRATION_SUCCESS.png) |
| `LOCAL_E2E_003` | Session State | Verify top navigation bar displays user avatar | **PASS** | [LOCAL_E2E_003_LOGIN_SESSION.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_003_LOGIN_SESSION.png) |
| `LOCAL_E2E_004` | Feed Delivery | Render 500 seeded posts; click "Top" tab filter | **PASS** | [LOCAL_E2E_004_FEED_DELIVERY.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_004_FEED_DELIVERY.png) |
| `LOCAL_E2E_005` | Post Composer | Populate Markdown body and Title inputs in `/create` | **PASS** | [LOCAL_E2E_005_POST_COMPOSER.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_005_POST_COMPOSER.png) |
| `LOCAL_E2E_006` | Post Mutation | Click Publish; assert redirect to `/post/post_1795...` | **PASS** | [LOCAL_E2E_006_POST_PUBLISHED.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_006_POST_PUBLISHED.png) |
| `LOCAL_E2E_007` | Comment Engagement | Submit comment on post detail page | **PASS** | [LOCAL_E2E_007_COMMENT_ENGAGEMENT.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_007_COMMENT_ENGAGEMENT.png) |
| `LOCAL_E2E_008` | Social Graph Follow | Click Follow; assert button toggles to "Following" | **PASS** | [LOCAL_E2E_008_SOCIAL_GRAPH_FOLLOW.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_008_SOCIAL_GRAPH_FOLLOW.png) |
| `LOCAL_E2E_009` | Universal Search | Execute search `q=systems`; verify result cards | **PASS** | [LOCAL_E2E_009_UNIVERSAL_SEARCH.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_009_UNIVERSAL_SEARCH.png) |
| `LOCAL_E2E_010` | Theme Customization | Select Dark/Light theme; verify DOM class change | **PASS** | [LOCAL_E2E_010_THEME_CUSTOMIZATION.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/SCREENSHOTS/LOCAL_E2E/LOCAL_E2E_010_THEME_CUSTOMIZATION.png) |

#### 4. Execution Summary
- **Workflows Executed**: 10 distinct user journeys.
- **Passed**: 10 (100%).
- **Failed**: 0.
- **Duration**: 22.8 seconds.

#### 5. Defect Summary
Zero functional defects observed during E2E browser execution.

#### 6. Risk Analysis
Three workflows had strong programmatic assertions (invalid login alert, post redirect, follow state change), while seven relied on action completion and visual evidence. Testing was limited to Chromium; Safari/Firefox were not automated.

#### 7. Environment Details
Playwright Core v1.65 driving Google Chrome v130 (Headless, 1440x900) targeting single-origin server `http://127.0.0.1:3000`.

---

### 2.2.4 Acceptance Testing

#### 1. Objective
To confirm that user interface ergonomics, responsive breakpoints, visual aesthetics, and navigation flows satisfy stakeholder acceptance criteria.

#### 2. Scope
Verification of responsive viewports (Mobile 390px, Tablet 768px, Desktop 1440px), modal overlays, appearance preferences, and discover masonry grid layout.

#### 3. Condition and Output
- **Execution Steps**:
  1. Load application across standard device viewport dimensions.
  2. Inspect layout stability, element wrapping, and modal backdrop rendering.
  3. Validate theme transitions and appearance settings.

| Test ID | Viewport / Feature | Acceptance Criterion | Observed Result | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ACC-001` | Mobile Viewport (390x844) | Bottom navigation visible, feed stacked single column | Responsive layout adapted cleanly | **PASS** | [acceptance_mobile_390_home.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/packages/frontend/dist/acceptance_mobile_390_home.png) |
| `ACC-002` | Desktop Viewport (1440x900)| Three-column layout: Nav Rail, Main Feed, Community Rail | All three columns aligned | **PASS** | [acceptance_desktop_1440_home.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/packages/frontend/dist/acceptance_desktop_1440_home.png) |
| `ACC-003` | Discover Masonry Grid | Dynamic column calculation without image clipping | Balanced masonry layout | **PASS** | [acceptance_desktop_1440_discover_masonry.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/packages/frontend/dist/acceptance_desktop_1440_discover_masonry.png) |
| `ACC-004` | Post Detail Modal | Discussion thread view renders with vertical vote rail | Reddit-style layout verified | **PASS** | [acceptance_post_modal_discussion.png](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/packages/frontend/dist/acceptance_post_modal_discussion.png) |

#### 4. Execution Summary
- **Acceptance Scenarios**: 8 responsive viewports and modal layouts.
- **Passed**: 8 (100%).
- **Failed**: 0.

#### 5. Defect Summary
Zero visual defects observed. Layouts conform to modern UX standards.

#### 6. Risk Analysis
Low risk. Layout stability verified across standard desktop and mobile viewports.

#### 7. Environment Details
Vite React production bundle served via `production-server.mjs`.

---

### 2.2.5 Boundary Value Analysis (BVA)

#### 1. Objective
To systematically evaluate system behavior at the exact minimum, nominal, and maximum boundaries of all input domains defined by TypeBox schema contracts.

#### 2. Scope
Validation of input lengths across usernames, passwords, post titles, post content, media arrays, tag collections, user bios, and comments.

#### 3. Condition and Output
- **Execution Steps**:
  1. Import schema contracts from `packages/shared/dist/index.js`.
  2. Evaluate values at boundary points: $(Min - 1)$, $Min$, $(Min + 1)$, $(Max - 1)$, $Max$, $(Max + 1)$.
  3. Validate boolean acceptance via `Value.Check()`.

| Test ID | Target Field | Boundary Condition Evaluated | Expected | Actual | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `BVA-001` | Username | Length = 2 characters ($Min - 1$) | Rejected | Rejected | **PASS** | [bva_execution.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/bva_execution.log#L3) |
| `BVA-002` | Username | Length = 3 characters ($Min$) | Accepted | Accepted | **PASS** | [bva_execution.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/bva_execution.log#L4) |
| `BVA-005` | Username | Length = 30 characters ($Max$) | Accepted | Accepted | **PASS** | [bva_execution.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/bva_execution.log#L7) |
| `BVA-006` | Username | Length = 31 characters ($Max + 1$) | Rejected | Rejected | **PASS** | [bva_execution.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/bva_execution.log#L8) |
| `BVA-010` | Post Title | Length = 300 characters ($Max$) | Accepted | Accepted | **PASS** | [bva_execution.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/bva_execution.log#L12) |
| `BVA-011` | Post Title | Length = 301 characters ($Max + 1$) | Rejected | Rejected | **PASS** | [bva_execution.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/bva_execution.log#L13) |
| `BVA-014` | Post Content | Length = 40,000 characters ($Max$) | Accepted | Accepted | **PASS** | [bva_execution.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/bva_execution.log#L16) |
| `BVA-015` | Post Content | Length = 40,001 characters ($Max + 1$) | Rejected | Rejected | **PASS** | [bva_execution.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/bva_execution.log#L17) |
| `BVA-018` | Media Array | Count = 10 attachments ($Max$) | Accepted | Accepted | **PASS** | [bva_execution.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/bva_execution.log#L20) |
| `BVA-019` | Media Array | Count = 11 attachments ($Max + 1$) | Rejected | Rejected | **PASS** | [bva_execution.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/bva_execution.log#L21) |

#### 4. Execution Summary
- **Boundary Assertions Executed**: 32 distinct boundary conditions.
- **Passed**: 32 (100%).
- **Failed**: 0.

#### 5. Defect Summary
Zero boundary defects. TypeBox contracts strictly enforce all numeric and string boundaries.

#### 6. Risk Analysis
Low risk. Boundary analysis confirms schemas reject off-by-one payload attacks before database write operations.

#### 7. Environment Details
Node.js runtime executing `scripts/run_bva_and_negative.ts` using `@sinclair/typebox/value`.

---

### 2.2.6 Negative Testing

#### 1. Objective
To confirm that the application gracefully rejects malicious, malformed, unexpected, or unauthorized inputs without crashing or leaking sensitive stack traces.

#### 2. Scope
Testing SQL/NoSQL injection patterns, cross-origin request forging, invalid JSON types, unauthenticated mutations, and excessive payload sizes.

#### 3. Condition and Output
- **Execution Steps**:
  1. Issue requests with invalid HTTP methods, missing CSRF tokens, and malformed parameters.
  2. Confirm return of standard RFC 7807 error structures (`title`, `status`, `detail`, `code`).

| Test ID | Negative Input Scenario | Expected Error Code | Observed Behavior | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NEG-001` | `POST /api/v1/posts` without session cookie | HTTP 401 Unauthorized | Returned RFC 7807 problem payload | **PASS** | [negative_testing.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/negative_testing.log) |
| `NEG-002` | State mutation with forged `Origin: http://evil.com` | HTTP 403 Forbidden | Cross-origin request rejected | **PASS** | [negative_testing.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/negative_testing.log) |
| `NEG-003` | Vote direction outside enum (e.g. `direction: 2`) | HTTP 400 Bad Request | Schema validation rejected input | **PASS** | [negative_testing.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/negative_testing.log) |
| `NEG-004` | Destination URL with credentials (`http://u:p@evil.com`)| HTTP 400 Bad Request | Semantic URL validator rejected input | **PASS** | [negative_testing.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/negative_testing.log) |
| `NEG-005` | Non-existent route `GET /api/v1/unknown` | HTTP 404 Not Found | Standardized `Resource Not Found` | **PASS** | [negative_testing.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/negative_testing.log) |

#### 4. Execution Summary
- **Negative Scenarios Executed**: 18 test cases.
- **Passed**: 18 (100%).
- **Failed**: 0.

#### 5. Defect Summary
Zero unhandled exceptions. All errors adhere to RFC 7807 problem details specification.

#### 6. Risk Analysis
Low risk. Backend fails closed across all unauthorized or malformed request patterns.

#### 7. Environment Details
Fastify error handling plugins (`@fastify/sensible`) with TypeBox validation.

---

### 2.2.7 Scenario Testing

#### 1. Objective
To simulate realistic, multi-step user scenarios reflecting true operational workflows across multiple integrated features.

#### 2. Scope
Testing end-to-end user lifecycles: onboarding -> feed discovery -> post creation -> social engagement -> searching -> bookmarking.

#### 3. Condition and Output
- **Execution Steps**:
  1. User registers a new profile and verifies authenticated session.
  2. User browses home feed, toggles between Hot and Top tabs.
  3. User authors and publishes a post with tags.
  4. User navigates to post detail, upvotes, and submits a comment.
  5. User searches for engineering discussions and bookmarks a post.

| Scenario Step | User Action | Expected System State | Observed Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| Step 1 | Account Registration | User record in DB; active session cookie | Redirected to `/` with session active | **PASS** |
| Step 2 | Feed Browsing | Sorted posts rendered from database | 500 posts filtered by Top/Hot ranking | **PASS** |
| Step 3 | Post Authoring | Post saved to MongoDB; permalink loaded | Redirected to `/post/post_1795...` | **PASS** |
| Step 4 | Comment & Upvote | Score and comment count incremented | Real-time counter updates in DOM | **PASS** |
| Step 5 | Universal Search | Query returns discussions and users | Matched entities populated | **PASS** |

#### 4. Execution Summary
- **Scenarios Executed**: 5 end-to-end multi-step scenarios.
- **Passed**: 5 (100%).
- **Failed**: 0.

#### 5. Defect Summary
Zero workflow breakdowns observed.

#### 6. Risk Analysis
Low risk. Core user journeys operate cohesively from end to end.

#### 7. Environment Details
Chrome headless driven by Playwright against the local application stack.

---

### 2.2.8 Security Testing

#### 1. Objective
To evaluate system resilience against common web vulnerabilities, brute-force attacks, session hijacking, cross-site scripting (XSS), clickjacking, and CSRF.

#### 2. Scope
Inspection of password hashing parameters, session cookie flags, CSRF tokens, rate limiting counters, and HTTP response security headers across both local and live Render environments.

#### 3. Condition and Output
- **Execution Steps**:
  1. Probe live Render endpoint (`https://socialgraph-feed.onrender.com/api/v1/health`) for Helmet security headers.
  2. Inspect root SPA HTML response (`GET /`) for frame protection and CSP.
  3. Verify bcrypt work factor 12 in `AuthService.ts`.
  4. Test distributed rate limiting via Redis sliding window.

| Test ID | Target / Feature | Expected Security Attribute | Observed Result | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SEC-001` | Password Storage | bcrypt hash with work factor 12 | `$2a$12$...` verified | **PASS** | [security-hardening.test.ts](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/packages/backend/test/security-hardening.test.ts) |
| `SEC-002` | API Security Headers | `Content-Security-Policy`, `X-Frame-Options: DENY` | Present on `/api/v1/*` | **PASS** | [security_execution.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/security_execution.log) |
| `SEC-003` | Login Rate Limiting | 5 attempts / minute per IP | 429 Too Many Requests | **PASS** | [distributed-rate-limit.test.ts](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/packages/backend/test/distributed-rate-limit.test.ts) |
| `SEC-004` | CSRF Defense | Rejection of state mutation without token | 403 Forbidden | **PASS** | [security-hardening.test.ts](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/packages/backend/test/security-hardening.test.ts) |
| `SEC-005` | Root SPA HTML Shell | `Content-Security-Policy` and `X-Frame-Options` on `GET /` | **Missing on static root** | **DEFECT** | [security_execution.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/security_execution.log) |

#### 4. Execution Summary
- **Security Probes Executed**: 5 distinct checks (4 on API/Auth, 1 on SPA root).
- **Passed**: 4.
- **Failed / Defect**: 1 (`SEC-005`).

#### 5. Defect Summary
The production security audit identified SEC-005. The root SPA HTML response does not include the expected security headers, including Content-Security-Policy and X-Frame-Options. This leaves the application without those browser-side protections on that response. The finding should be addressed and verified in a future security update.

#### 6. Risk Analysis
**Moderate Risk**. The absence of `Content-Security-Policy` and `X-Frame-Options` on the root HTML response leaves the browser without standard framing restrictions on that specific document. While Fastify API routes are independently secured via Helmet middleware, the single-origin production server serving the initial HTML shell should be updated in a subsequent security deployment.

#### 7. Environment Details
Live Render Cloud service and local Fastify backend with Redis distributed store.

---

### 2.2.9 Performance Testing (Partial)

#### 1. Objective
To evaluate application response latency, database index query efficiency, and feed delivery overhead under baseline local operations.

#### 2. Scope
Local measurement of `/api/v1/health` latency, database index query execution times, and feed ranking computations.

#### 3. Condition and Output
- **Execution Steps**:
  1. Execute health probe across 100 sequential requests.
  2. Inspect database and Redis latency reported by health check.

| Metric | Measured Value | Benchmark / SLA | Status |
| :--- | :--- | :--- | :--- |
| Health Check API Latency | 3.14 ms | < 50 ms | **PASS** |
| Redis In-Memory Ping Latency | 1.49 ms | < 10 ms | **PASS** |
| MongoDB Query Latency (Local rs0)| 2.41 ms | < 25 ms | **PASS** |

#### 4. Execution Summary
- **Status**: **PARTIALLY PERFORMED**.
- Local baseline latencies verified. Large-scale multi-user concurrency testing was not performed due to infrastructure constraints.

#### 5. Defect Summary
No latency defects observed under local single-client execution.

#### 6. Risk Analysis
System behavior under concurrent multi-user load (> 1,000 req/sec) remains unverified.

#### 7. Environment Details
Local Node.js v22.14 runtime connecting to Docker MongoDB and Redis containers via loopback.

---

### 2.2.10 Compatibility Testing (Partial)

#### 1. Objective
To assess visual rendering, CSS styling, and JavaScript execution across different screen resolutions and browser platforms.

#### 2. Scope
Responsive viewport testing on Google Chrome (Mobile 320px/390px/430px, Tablet 768px, Desktop 1280px/1440px).

#### 3. Condition and Output
- **Execution Steps**:
  1. Configure browser viewport dimensions via Playwright.
  2. Capture layout screenshots at each breakpoint.

| Viewport | Device Target | Layout Behavior | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| 320x568 | Narrow Mobile (iPhone SE) | Single column, navigation bar collapsed | **PASS** | `acceptance_mobile_320_narrow.png` |
| 390x844 | Standard Mobile (iPhone 14) | Single column, sticky bottom navigation | **PASS** | `acceptance_mobile_390_home.png` |
| 768x1024 | Tablet (iPad Mini) | Two-column layout with sidebar | **PASS** | `acceptance_tablet_768_home.png` |
| 1440x900 | Desktop (MacBook/Laptop) | Three-column rail layout | **PASS** | `acceptance_desktop_1440_home.png` |

#### 4. Execution Summary
- **Status**: **PARTIALLY PERFORMED**.
- Verified across 5 viewport breakpoints on Google Chrome. Cross-browser testing on Mozilla Firefox and Apple Safari was not performed.

#### 5. Defect Summary
Zero layout breakage detected across tested viewports.

#### 6. Risk Analysis
Potential rendering differences on Safari (WebKit) or Firefox (Gecko) remain unverified.

#### 7. Environment Details
Playwright Core driving Google Chrome v130 on Windows 11.

---

### 2.2.11 Internationalization & Localization Testing (Partial)

#### 1. Objective
To evaluate the application's ability to handle international character sets (UTF-8, multi-byte emojis, right-to-left scripts) and localized date/time formatting.

#### 2. Scope
Testing Unicode character handling in post titles and comments, and verifying relative date formatting in `packages/frontend/src/utils/date.ts`.

#### 3. Condition and Output
- **Execution Steps**:
  1. Submit posts with multi-byte Unicode strings (Japanese, Arabic, Cyrillic, Emojis).
  2. Verify that MongoDB stores and retrieves characters without corruption.
  3. Verify relative date strings (`"just now"`, `"5m ago"`, `"2h ago"`).

| Scenario | Input Data | Expected Result | Observed Result | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Unicode Storage | `"アーキテクチャ 🚀 (Systems)"` | Retained exactly in DB | Stored & rendered without truncation | **PASS** | [internationalization_testing.log](file:///C:/Users/saram/Projects/SocialGraphandFeed_Testing/testing/execution_logs/internationalization_testing.log) |
| Relative Time Formatter | Timestamp 300 seconds prior | Formatted as `"5m ago"` | Formatted correctly in English | **PASS** | `date.test.ts` |
| Multi-Language Dictionaries | Switch language to Spanish/French | Translated UI strings | Translation files absent | **LIMITATION** | Finding `LOC-005` |

#### 4. Execution Summary
- **Status**: **PARTIALLY PERFORMED**.
- UTF-8 and English date formatting verified. Multi-language dictionary switching is an **unimplemented feature** (Finding `LOC-005`).

#### 5. Defect Summary
No functional defects in existing code. Absence of translation files is a project scope limitation.

#### 6. Risk Analysis
The application is currently restricted to English-language user interfaces.

#### 7. Environment Details
Node.js UTF-8 string encoders and MongoDB UTF-8 collation.

---

### 2.2.12 Scalability Testing (Not Performed)

#### 1. Objective
To evaluate system throughput, database sharding, and Redis cluster failover as user populations scale to millions of concurrent accounts.

#### 2. Scope
Distributed multi-node clustering and horizontal scaling benchmarks.

#### 3. Condition and Output
- **Status**: **NOT PERFORMED**.
- **Execution Steps**: None.

#### 4. Execution Summary
The test was not performed because a distributed multi-node server cluster or cloud Kubernetes environment was not provisioned during this testing phase.

#### 5. Defect Summary
No defects can be confirmed because testing was not conducted.

#### 6. Risk Analysis
The system’s behavior under massive horizontal scaling and cluster rebalancing remains unverified.

#### 7. Environment Details
The local testing environment was limited to a single-host WSL2 Docker deployment.

---

### 2.2.13 Stress Testing (Not Performed)

#### 1. Objective
To determine the application's breaking point, memory leak behavior, and recovery characteristics when subjected to extreme traffic spikes exceeding capacity.

#### 2. Scope
High-volume synthetic traffic generation (> 10,000 requests/second) to induce resource starvation.

#### 3. Condition and Output
- **Status**: **NOT PERFORMED**.
- **Execution Steps**: None.

#### 4. Execution Summary
The test was not performed because high-concurrency traffic generation tools (e.g. distributed k6 or JMeter clusters) were not available in the local offline testing environment.

#### 5. Defect Summary
No defects can be confirmed because testing was not conducted.

#### 6. Risk Analysis
Thresholds for memory saturation, CPU throttling, and database connection pool exhaustion remain unmeasured.

#### 7. Environment Details
Local development machine; load generators were intentionally excluded to prevent resource exhaustion.

---

## 2.3 White Box Testing Techniques

---

### 2.3.1 Unit Testing

#### 1. Objective
To verify that individual functions, utility algorithms, state hooks, and isolated UI components execute correctly in isolation from external dependencies.

#### 2. Scope
Testing frontend React components, custom hooks, client-side routers, mock adapters, and backend date/BSON serialization functions using Vitest in JSDOM and Node runtimes.

#### 3. Condition and Output
- **Execution Steps**:
  1. Execute frontend Vitest suite: `npm run test:frontend`.
  2. Execute backend serialization suite: `npx vitest run test/serialization.test.ts`.
  3. Validate DOM queries, prop mutations, and hook state changes.

| Test Suite / File | Component / Function Tested | Test Count | Result | Execution Time |
| :--- | :--- | :---: | :--- | :--- |
| `packages/frontend/src/test/home_feed.test.tsx` | Home feed cards, tab sorting, empty states | 21 | **21 PASSED** | 151 ms |
| `packages/frontend/src/test/create_post.test.tsx` | Post composer form, validation, character tally | 27 | **27 PASSED** | 327 ms |
| `packages/frontend/src/test/saved_collections.test.tsx` | Bookmarked post collections, filtering | 25 | **25 PASSED** | 136 ms |
| `packages/frontend/src/test/theme_and_discover.test.tsx`| Theme switcher context, palette application | 19 | **19 PASSED** | 197 ms |
| `packages/frontend/src/test/post_detail.test.tsx` | Post permalink rendering, comment tree | 18 | **18 PASSED** | 128 ms |
| `packages/backend/test/serialization.test.ts` | BSON date formatting, object immutability | 6 | **6 PASSED** | 8 ms |

#### 4. Execution Summary
- **Frontend Unit & Component Tests**: 292 passed (292 total).
- **Backend Serialization Tests**: 6 passed (executed and accounted for within the 235 backend integration suite).
- **Distinct Vitest Automated Test Cases**: 527 total (292 frontend unit/component + 235 backend integration).
- **Duration**: ~2.5 seconds total for frontend component tests.
- *Reconciliation Note*: The 6 backend serialization tests are executed as part of the backend suites. To prevent double-counting, they are accounted for within the 235 backend integration count rather than reported as an additive unit total.

#### 5. Defect Summary
Zero unit test failures recorded.

#### 6. Risk Analysis
Passing unit tests verify isolated logic but do not guarantee integrated system stability (which is addressed by the 235 integration tests and 10 E2E tests).

#### 7. Environment Details
Vitest v5.1.1 with JSDOM environment for frontend components and Node.js runtime for backend serialization.

---

### 2.3.2 Statement Coverage

#### 1. Objective
To measure the percentage of executable source code statements invoked during test execution and identify untested code regions.

#### 2. Scope
V8 code coverage instrumentation across all TypeScript source files in `packages/frontend/src`.

#### 3. Condition and Output
- **Execution Steps**:
  1. Execute `npx vitest run --coverage` with `@vitest/coverage-v8`.
  2. Inspect tabular statement coverage summary.

```text
=============================== Coverage summary ===============================
Statements   : 34.00% ( 1292/3800 )
Branches     : 33.65% ( 560/1664 )
Functions    : 24.48% ( 143/584 )
Lines        : 36.16% ( 1245/3443 )
================================================================================
```

| Source Directory | Total Statements | Covered Statements | Statement Coverage % |
| :--- | :---: | :---: | :---: |
| `src/router/` | 157 | 115 | **73.25%** |
| `src/utils/` | 20 | 18 | **90.00%** |
| `src/components/feed/` | 420 | 225 | **53.57%** |
| `src/pages/` | 1,850 | 580 | **31.35%** |
| `src/theme/` | 113 | 35 | **30.97%** |
| **OVERALL FRONTEND** | **3,800** | **1,292** | **34.00%** |

#### 4. Execution Summary
- **Coverage Tool**: V8 native instrumentation.
- **Statement Coverage Measured**: **34.00%** (1,292 of 3,800 statements).

#### 5. Defect Summary
No defects identified. Coverage metrics reflect unit/component tests in JSDOM before browser E2E execution.

#### 6. Risk Analysis
66% of statements are not exercised by fast unit tests alone. Complex interactive pages (`GraphPage.tsx`, `MessagesPage.tsx`) have lower unit coverage and rely on integration and browser testing.

#### 7. Environment Details
`@vitest/coverage-v8` on Node.js v22.14.

---

### 2.3.3 Branch / Decision Coverage

#### 1. Objective
To verify that every decision point (e.g. `if`, `else`, ternary operators, `switch` branches) evaluates to both true and false during execution.

#### 2. Scope
V8 branch instrumentation across conditional logic in frontend components, hooks, and routing handlers.

#### 3. Condition and Output
- **Execution Steps**:
  1. Run coverage suite and extract branch evaluation metrics.
  2. Analyze branch execution paths in conditional logic.

```text
Branches Evaluated: 1,664 total
Branches Covered  : 560 (33.65%)
Branches Missed   : 1,104 (66.35%)
```

#### 4. Execution Summary
- **Branch Coverage Measured**: **33.65%** (560 / 1,664 branches).
- *Correction Note*: Reconciled from an early draft typographical error of 49.20%.

#### 5. Defect Summary
Zero conditional defects detected.

#### 6. Risk Analysis
Untested conditional branches represent potential latent logic anomalies, particularly in complex UI error recovery blocks.

#### 7. Environment Details
V8 coverage analyzer via Vitest.

---

### 2.3.4 Function Coverage

#### 1. Objective
To measure the percentage of declared functions and methods invoked at least once during test execution.

#### 2. Scope
Function invocation metrics across all exported and internal component functions in `packages/frontend/src`.

#### 3. Condition and Output
- **Execution Steps**:
  1. Inspect function call statistics generated by V8 coverage report.

```text
Functions Declared: 584 total
Functions Invoked : 143 (24.48%)
Functions Uncalled: 441 (75.52%)
```

#### 4. Execution Summary
- **Function Coverage Measured**: **24.48%** (143 / 584 functions).

#### 5. Defect Summary
Zero function-level failures recorded.

#### 6. Risk Analysis
Many uncalled functions belong to secondary settings pages (`SettingsProfilePage.tsx`) and experimental graph visualization pages (`GraphPage.tsx`).

#### 7. Environment Details
V8 coverage analyzer via Vitest.

---

### 2.3.5 Path Coverage (Partial)

#### 1. Objective
To ensure that all independent execution paths through a given function or module from entry to exit are tested.

#### 2. Scope
Basis path testing across critical business algorithms: dual-strategy feed selection, idempotency key claims, and password verification.

#### 3. Condition and Output
- **Execution Steps**:
  1. Construct control flow graphs for `FeedService.getFeed()`.
  2. Identify linearly independent basis paths:
     - Path 1: User not found -> Empty feed.
     - Path 2: User has < 500 followers -> FOOW Redis timeline query.
     - Path 3: User follows high-degree creator (> 500 followers) -> Dynamically merge celebrity posts.
     - Path 4: Redis cache miss -> Fallback to MongoDB query.
  3. Execute targeted test cases covering all 4 basis paths.

| Basis Path | Scenario | Observed Result | Status |
| :--- | :--- | :--- | :--- |
| Path 1 | Query feed for non-existent user | Returns empty timeline array | **PASS** |
| Path 2 | Standard user (< 500 followers) | Reads directly from FOOW timeline | **PASS** |
| Path 3 | Celebrity follower threshold | Merges FOOR celebrity posts into timeline | **PASS** |
| Path 4 | Cache barrier expiration | Re-populates timeline from MongoDB | **PASS** |

#### 4. Execution Summary
- **Status**: **PARTIALLY PERFORMED** (100% path coverage achieved across selected critical paths; application-wide path coverage is mathematically infeasible).

#### 5. Defect Summary
Zero path execution defects.

#### 6. Risk Analysis
Complex edge combinations outside the 4 identified basis paths could contain unverified logic.

#### 7. Environment Details
`test/feed-delivery.test.ts` on Vitest with Redis container.

---

### 2.3.6 Condition Coverage

#### 1. Objective
To verify that every sub-condition within compound boolean expressions evaluates independently to true and false.

#### 2. Scope
Evaluation of compound conditionals in security middleware (e.g. cross-origin checks, CSRF validation, and password policy rules).

#### 3. Condition and Output
- **Execution Steps**:
  1. Examine compound conditional in `identity.ts:24-48`:
     `if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && origin && !allowed.includes(origin))`
  2. Construct test cases varying each boolean sub-condition independently:
     - $C_1$: Method is mutation (`POST`/`PUT`/`DELETE`) vs safe (`GET`).
     - $C_2$: `Origin` header is present vs absent.
     - $C_3$: `Origin` is in allowed list vs disallowed.
  3. Verify independent evaluation.

| Test Case | Method ($C_1$) | Origin Present ($C_2$) | Origin Allowed ($C_3$) | Expected | Actual | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `COND-001` | `GET` (False) | True | False | Allowed (200) | Allowed (200) | **PASS** |
| `COND-002` | `POST` (True) | True | True | Allowed (200) | Allowed (200) | **PASS** |
| `COND-003` | `POST` (True) | True | False | Blocked (403) | Blocked (403) | **PASS** |
| `COND-004` | `POST` (True) | False | N/A | Allowed (Same-origin) | Allowed (200) | **PASS** |

#### 4. Execution Summary
- **Conditions Tested**: 12 compound sub-conditions.
- **Passed**: 12 (100%).
- **Failed**: 0.

#### 5. Defect Summary
Zero condition evaluation defects.

#### 6. Risk Analysis
Low risk. Critical security gates evaluate sub-conditions correctly.

#### 7. Environment Details
`packages/backend/test/security-hardening.test.ts`.

---

### 2.3.7 Cyclomatic Complexity Testing

#### 1. Objective
To calculate the cyclomatic complexity ($M = E - N + 2P$) of source code functions, identify overly complex routines, and assess maintainability and defect propensity.

#### 2. Scope
Static AST analysis of all TypeScript source files across backend services and frontend pages.

#### 3. Condition and Output
- **Execution Steps**:
  1. Execute complexity analyzer: `python scripts/analyze_complexity.py`.
  2. Flag functions with cyclomatic complexity $> 15$.

```text
====================== CYCLOMATIC COMPLEXITY AUDIT ======================
Target Threshold: <= 15 (Standard Maintainable Complexity)

Identified High-Complexity Routines:
1. SearchService.search()           Complexity: 28  (High - Multi-entity regex filtering)
2. FeedService.getFeed()            Complexity: 22  (High - Dual-strategy merge logic)
3. useCreatePost.validateForm()     Complexity: 19  (Moderate - Media & content validations)
4. AuthService.login()              Complexity: 14  (Acceptable)
5. FollowService.toggleFollow()     Complexity: 11  (Acceptable)
=========================================================================
```

#### 4. Execution Summary
- **Routines Analyzed**: 184 functions.
- **Routines Exceeding Threshold (> 15)**: 3 functions (`SearchService.search`, `FeedService.getFeed`, `useCreatePost.validateForm`).

#### 5. Defect Summary
High complexity does not constitute a functional defect, but indicates modules requiring thorough integration test coverage.

#### 6. Risk Analysis
`SearchService.search()` ($M = 28$) is the most complex routine in the application, which directly aligns with the occurrence of Finding `BE-INT-002` (fixture search mismatch).

#### 7. Environment Details
Python 3.12 AST analyzer script in `scripts/analyze_complexity.py`.

---

### 2.3.8 Desk Checking & Static Code Inspection

#### 1. Objective
To perform structured, manual peer review of critical code sections to identify race conditions, unhandled promise rejections, memory leaks, and security flaws without execution.

#### 2. Scope
Static inspection of `packages/backend/src/db/transaction.ts`, `production-server.mjs`, and `packages/backend/src/services/FeedService.ts`.

#### 3. Condition and Output
- **Execution Steps**:
  1. Review transaction management in `withTransaction()`:
     ```typescript
     export async function withTransaction<T>(db: Db, client: MongoClient, fn: (session: ClientSession) => Promise<T>): Promise<T> {
       const session = client.startSession();
       try {
         session.startTransaction();
         const result = await fn(session);
         await session.commitTransaction();
         return result;
       } catch (err) {
         await session.abortTransaction();
         throw err;
       } finally {
         await session.endSession();
       }
     }
     ```
  2. Inspect reverse proxy header handling in `production-server.mjs:34-50`.

| Inspection Target | Focus Area | Finding / Assessment | Status |
| :--- | :--- | :--- | :--- |
| `transaction.ts` | Session cleanup in `finally` | Session is always ended (`endSession()`), preventing connection leaks | **VERIFIED CLEAN** |
| `production-server.mjs`| Content-Length header handling | Strips `content-length` before proxy pipe, preventing hanging chunked streams | **VERIFIED CLEAN** |
| `production-server.mjs`| Security response headers | Omits Helmet headers on static HTML shell | **DEFECT CONFIRMED (SEC-005)**|

#### 4. Execution Summary
- **Files Inspected**: 6 critical architectural files.
- **Findings Identified**: 1 defect confirmed (`SEC-005`).

#### 5. Defect Summary
Desk checking confirmed the exact mechanism of Defect `SEC-005` in `production-server.mjs`.

#### 6. Risk Analysis
Manual desk checking is highly effective for concurrency and architecture reviews, but depends on reviewer domain expertise.

#### 7. Environment Details
Manual static analysis in IDE workspace.

---

### 2.3.9 Regression Testing

#### 1. Objective
To ensure that packaging changes, tooling updates, or database reseeding do not introduce regressions into existing functionality.

#### 2. Scope
Re-execution of the monorepo test baseline following local environment configuration and container startup.

#### 3. Condition and Output
- **Execution Steps**:
  1. Run frontend test suite: 292 tests passed.
  2. Run backend integration suite: 232 tests passed.
  3. Compare results against initial baseline commit.

| Test Tier | Baseline Status | Post-Setup Regression Status | Status |
| :--- | :--- | :--- | :--- |
| Frontend Component Suite | 292 Passed | 292 Passed | **NO REGRESSION** |
| Backend Serialization Suite| 6 Passed | 6 Passed | **NO REGRESSION** |
| Foundation Integration Suite| 6 Passed | 6 Passed | **NO REGRESSION** |

#### 4. Execution Summary
- **Regressions Detected**: 0.
- **Stability**: 100% reproducible.

#### 5. Defect Summary
Zero regressions introduced by the packaging descriptors or `.env` configuration.

#### 6. Risk Analysis
Low risk. Unmodified application source code preserves complete functional stability.

#### 7. Environment Details
Local testing workspace on commit `94540883ab99b8862ac995fa9afebc2e9eadaa16`.

---

# PART C — Consolidated Defect & Risk Audit

## 3.1 Defect Classification & Root-Cause Matrix

```
┌───────────┬──────────────────────────────┬──────────┬─────────────────────────────┬───────────────────────────┐
│ ID        │ Description                  │ Severity │ Classification              │ Root Cause                │
├───────────┼──────────────────────────────┼──────────┼─────────────────────────────┼───────────────────────────┤
│ SEC-005   │ Missing CSP & X-Frame-Options│ Medium   │ Genuine Application Defect  │ production-server.mjs     │
│           │ on root SPA HTML (GET /)     │          │                             │ serves static HTML without│
│           │                              │          │                             │ Helmet middleware headers │
├───────────┼──────────────────────────────┼──────────┼─────────────────────────────┼───────────────────────────┤
│ BE-INT-001│ Fastify route test receives  │ Low      │ Test Assumption Mismatch    │ Auth hook runs before     │
│           │ 401 instead of expected 400  │          │                             │ handler; CreatePostSchema │
│           │                              │          │                             │ marks title optional      │
├───────────┼──────────────────────────────┼──────────┼─────────────────────────────┼───────────────────────────┤
│ BE-INT-002│ Search query for "systems"   │ Low      │ Test Fixture Text Mismatch  │ User lucas_t bio in       │
│           │ does not return lucas_t      │          │                             │ seed.ts does not contain  │
│           │                              │          │                             │ the string "systems"      │
├───────────┼──────────────────────────────┼──────────┼─────────────────────────────┼───────────────────────────┤
│ BE-INT-003│ seedDatabase test asserts 20 │ Low      │ Test Fixture Mode Mismatch  │ seedDatabase defaults to  │
│           │ users, received 110 users    │          │                             │ expanded mode (110 users) │
│           │                              │          │                             │ instead of baseline (20)  │
├───────────┼──────────────────────────────┼──────────┼─────────────────────────────┼───────────────────────────┤
│ LOC-005   │ Absence of non-English       │ Info     │ Scope Limitation /          │ Multi-language bundles    │
│           │ translation dictionary files │          │ Unimplemented Feature       │ not in Milestone 1-3 scope│
└───────────┴──────────────────────────────┴──────────┴─────────────────────────────┴───────────────────────────┘
```

---

## 3.2 Analysis of the Three Backend Integration Failures

### 1. `feed-routes.test.ts:155` (BE-INT-001)
- **Observed**: `AssertionError: expected 401 to be 400`.
- **Code Inspection**: In `packages/shared/src/schemas/post.ts:85-86`, `title` is defined as `Type.Optional()`. An empty title passes initial schema parsing. Then, `requireIdentity` on `POST /posts` executes on the unauthenticated test request and throws `HTTP 401 Unauthorized`.
- **Verdict**: Test assumption error. The application correctly rejects unauthenticated requests fail-closed.

### 2. `mongo-integration.test.ts:513` (BE-INT-002)
- **Observed**: `AssertionError: expected undefined to be defined` on `foundUser`.
- **Code Inspection**: In `seed.ts:87-91`, `lucas_t` has bio: `'consensus protocols & distributed tracing • building acoustic guitars in my spare time'`. The word `"systems"` is entirely absent. `SearchService.ts:360` queries `{ $or: [ { username: /systems/i }, { display_name: /systems/i }, { bio: /systems/i } ] }`.
- **Verdict**: Test fixture error. The test asserted that `lucas_t` would match a term not present in his record.

### 3. `mongo-integration.test.ts:720` (BE-INT-003)
- **Observed**: `AssertionError: expected 110 to be 20`.
- **Code Inspection**: In `seed.ts:361`, `isExpanded` defaults to `true` when options are omitted, returning 110 users (`coreUsers` + `extendedPersonas` + `expandedPersonas`). The test expected baseline mode (20 users) without passing `{ mode: 'baseline' }`.
- **Verdict**: Test configuration error. The database correctly seeded all 110 users.

---

## 3.3 Analysis of Production Security Finding SEC-005
- **Finding Assessment**: The production security audit identified SEC-005. The root SPA HTML response does not include the expected security headers, including Content-Security-Policy and X-Frame-Options. This leaves the application without those browser-side protections on that response. The finding should be addressed and verified in a future security update.
- **Evidence**: Inspected live response from `https://socialgraph-feed.onrender.com/` and local `production-server.mjs`:
  ```http
  HTTP/1.1 200 OK
  content-type: text/html; charset=utf-8
  cache-control: no-cache
  ```
- **Recommended Remediation**: In `production-server.mjs`, insert standard security headers before piping `index.html`:
  ```javascript
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:;");
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  ```

---

## 3.4 Residual Risk Assessment & Final Sign-Off
- **Code Freeze Integrity**: Confirmed. Zero application source code modifications.
- **Infrastructure Status**: All 6 Docker containers remain healthy and active.
- **Quality Assurance Summary by Category**:
  - **Backend Integration Tests**: 232 passed, 3 failed (235 total; includes the 6 serialization tests).
  - **Frontend Unit & Component Tests**: 292 passed (292 total).
  - **Distinct Vitest Automated Test Cases**: 527 total (524 passed, 3 failed).
  - **Browser End-to-End Workflows**: 10 reported passed across real Chrome browser sessions.
  - **Live Production Probes**: 4 passed, 1 failed (SEC-005).
  - **Boundary Value Schema Assertions**: 32 passed, reported separately.
- **Core System Stability**: Core data flows, transactions, distributed rate limiting, and browser user journeys operate reliably without unhandled system crashes.
- **Formal Sign-Off**: The SocialGraph & Feed Engineering Platform is verified and approved for academic presentation and technical demonstration.
