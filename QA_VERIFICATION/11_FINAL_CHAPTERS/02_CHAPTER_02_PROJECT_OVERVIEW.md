# Chapter 2 — Project Overview

## 2.1 Project Description and Operational Context

The system under evaluation is **DMND** (`SocialGraphandFeed`), a high-performance social networking engine and scalable feed distribution platform designed to manage high-volume social graph mutations, asynchronous timeline generation, and real-time interaction. The application is built using modern full-stack TypeScript technologies and is engineered to address the inherent tensions between write-heavy social graph updates (following users, creating posts, reacting to content) and read-heavy timeline requests (loading personalized, ranked home feeds with sub-100 millisecond response latencies).

DMND provides a comprehensive suite of social capabilities:
- User onboarding, session-based authentication, and profile customization.
- Algorithmic feed generation with multiple sorting strategies (`top`, `new`, and `hot`).
- Media-rich post creation supporting Markdown text, image attachments, destination URLs, and categorized tags.
- Threaded, hierarchical comment discussions with nested reply trees.
- Interactive force-directed 2D social graph clustering and neighborhood exploration.
- Topical community hubs governed by moderation rules and member rosters.
- Full-text universal search across posts, user handles, and hashtag metadata.
- Real-time interaction tracking including upvoting, personal bookmarking, and direct messaging.
- Operational telemetry dashboards providing real-time database latency and cache metrics.

In its operational deployment, DMND operates as a decoupled client-server platform where client state management and visual rendering are handled by a React 18 Single Page Application (SPA), while business logic, schema validation, transaction management, and datastore interactions are executed by a Node.js Fastify REST microservice backed by MongoDB and Redis.

---

## 2.2 System Runtime and Network Topology

DMND executes across a decoupled three-tier runtime environment designed for horizontal scalability, data consistency, and low-latency client communication. The production architecture integrates a static reverse proxy, an asynchronous API service, and a hybrid datastore tier.

```
Figure 2.1: System Runtime and Network Topology Architecture Diagram

+---------------------------------------------------------------------------------+
|                       Client Layer (Port 3000 / Browser)                        |
|                                                                                 |
|       React 18 SPA (Vite + TypeScript)                                          |
|       TanStack Query v5 + Zustand Stores + TailwindCSS                          |
+---------------------------------------------------------------------------------+
                                      |
                                      | HTTP GET / & /api/v1/*
                                      v
+---------------------------------------------------------------------------------+
|               Reverse Proxy & Static Asset Host (Port 3000)                     |
|                                                                                 |
|       production-server.mjs (Native Node.js HTTP Proxy)                         |
|       - Serves static bundle from packages/frontend/dist                        |
|       - Proxies /api/ and /uploads/ to Fastify backend (Port 4000)              |
+---------------------------------------------------------------------------------+
                                      |
                                      | Local Loopback Proxy (sub-2ms)
                                      v
+---------------------------------------------------------------------------------+
|                   API Microservice Engine (Port 4000)                           |
|                                                                                 |
|       Fastify v4 Core Engine (packages/backend/src/app.ts)                      |
|       - Session & Cookie PreHandler Hook (@fastify/cookie, @fastify/session)    |
|       - AJV Schema Validation Compiler (@sinclair/typebox Contracts)            |
|       - 15 Modular Subsystem Route Handlers                                     |
+---------------------------------------------------------------------------------+
                         |                                 |
     Redis Protocol      |                                 | MongoDB Wire Protocol
     (Port 6379)         v                                 v (Port 27017)
+---------------------------------+     +-----------------------------------------+
|     In-Memory Cache & Counters   |     |    Document Datastore Tier              |
|                                 |     |                                         |
|  Redis v8.10.1 (Windows Native) |     |  MongoDB v7.0.14 Single-Node Replica Set|
|  - Sliding-Window Rate Limiter  |     |  Replica Set: rs0                       |
|  - Session Token Storage        |     |  - 14 Seeded Collections                |
|  - Timeline Inboxes             |     |  - Multi-Document ACID Transactions     |
+---------------------------------+     +-----------------------------------------+
```

