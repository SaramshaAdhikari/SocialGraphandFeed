# SocialGraphandFeed System & Testing Architecture

This document formalizes the architectural topology, data flow patterns, feed distribution algorithms, and defect lifecycles of the SocialGraphandFeed platform for the QA verification baseline.

---

## 1. System Runtime & Network Topology

The platform executes across a decoupled three-tier topology consisting of a static asset proxy, a Fastify REST microservice, and a dual-datastore storage layer (MongoDB replica set and Redis in-memory cache).

```mermaid
flowchart TD
    subgraph ClientLayer["Client Layer (Port 3000 / Browser Viewport)"]
        Browser["React 18 SPA (Vite + TypeScript)<br/>TanStack Query + Zustand + TailwindCSS"]
    end

    subgraph ProxyLayer["Node.js Reverse Proxy & Static Host (Port 3000)"]
        ProxyServer["production-server.mjs<br/>Native HTTP Reverse Proxy"]
        StaticAssets["Static Bundle (/assets/*)<br/>packages/frontend/dist"]
    end

    subgraph ServiceLayer["API Microservice Layer (Port 4000)"]
        FastifyCore["Fastify v4 Core Engine<br/>packages/backend/src/app.ts"]
        AuthHook["Session / Cookie Auth PreHandler<br/>@fastify/cookie + @fastify/session"]
        TypeBoxValidator["AJV Schema Validation<br/>@sinclair/typebox Contracts"]
        RouteHandlers["Modular Route Handlers<br/>auth, users, posts, feed, graph, search"]
    end

    subgraph StorageLayer["Data & Cache Tier"]
        RedisCache[("Redis v8.10.1 (Port 6379)<br/>Feed Inboxes, Counters, Graph Cache")]
        MongoReplica[("MongoDB v7.0.14 rs0 (Port 27017)<br/>14 Seeded Collections (ACID Transactions)")]
    end

    Browser -->|"HTTP GET / (HTML/CSS/JS)"| ProxyServer
    ProxyServer -->|"Serve Static Files"| StaticAssets
    Browser -->|"HTTP /api/v1/* Requests"| ProxyServer
    ProxyServer -->|"Loopback Proxy (sub-5ms)"| FastifyCore
    FastifyCore --> AuthHook
    AuthHook --> TypeBoxValidator
    TypeBoxValidator --> RouteHandlers
    RouteHandlers -->|"In-Memory Cache (0.97ms)"| RedisCache
    RouteHandlers -->|"Persistent State (1.95ms)"| MongoReplica
```

---

## 2. Hybrid Feed Generation Pipeline (Meta TAO Pattern)

The feed distribution engine implements a hybrid push/pull fan-out architecture inspired by Meta's TAO social graph architecture. Ingestion behavior forks dynamically based on the author's follower degree.

```mermaid
flowchart TD
    NewPost["User Submits New Post<br/>POST /api/v1/posts"] --> ValidatePayload["Validate TypeBox Contract<br/>Title, Content, Tags, Media"]
    ValidatePayload --> WriteDB["Persist to MongoDB<br/>Insert into 'posts' collection"]
    WriteDB --> CheckDegree{"Author Follower Count > 10,000?<br/>(High-Fanout Celebrity Threshold)"}

    %% Fan-out on Read (Pull)
    CheckDegree -->|"YES (High Fan-Out)"| MarkCelebrity["Set is_celebrity = true<br/>Skip Timeline Push Fanout"]
    MarkCelebrity --> IndexTimeline["Write to Global Public Feed<br/>feed:public Redis Sorted Set"]

    %% Fan-out on Write (Push)
    CheckDegree -->|"NO (Standard User)"| QueryFollowers["Query Follower Graph<br/>MongoDB 'follows' collection"]
    QueryFollowers --> EnqueueFanout["Iterate Follower IDs<br/>ZADD follower_feed:timeline postId timestamp"]
    EnqueueFanout --> CapTimeline["ZREMRANGEBYRANK 800 -1<br/>Cap Follower Timeline at 800 Posts"]

    %% Feed Consumption
    subgraph FeedRetrieval["Feed Read Request (GET /api/v1/feed)"]
        UserReq["User Requests Feed"] --> ReadTimeline["Read Timeline Inbox from Redis<br/>follower_feed:timeline"]
        ReadTimeline --> FetchCelebrity["Query Active Celebrities Followed<br/>Merge Recent Posts On-Demand"]
        FetchCelebrity --> RankAlgorithm["Compute Decay Score:<br/>Score = (Engagements) / (TimeDelta + 2)^1.5"]
        RankAlgorithm --> PaginateFeed["Apply Keyset Pagination<br/>Cursor: (score, post_id)"]
        PaginateFeed --> ReturnFeed["Return JSON Feed Envelope<br/>HTTP 200 OK"]
    end
```

