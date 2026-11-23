# SocialGraph — Comprehensive Application & Functional Module Inventory

**Date of Audit:** November 23, 2026  
**Repository Baseline:** `https://github.com/SaramshaAdhikari/SocialGraphandFeed` (Commit `94540883ab99b8862ac995fa9afebc2e9eadaa16`)  
**Auditor:** Software Testing & Quality Assurance Agent  
**Status:** Formally Verified & Ready for Test Execution  

---

## 1. Architectural Overview & Boundaries

SocialGraph is an engineering platform inspired by Meta TAO and Pinterest, structured as a clean TypeScript monorepo with three primary packages:
1. **`@socialgraph/shared`**: Schema contracts, TypeBox validation primitives, RFC 7807 error models, and shared domain types.
2. **`@socialgraph/backend`**: Fastify REST API, MongoDB document store, Redis caching/rate-limiting tier, Server-Sent Events (SSE) bus, and storage abstraction.
3. **`@socialgraph/frontend`**: React 19 single-page application, Vite build pipeline, Tailwind CSS 4 styling, interactive Canvas-based Social Graph, and dual API adapters (`LiveClient` and `MockAdapter`).

Below is the complete inventory of all fifteen (15) functional modules comprising the application.

---

## 2. Module Inventory

### Module 1: Authentication & Identity Management (`AuthModule`)
- **Module Identifier:** `MOD-001`
- **Purpose:** User onboarding, authentication, session lifecycle, credential hashing, and identity verification.
- **Main Functionality:**
  - User registration with unique constraint validation.
  - Password hashing and verification using `bcryptjs` (salt rounds: 10).
  - Cookie-based session issuance and verification.
  - Current authenticated user resolution (`GET /api/v1/auth/me`).
  - Secure session destruction (logout).
  - Admin identity bootstrapping script.
- **Inputs:** `RegisterInput` (username, email, password, display_name), `LoginInput` (username/email, password), session cookies.
- **Outputs:** `UserSummary` object, HTTP-only cookie headers (`Set-Cookie`), RFC 7807 error responses on failure.
- **Dependencies:** `@fastify/sensible`, `bcryptjs`, `users` MongoDB collection, `RateLimitService`.
- **API Endpoints:**
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
- **Database Interactions:** `users` collection (CRUD, unique indexes on `username` and `email`).
- **Testability & Boundaries:** Can be tested independently at the unit level (password hashing, schema validation) and at the integration level (registration flow, rate limiting).

---

### Module 2: User Profiles & Social Graph Relationships (`SocialGraphModule`)
- **Module Identifier:** `MOD-002`
- **Purpose:** Profile management and directed social graph topology (follower/following network, neighborhood inspection).
- **Main Functionality:**
  - User profile resolution with authoritative follower and following counts.
  - Profile metadata updating (display name, bio, avatar).
  - Directed follow and unfollow relationship mutation.
  - Follower and following list retrieval with cursor pagination.
  - K-hop graph neighborhood calculation for interactive visualization.
- **Inputs:** User IDs, usernames, profile update payloads, neighborhood query parameters (`depth`, `limit`).
- **Outputs:** `UserProfile`, `UserSummary[]`, `FollowResult`, `GraphNeighborhood` (nodes, links, relationship matrix).
- **Dependencies:** `users` collection, `follows` collection, `EventBus` (realtime event dispatch), Redis cache.
- **API Endpoints:**
  - `GET /api/v1/users/:username`
  - `PATCH /api/v1/users/me`
  - `POST /api/v1/users/:id/follow`
  - `DELETE /api/v1/users/:id/follow`
  - `GET /api/v1/users/:id/followers`
  - `GET /api/v1/users/:id/following`
  - `GET /api/v1/graph/neighborhood`
- **Database Interactions:** `users` collection, `follows` collection (compound unique index `{ follower_id: 1, target_id: 1 }`).
- **Testability & Boundaries:** Graph traversal and count aggregation can be tested independently via database fixtures or mock adapters.

---