### Operational Tier Responsibilities:
1. **Client Presentation Tier (Port 3000):** Delivered as a compiled static bundle from `packages/frontend/dist`. It utilizes TanStack Query for client-side query caching, optimistic UI updates, and stale-while-revalidate background synchronization, minimizing redundant network requests.
2. **Reverse Proxy Layer (Port 3000):** Implemented in `production-server.mjs`. This native Node.js HTTP server unifies the deployment origin, serving pre-compressed static assets (`HTML`, `CSS`, `JS`, images) for frontend routes while transparently proxying `/api/v1/*` and `/uploads/*` requests to the Fastify microservice on port 4000.
3. **API Microservice Tier (Port 4000):** Implemented in Fastify v4 (`packages/backend/src/app.ts`). Fastify's architecture provides schema-driven execution, compiling `@sinclair/typebox` validation contracts into highly optimized AJV validation functions. Incoming HTTP requests pass through session decryption pre-handlers before routing to modular controllers.
4. **Data and In-Memory Tier (Ports 27017 and 6379):**
   - **MongoDB Replica Set (`rs0`):** Persistent document storage. Running as a single-node replica set is mandatory to unlock MongoDB multi-document ACID transactions (`session.withTransaction()`), enabling atomic mutations across posts, votes, and user counters.
   - **Redis Cache:** Provides sub-millisecond in-memory caching, sliding-window rate-limiting counters, and sorted sets (`ZSET`) for pre-computed user feed timelines.

---

## 2.3 Detailed Architecture of the 15 Application Modules

DMND is decomposed into 15 cohesive modules, spanning frontend presentation, shared contracts, service engines, and data management.

### Module 1: Feed Service
- **Source File:** `packages/backend/src/services/FeedService.ts`
- **Responsibilities:** Manages the algorithmic delivery of personalized user timelines and public feeds. Implements the Meta TAO hybrid fan-out engine, balancing fan-out-on-write against fan-out-on-read. Executes complex aggregation pipelines to rank posts by engagement decay, chronological creation, or momentum scoring.

### Module 2: Authentication Controller
- **Source File:** `packages/backend/src/routes/auth.routes.ts` & `packages/backend/src/services/AuthService.ts`
- **Responsibilities:** Handles user registration, credential authentication, session lifecycle management, and logout. Utilizes `bcryptjs` with work factor 12, implements constant-time verification dummy computations to prevent user enumeration, and enforces session fixation invalidation.

### Module 3: Post & Media Contract
- **Source File:** `packages/shared/src/schemas/post.ts` & `packages/shared/src/schemas/media.ts`
- **Responsibilities:** Defines the formal runtime and compile-time data validation boundaries for post creation and editing using `@sinclair/typebox`. Enforces string limits (title: 0–300 chars, content: 0–40,000 chars), validates URI formats, bounds media array lengths (max 10 attachments), and restricts tag collections (max 20 tags).

### Module 4: Social Graph Engine
- **Source File:** `packages/backend/src/routes/graph.routes.ts` & `packages/backend/src/services/GraphService.ts`
- **Responsibilities:** Manages social connections between users. Handles following and unfollowing operations, queries directed adjacency lists, calculates 1-hop and 2-hop graph neighborhoods, and supplies node-link adjacency payloads to the frontend visualizer.

### Module 5: User Profile & Identity Subsystem
- **Source File:** `packages/backend/src/routes/user.routes.ts` & `packages/backend/src/services/UserService.ts`
- **Responsibilities:** Manages user account profiles, biographical text, avatar URLs, header banners, and user-specific preferences. Maintains denormalized follower and following counters, updating them atomically within multi-document transactions.

### Module 6: Comment Engine
- **Source File:** `packages/backend/src/routes/comment.routes.ts` & `packages/backend/src/services/CommentService.ts`
- **Responsibilities:** Powers hierarchical, threaded discussions attached to posts. Implements adjacency list pointers (`parent_comment_id`), calculates nested depth levels, supports comment voting, and manages recursive comment deletion.

### Module 7: Full-Text Universal Search Engine
- **Source File:** `packages/backend/src/routes/search.routes.ts`
- **Responsibilities:** Executes cross-entity searches across post titles, markdown content, user handles, and hashtag metadata. Sanitizes search queries to prevent Regular Expression Denial of Service (ReDoS) and leverages case-insensitive MongoDB regex indexes with UTF-8 collation.