---

## 3. QA Testing Pyramid & Multi-Layer Verification Architecture

The test execution suite spans five discrete verification tiers, ensuring comprehensive verification from static AST code metrics up to live browser workflow automation.

```mermaid
flowchart TD
    subgraph Layer5["Tier 5: End-to-End Browser Automation (Playwright + EdgeCore)"]
        E2E["5 Core User Workflows<br/>Negative Auth, User Registration, Home Feed, Search, Theme Switching"]
    end

    subgraph Layer4["Tier 4: System & Integration Verification"]
        Integration["Fastify Route Integration & Supertest<br/>Auth guards, Keyset pagination, Multi-collection seeding"]
        SecurityTest["Error Guessing & Injection Defense<br/>NoSQL $ne, Prototype pollution, Path traversal, RTL override"]
    end

    subgraph Layer3["Tier 3: Specification & Boundary Verification"]
        BVA["Boundary Value Analysis (32 BVA Cases)<br/>Exact limits (min-1, min, max, max+1) on username, title, bio"]
        EP["Equivalence Partitioning (19 Equivalence Classes)<br/>Valid and invalid equivalence partitions for schemas"]
    end

    subgraph Layer2["Tier 2: Unit Testing (Vitest & Fastify Unit)"]
        FEUnit["Frontend Unit Suites (24 Files, 292 Tests)<br/>TanStack Query hooks, React components, Zustand state, Formatters"]
        BEUnit["Backend Unit Serialization (6 Tests)<br/>Post, User, Comment JSON envelopes & cursor serializers"]
    end

    subgraph Layer1["Tier 1: Static Code Quality & Metrics"]
        AST["Python AST Cyclomatic Complexity Analysis (184 Functions)<br/>McCabe complexity thresholds (CC <= 10)"]
        TypeCheck["TypeScript Strict Mode Compiler (tsc --noEmit)<br/>Zero type errors across packages/shared, frontend, backend"]
    end

    Layer1 --> Layer2
    Layer2 --> Layer3
    Layer3 --> Layer4
    Layer4 --> Layer5
```

---

## 4. Defect Reconciliation & Resolution Lifecycle

The formal defect tracking lifecycle used during the QA verification audit ensures that test discrepancies are categorized accurately between genuine code bugs, environment configuration artifacts, and test fixture assumptions.

```mermaid
stateDiagram-v2
    [*] --> Discovered: Execution of Test Suite / Manual Audit
    Discovered --> Triaged: Evaluate Against Technical Specification

    state Triaged {
        direction LR
        CodeDefect: Genuine Application Defect
        FixtureMismatch: Test Fixture Mismatch
        EnvArtifact: Environment Assumption
    }

    CodeDefect --> RootCauseAnalysis: SEC-005 (Missing CSP / Security Headers)
    FixtureMismatch --> RootCauseAnalysis: BE-INT-001, BE-INT-002, BE-INT-003
    EnvArtifact --> RootCauseAnalysis: Docker/WSL2 host absence

    RootCauseAnalysis --> DocumentedRemediation: Record File, Line, and Exact Patch
    DocumentedRemediation --> VerifiedUnderControlledTest: Validate with Test Execution Evidence
    VerifiedUnderControlledTest --> [*]: Cataloged in Defect Register
```