### Module 3: Content Authoring & Discussion Posts (`PostModule`)
- **Module Identifier:** `MOD-003`
- **Purpose:** Multi-modal post creation, publishing validation, retrieval, reactions, and lifecycle management.
- **Main Functionality:**
  - Publishing posts across distinct formats: short text status, markdown discussions, visual albums with multi-image arrays, and link cards.
  - Tag extraction and community association.
  - Idempotency key handling to prevent duplicate submissions on network retries.
  - Post retrieval by unique ID.
  - Atomic like/unlike counter updates.
  - Cascading deletion of posts and associated comments.
- **Inputs:** `CreatePostInput` (title, content, type, community_id, tags, media_urls, flair), `Idempotency-Key` header.
- **Outputs:** `Post` entity, reaction status (`has_liked`, `likes_count`), deletion confirmation.
- **Dependencies:** `posts` collection, `post_likes` collection, `idempotency_keys` collection, `IdempotencyService`, `FeedService`.
- **API Endpoints:**
  - `POST /api/v1/posts`
  - `GET /api/v1/posts/:id`
  - `DELETE /api/v1/posts/:id`
  - `POST /api/v1/posts/:id/like`
  - `DELETE /api/v1/posts/:id/like`
  - `GET /api/v1/users/:id/posts`
- **Database Interactions:** `posts` collection, `post_likes` collection, `idempotency_keys` collection.
- **Testability & Boundaries:** Fully testable via automated unit tests (schema validation, post serialization) and integration suites (`posts-publishing.test.ts`).

---

### Module 4: Comments & Hierarchical Threading (`CommentModule`)
- **Module Identifier:** `MOD-004`
- **Purpose:** Granular discussion threads with nested replies and like reactions.
- **Main Functionality:**
  - Creation of top-level comments and nested replies (`parent_id`).
  - Thread retrieval with cursor-based pagination.
  - Comment like/unlike reaction handling.
  - Author-controlled comment deletion.
  - Atomic synchronization of `comments_count` on parent post.
- **Inputs:** Post ID, `CreateCommentInput` (content, optional parent_id), comment ID.
- **Outputs:** Threaded comments, `Comment` objects, reaction status.
- **Dependencies:** `comments` collection, `comment_likes` collection, `posts` collection, `NotificationService`.
- **API Endpoints:**
  - `GET /api/v1/posts/:id/comments`
  - `POST /api/v1/posts/:id/comments`
  - `DELETE /api/v1/comments/:id`
  - `POST /api/v1/comments/:id/like`
  - `DELETE /api/v1/comments/:id/like`
- **Database Interactions:** `comments` collection (indexed by `post_id`, `created_at`), `comment_likes` collection.
- **Testability & Boundaries:** Threading logic and tree reconstruction can be tested purely in memory or via database integration.

---

### Module 5: Communities & Topic Hubs (`CommunityModule`)
- **Module Identifier:** `MOD-005`
- **Purpose:** Topic-based groups, member management, and community-scoped content distribution.
- **Main Functionality:**
  - Community directory listing with member counts and rules.
  - Community discovery by URL slug.
  - Joining and leaving communities with atomic member count updates.
  - Community-specific post feed filtering.
- **Inputs:** Community slug or ID, user join/leave requests.
- **Outputs:** `Community` details, `is_member` status, membership statistics.
- **Dependencies:** `communities` collection, `community_members` collection, `posts` collection.
- **API Endpoints:**
  - `GET /api/v1/communities`
  - `GET /api/v1/communities/:slug`
  - `POST /api/v1/communities/:id/join`
  - `DELETE /api/v1/communities/:id/join`
  - `GET /api/v1/communities/:slug/posts`
- **Database Interactions:** `communities` collection, `community_members` collection (compound unique index `{ community_id: 1, user_id: 1 }`).
- **Testability & Boundaries:** Independent read endpoints can be verified against live deployment or local test fixtures.

---