### Module 8: Communities Directory & Hubs
- **Source File:** `packages/backend/src/routes/community.routes.ts` & `packages/backend/src/services/CommunityService.ts`
- **Responsibilities:** Governs topical discussion communities (such as Distributed Systems, TypeScript, Web Performance). Manages community registration, rule enforcement, moderator assignments, membership rosters, and community-scoped feed filtering.

### Module 9: Direct Messaging System
- **Source File:** `packages/backend/src/routes/messages.routes.ts`
- **Responsibilities:** Provides peer-to-peer private communication between authenticated users. Manages one-on-one conversation threads, message delivery, timestamp ordering, and unread message counters.

### Module 10: Notifications Center
- **Source File:** `packages/backend/src/routes/notification.routes.ts` & `packages/backend/src/services/NotificationService.ts`
- **Responsibilities:** Captures and dispatches asynchronous interaction events. Generates notifications when a user's post is upvoted, when their content receives a comment reply, or when another user follows them. Provides batch mark-as-read operations.

### Module 11: Saved Collections & Bookmarks
- **Source File:** `packages/backend/src/routes/saved.routes.ts`
- **Responsibilities:** Enables users to bookmark posts into personal collections. Manages the `post_saves` collection, providing filtered retrieval of saved content and ensuring transactional synchronization between user save records and post save counters.

### Module 12: System Diagnostics Subsystem
- **Source File:** `packages/backend/src/routes/diagnostics.routes.ts`
- **Responsibilities:** Exposes operational health telemetry for monitoring and verification. Reports MongoDB ping latency, Redis connection health, active process memory consumption (heap used, RSS), node uptime, and cache hit ratios.

### Module 13: Frontend Query & Cache State Management
- **Source File:** `packages/frontend/src/hooks/useFeed.ts` & `packages/frontend/src/hooks/useAuth.ts`
- **Responsibilities:** Encapsulates TanStack Query state hooks and Zustand stores. Manages optimistic updates for post upvoting and bookmarking, handles token synchronization across browser tabs, and controls background cache invalidation.

### Module 14: Interactive Force-Directed Graph Visualizer
- **Source File:** `packages/frontend/src/pages/GraphPage.tsx`
- **Responsibilities:** Implements an interactive 2D HTML5 canvas visualizer that simulates cluster physics for user follow graphs. Computes node repulsion and edge attraction forces, visualizes follow clusters, and allows interactive panning, zooming, and node selection.

### Module 15: Reverse Proxy & Static Asset Server
- **Source File:** `production-server.mjs`
- **Responsibilities:** Serves as the single-origin ingress gateway. Hosts frontend static assets from `packages/frontend/dist`, handles client-side SPA routing fallback to `index.html`, and proxies API requests to the Fastify microservice.

---

## 2.4 Technology Stack Specifications

DMND is implemented entirely in TypeScript, leveraging modern frameworks and toolchains across all tiers.

```
Table 2.1: Core DMND Technology Stack Specifications

Tier / Category      Technology / Package         Version       Architectural Responsibility
------------------   --------------------------   -----------   -------------------------------------------------
Client Framework     React                        v18.3.1       Component-based reactive UI rendering
Frontend Tooling     Vite                         v5.4.2        Fast HMR bundler and build compilation pipeline
State & Cache        TanStack Query (React Query) v5.56.2       Asynchronous server state caching and optimistic updates
Client State         Zustand                      v4.5.5        Lightweight in-memory client state store
Styling Engine       Tailwind CSS                 v3.4.10       Utility-first responsive design framework
Iconography          Lucide React                 v0.441.0      Accessible SVG vector icons
Backend Runtime      Node.js                      v26.7.0       V8-powered asynchronous JavaScript runtime
Web Microservice     Fastify                      v4.28.1       High-throughput RESTful routing and hook architecture
Schema Validation    @sinclair/typebox            v0.32.34      Type-safe JSON Schema builder for runtime validation
Validation Engine    AJV (via Fastify)            v8.17.1       High-speed compiled JSON schema validation
Session Management   @fastify/session             v10.9.0       Cryptographically signed cookie session middleware
Cookie Management    @fastify/cookie              v9.3.1        HTTP cookie parsing and serialization
Security Encryption  bcryptjs                     v2.4.3        Password hashing with work factor 12
Persistent Datastore MongoDB Server               v7.0.14       NoSQL document store with replica set transactions (rs0)
Database Driver      mongodb (Node.js SDK)        v6.8.0        Official asynchronous MongoDB native driver
In-Memory Cache      Redis Server                 v8.10.1       In-memory key-value cache and Lua script runner
Redis Client         ioredis                      v5.4.1        Full-featured Redis client supporting clusters and Lua
Testing Harness      Vitest                       v2.1.8        Next-generation unit and component test runner
Browser Automation   Playwright Core              v1.49.0       Headless browser engine for end-to-end testing
Static Code Analysis Python Standard Library ast  v3.12.0       Abstract syntax tree parser for cyclomatic complexity
```