### Module 6: Feed Generation & Delivery Engine (`FeedModule`)
- **Module Identifier:** `MOD-006`
- **Purpose:** Personalized timeline aggregation and fan-out delivery inspired by Meta TAO and Pinterest.
- **Main Functionality:**
  - Home feed synthesis aggregating posts from followed users and joined communities.
  - Discover/Explore feed synthesis combining recency, engagement, and trending topics.
  - Cursor-based pagination (`cursor`, `limit`).
  - Redis-backed feed caching and cache invalidation.
- **Inputs:** Feed type (`home`, `discover`), cursor parameters, user authentication context.
- **Outputs:** Paginated `FeedResponse` (posts array, `next_cursor`, `has_more`).
- **Dependencies:** `posts`, `follows`, `community_members` collections, `Redis` cache service.
- **API Endpoints:**
  - `GET /api/v1/feed`
  - `GET /api/v1/feed/discover`
- **Database Interactions:** Compound indexed queries on `posts` (`{ author_id: 1, created_at: -1 }`), Redis key-value store (`feed:{userId}`).
- **Testability & Boundaries:** Fully covered by benchmark test suites (`benchmark-feed-delivery.ts`, `feed-delivery.test.ts`, `feed-routes.test.ts`).

---

### Module 7: Direct Messaging & Conversations (`MessagingModule`)
- **Module Identifier:** `MOD-007`
- **Purpose:** Private 1-on-1 messaging, thread management, and real-time message delivery.
- **Main Functionality:**
  - Establishing direct conversation threads between two distinct users.
  - Sending direct text messages.
  - Listing active user conversations with unread indicators and last message preview.
  - Cursor-based message history retrieval.
  - Real-time SSE dispatching scoped to conversation participants.
- **Inputs:** Recipient user ID, message content string, conversation ID, pagination tokens.
- **Outputs:** `Conversation` summaries, `Message` items, read receipts.
- **Dependencies:** `conversations` collection, `messages` collection, `EventBus` (realtime dispatch).
- **API Endpoints:**
  - `GET /api/v1/conversations`
  - `POST /api/v1/conversations`
  - `GET /api/v1/conversations/:id/messages`
  - `POST /api/v1/conversations/:id/messages`
- **Database Interactions:** `conversations` collection, `messages` collection (indexed by `{ conversation_id: 1, created_at: -1 }`).
- **Testability & Boundaries:** Message creation, participant permission checks, and unread counters can be tested via unit and integration tests.

---

### Module 8: Notifications & Activity Stream (`NotificationModule`)
- **Module Identifier:** `MOD-008`
- **Purpose:** User notifications for social interactions (likes, comments, follows, messages).
- **Main Functionality:**
  - Asynchronous notification creation upon trigger events.
  - Listing notifications with unread counts.
  - Marking individual notifications as read.
  - Bulk "mark all as read" capability.
- **Inputs:** User ID, notification ID, mark-read requests.
- **Outputs:** `Notification` stream, `unread_count`.
- **Dependencies:** `notifications` collection, `EventBus`.
- **API Endpoints:**
  - `GET /api/v1/notifications`
  - `PATCH /api/v1/notifications/:id/read`
  - `POST /api/v1/notifications/mark-all-read`
- **Database Interactions:** `notifications` collection (`{ user_id: 1, created_at: -1 }`, `{ user_id: 1, is_read: 1 }`).
- **Testability & Boundaries:** Testable via unit tests (`notifications.test.tsx` frontend and `notifications.test.ts` backend).

---

### Module 9: Search & Discovery (`SearchModule`)
- **Module Identifier:** `MOD-009`
- **Purpose:** Full-text discovery and typeahead autocomplete across posts, users, tags, and communities.
- **Main Functionality:**
  - Multi-entity search across posts, user accounts, and communities.
  - Auto-complete search suggestion generation.
  - Entity filtering (`all`, `posts`, `users`, `communities`).
- **Inputs:** Query string `q`, filter type, pagination limit.
- **Outputs:** Aggregated search results partitioned by entity type.
- **Dependencies:** Text indexes on `posts`, `users`, and `communities` MongoDB collections.
- **API Endpoints:**
  - `GET /api/v1/search`
  - `GET /api/v1/search/suggestions`
- **Database Interactions:** Text and regex queries on `posts`, `users`, and `communities`.
- **Testability & Boundaries:** Query handling, tokenization, and suggestion matching can be tested with both unit and integration suites.

---

### Module 10: Saved Collections & Bookmarks (`BookmarksModule`)
- **Module Identifier:** `MOD-010`
- **Purpose:** User-curated private bookmarking and categorization of posts.
- **Main Functionality:**
  - Bookmarking and un-bookmarking posts.
  - Creating and organizing named collections.
  - Listing user's saved items with masonry layout support.
- **Inputs:** Post ID, collection name, user context.
- **Outputs:** Saved items array, collection summaries, bookmark state.
- **Dependencies:** `saved_posts` collection, `collections` collection, `posts` collection.
- **API Endpoints:**
  - `GET /api/v1/users/me/saved`
  - `POST /api/v1/posts/:id/save`
  - `DELETE /api/v1/posts/:id/save`
- **Database Interactions:** `saved_posts` collection.
- **Testability & Boundaries:** Verified through 25 dedicated frontend tests (`saved_collections.test.tsx`) and backend API tests.

---

### Module 11: Content Moderation & Platform Safety (`ModerationModule`)
- **Module Identifier:** `MOD-011`
- **Purpose:** Platform trust and safety, abuse reporting, and administrative action execution.
- **Main Functionality:**
  - Reporting posts, comments, or users with categorized reasons (spam, harassment, inappropriate).
  - Admin review queue access with role-based access control.
  - Content removal and transactional status resolution.
- **Inputs:** Target ID, entity type, reason code, admin action verdict.
- **Outputs:** Report confirmation, administrative status changes.
- **Dependencies:** `reports` collection, `posts`, `comments`, admin authorization middleware.
- **API Endpoints:**
  - `POST /api/v1/reports`
  - `GET /api/v1/admin/reports`
  - `POST /api/v1/admin/reports/:id/resolve`
- **Database Interactions:** `reports` collection.
- **Testability & Boundaries:** Dedicated backend test suite (`moderation.test.ts`) covers report creation and admin resolution.

---

### Module 12: Media Upload & Storage Abstraction (`MediaModule`)
- **Module Identifier:** `MOD-012`
- **Purpose:** Multi-modal media ingestion with interchangeable storage providers (local disk vs. Cloudinary CDN).
- **Main Functionality:**
  - Multipart form upload processing.
  - Strict MIME validation (JPEG, PNG, WebP) and file size constraints (max 10MB).
  - Pluggable storage driver (`LocalStorageService` or `CloudinaryStorageService`).
  - Secure public URL generation.
- **Inputs:** Multipart form data file, storage environment configuration.
- **Outputs:** Media metadata object (`url`, `provider`, `filename`, `size`, `mime_type`).
- **Dependencies:** `@fastify/multipart`, `cloudinary` SDK, local disk directory (`packages/backend/public/uploads`).
- **API Endpoints:**
  - `POST /api/v1/media/upload`
  - `GET /uploads/:filename`
- **Database Interactions:** File metadata persisted in `posts` document.
- **Testability & Boundaries:** Provider isolation allows testing upload rejection, file size limits, and mock uploads independently.

---

### Module 13: Real-Time SSE & Event Dispatching (`RealtimeModule`)
- **Module Identifier:** `MOD-013`
- **Purpose:** Server-Sent Events (SSE) streaming live platform updates to connected browsers.
- **Main Functionality:**
  - Persistent SSE client connection management.
  - Participant-scoped event routing (direct messages, notifications, graph updates).
  - Keep-alive heartbeat pings to maintain persistent TCP connection.
- **Inputs:** Client SSE connection request (`Accept: text/event-stream`).
- **Outputs:** Stream of SSE events (`event: message`, `event: notification`, `event: graph_update`).
- **Dependencies:** `EventBus` singleton, Fastify connection handler.
- **API Endpoints:**
  - `GET /api/v1/realtime/events`