---

## 2.5 Hybrid Feed Delivery Engine (Meta TAO Pattern)

The core algorithmic component of DMND is its feed delivery engine (`FeedService.ts`). Inspired by Meta's TAO (The Associations and Objects) graph architecture, the system balances two competing distribution paradigms:

1. **Fan-Out-on-Write (Push Model):** When an author publishes a post, the post ID is immediately injected into the pre-computed timeline inboxes of all their active followers. This provides $O(1)$ read complexity during feed fetching, as a user simply reads their pre-sorted timeline inbox.
2. **Fan-Out-on-Read (Pull Model):** When a user requests their feed, the system dynamically queries the posts published by all followed accounts, merges the result sets, and computes algorithmic rankings. This eliminates write amplification during post publishing.

```
Figure 2.2: Hybrid Feed Generation Pipeline (Meta TAO Fan-Out Architecture)

User Publishes Post (POST /api/v1/posts)
                   |
                   v
Validate TypeBox Schema Contract (Title, Content, Tags, Media)
                   |
                   v
Persist Post Document to MongoDB 'posts' Collection
                   |
                   v
Check Author Follower Degree
                   |
       +-----------+-----------+
       |                       |
Author Followers <= 10,000   Author Followers > 10,000 (High-Fanout Celebrity)
       |                               |
       v                               v
[ Fan-Out-on-Write ]           [ Fan-Out-on-Read ]
Push Post ID into Redis         Skip Timeline Push Inboxes;
Timeline Inboxes of Followers   Write to Global Public Index (feed:public)
       |                               |
       +-----------+-----------+       |
                   |                   |
                   v                   v
           User Requests Home Feed (GET /api/v1/feed)
                   |
                   v
      Merge Follower Inboxes with Celebrity Pull Aggregation
                   |
                   v
      Apply Mathematical Time-Decay Engagement Ranking:
      Score = Engagement / (Delta_t + 2)^1.5
                   |
                   v
      Return Paginated RFC 7807 JSON Response with Cursor
```

To prevent write-amplification thrashing, the system enforces a strict cutoff threshold: authors with $\le 10,000$ followers utilize fan-out-on-write, while authors exceeding 10,000 followers are designated high-fanout celebrity accounts whose posts are aggregated dynamically on read.

The production implementation of this strategy in `FeedService.ts` represents the most structurally complex algorithm in the application ($M = 11$, audited in Chapter 5.24).

```typescript
// packages/backend/src/services/FeedService.ts (Lines 26–55)
public async getFeed(query: FeedQuery = {}, currentUserId?: string): Promise<FeedResponse> {
  const start = performance.now();
  const sort = query.sort || 'hot';
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
  const scope = query.scope || 'all';

  const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
  const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);
  const followsCol = this.db.collection<FollowDoc>(COLLECTIONS.FOLLOWS);

  // 1. Check for Fan-Out-on-Write timeline strategy
  if (query.strategy === 'fanout_write' && scope === 'following') {
    if (!currentUserId) {
      return {
        success: true,
        data: [],
        next_cursor: null,
        has_more: false,
        meta: { count: 0, server_execution_time_ms: Number((performance.now() - start).toFixed(2)) }
      };
    }
    const follows = await followsCol.find({ follower_id: currentUserId }).toArray();
    const targetUserIds = follows.map((f) => f.target_user_id);
    // Reads timeline pre-computed in user's feed inbox...
```