- **Database Interactions:** None directly.
- **Testability & Boundaries:** Event emission and subscriber isolation can be tested via unit tests (`realtime-events.test.ts`).

---

### Module 14: System Health & Infrastructure Diagnostics (`HealthModule`)
- **Module Identifier:** `MOD-014`
- **Purpose:** Diagnostic probes, database connectivity checks, cache pinging, and telemetry.
- **Main Functionality:**
  - Real-time MongoDB connection ping and latency measurement.
  - Real-time Redis connection ping and latency measurement.
  - Service uptime reporting and semver version exposure.
  - HTTP 200 (healthy) or 503 (degraded) status determination.
- **Inputs:** HTTP GET probe request.
- **Outputs:** JSON diagnostic payload with sub-millisecond latency metrics.
- **Dependencies:** `mongodb` client, `ioredis` client.
- **API Endpoints:**
  - `GET /api/v1/health`
- **Database Interactions:** `db.command({ ping: 1 })`, `redis.ping()`.
- **Testability & Boundaries:** Directly verifiable against deployed cloud instance and local services.

---

### Module 15: Frontend Client & UI Shell (`FrontendShellModule`)
- **Module Identifier:** `MOD-015`
- **Purpose:** Single-page application orchestration, navigation, dark/light theme switching, and responsive layouts.
- **Main Functionality:**
  - Responsive layout shell (TopHeader, LeftNav, MobileBottomNav, RightRail).
  - Client-side routing with authentication guards (`AuthGate`).
  - Neutral dark/light theme persistence in `localStorage`.
  - Seamless switching between `LiveClient` and `MockAdapter`.
  - Accessible interactive modals, dropdowns, and toast alerts.
- **Inputs:** Browser DOM events, route changes, theme toggles.
- **Outputs:** Interactive React virtual DOM, HTML5 history state, LocalStorage entries.
- **Dependencies:** React 19, Tailwind CSS 4, Lucide icons, Vite.
- **Interfaces:** Browser DOM, LocalStorage, History API, HTTP Fetch.
- **Testability & Boundaries:** Covered by 24 frontend test files (292 tests) running in Vitest with JSDOM.

---

## 3. Module Dependency & Testing Boundary Matrix

| Module ID | Module Name | Primary Dependencies | Independent Unit Testable? | Independent Integration Testable? | Requires Test DB/Redis? |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **MOD-001** | Authentication | bcryptjs, users collection | Yes | Yes | Yes (local test instance) |
| **MOD-002** | Social Graph | users, follows collections, Redis | Yes | Yes | Yes (local test instance) |
| **MOD-003** | Post Publishing | posts, post_likes collections | Yes | Yes | Yes (local test instance) |
| **MOD-004** | Comments | comments, posts collections | Yes | Yes | Yes (local test instance) |
| **MOD-005** | Communities | communities, members collections | Yes | Yes | Yes (local test instance) |
| **MOD-006** | Feed Delivery | posts, follows, Redis cache | Yes | Yes | Yes (local test instance) |
| **MOD-007** | Direct Messaging | conversations, messages, SSE | Yes | Yes | Yes (local test instance) |
| **MOD-008** | Notifications | notifications, EventBus | Yes | Yes | Yes (local test instance) |
| **MOD-009** | Search | MongoDB text indexes | Yes | Yes | Yes (local test instance) |
| **MOD-010** | Saved Collections | saved_posts, posts collections | Yes | Yes | Yes (local test instance) |
| **MOD-011** | Moderation | reports collection, auth guard | Yes | Yes | Yes (local test instance) |
| **MOD-012** | Media Storage | multipart, local disk / Cloudinary | Yes | Yes | No (disk/mock provider) |
| **MOD-013** | Realtime SSE | EventBus singleton | Yes | Yes | No |
| **MOD-014** | System Health | MongoDB client, Redis client | Yes | Yes | Yes (or deployed cloud) |
| **MOD-015** | Frontend Shell | React 19, Tailwind, Router | Yes | Yes (MockAdapter) | No (uses MockAdapter/JSDOM) |