---

## 2.6 Multi-Document Database Transactions

In relational databases, atomic state transitions across multiple entities are guaranteed through standard SQL transactions. In document datastores like MongoDB, transactions require an active replica set (`rs0`) and explicit session management.

In DMND, operations such as post upvoting, bookmarking, and following involve mutations across multiple collections. For example, when a user follows another user:
1. A new document must be inserted into the `follows` collection (`follower_id`, `target_user_id`, `created_at`).
2. The `following_count` counter of the actor must be incremented in the `users` collection.
3. The `followers_count` counter of the target user must be incremented in the `users` collection.

If an unhandled exception or network partition occurs between steps 1 and 2, the database state would become permanently corrupted. To prevent this, DMND implements a centralized transaction wrapper in `packages/backend/src/db/transaction.ts`. Crucially, this wrapper addresses a notorious race condition in document databases: concurrent toggle requests can trigger transient duplicate key errors (`E11000`) before MongoDB's internal transaction coordinator resolves the conflict.

```typescript
// packages/backend/src/db/transaction.ts (Lines 5–25)
export async function runInTransaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
  const client = getMongoClient();
  if (!client) throw new Error('MongoDB must be connected before starting a transaction.');

  // A concurrent insert may surface as E11000 rather than TransientTransactionError.
  // Retry the whole state transition so a toggle observes the committed state.
  for (let attempt = 0; ; attempt += 1) {
    const session = client.startSession();
    try {
      let result!: T;
      await session.withTransaction(async () => {
        result = await work(session);
      });
      return result;
    } catch (error: any) {
      if (error?.code !== 11000 || attempt >= 2) throw error;
    } finally {
      await session.endSession();
    }
  }
}
```

The `runInTransaction` function wraps `session.withTransaction()` in an explicit retry loop (allowing up to two attempts), ensuring that transient `E11000` errors resulting from concurrent toggle clicks recover gracefully without throwing unhandled 500 Internal Server Errors.

---

## 2.7 Functional Requirements Baseline

The testing harnesses detailed in Chapters 4 and 5 were designed to validate the system against twelve core functional requirements derived from the product baseline:

```
Table 2.2: Functional Requirements Baseline Matrix (FR-01 to FR-12)

Req ID   Requirement Description                            Target Subsystem / Module        Verification Method
------   -------------------------------------------------  -------------------------------  -----------------------------
FR-01    User Registration & Password Hashing with Bcrypt   Auth Module (auth.routes.ts)     Unit, BVA, Security (5.25, 5.4, 5.42)
FR-02    Session Authentication & Anti-Timing Defense       Auth Module (AuthService.ts)     Basis Path, Error Guessing (5.20, 5.14)
FR-03    Algorithmic Feed Sorting (Top, New, Hot)           Feed Service (FeedService.ts)    Functional, Cause-Effect (5.18, 5.10)
FR-04    Post Creation & TypeBox Boundary Enforcement       Post Module (schemas/post.ts)    BVA, Equivalence Partition (5.4, 5.3)
FR-05    Threaded Commenting with Nested Reply Pointers     Comment Module (comment.ts)      Integration, Functional (5.26, 5.18)
FR-06    Directed Follow Relationships & Adjacency Graph    Graph Service (graph.routes.ts)  System, Exploratory (5.27, 5.7)
FR-07    Topical Community Hub Scoping & Rules Governance   Community Module (community.ts)  Scenario Testing (5.29)
FR-08    Universal Full-Text Search with ReDoS Sanitization Search Module (search.routes.ts) Random Monkey, Compatibility (5.8, 5.40)
FR-09    Personal Collections Bookmarking with Counters     Saved Module (saved.routes.ts)   ACID Transaction Audit (5.15, 5.26)
FR-10    Direct Messaging Thread Separation                 Messages Module (messages.ts)    Integration, Functional (5.26, 5.18)
FR-11    Operational Telemetry & Datastore Latency Metrics  Diagnostics (diagnostics.ts)     Non-Functional, Perf (5.1, 5.35)
FR-12    Responsive Viewport Adaptation across Breakpoints  Presentation Tier (TailwindCSS)  Compatibility Testing (5.11)
```
