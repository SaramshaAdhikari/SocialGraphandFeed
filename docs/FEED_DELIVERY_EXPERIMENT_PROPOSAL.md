# Feed Delivery Architecture: Fan-Out-on-Read vs Fan-Out-on-Write
## Section 7.2A Technical Proposal & Backend Specification

**Author:** Senior Frontend & Feed Engineering Owner  
**Audience:** Backend Systems Teammate, Architecture Review  
**Date:** October 2026  
**Status:** PROPOSED FOR BACKEND AGREEMENT  
**Target Repository:** `SaramshaAdhikari/SocialGraphandFeed`  
**Isolated Benchmark Database:** `socialgraph_benchmark` (Zero pollution of `socialgraph`)

---

## 1. Executive Summary & Objective

The **SocialGraph & Feed Engineering Platform** requires a defensible, measurable feed-delivery engineering story. Currently, the platform operates exclusively on a **Fan-Out-on-Read (FOOR)** model. While FOOR offers instantaneous, zero-overhead write performance ($O(1)$ post creation), it forces high query-time computational complexity ($O(N_{\text{follows}} \cdot \log M)$) onto the database during feed reads.

This proposal specifies:
1. The rigorous audit of the current **Fan-Out-on-Read** baseline in `FeedService.ts` and `PostService.ts`.
2. The architectural design for an alternative **Fan-Out-on-Write (FOOW)** timeline model using a dedicated `feed_inboxes` collection.
3. An explicit **Hybrid Optimization Strategy** for celebrity/high-fanout creators.
4. An empirical **Benchmark Design & Workload Specification** that isolates test executions in `socialgraph_benchmark` to capture real p50/p95/p99 read and write latencies.
5. The exact contract and coordination requirements for the backend contributor.

---

## 2. Baseline Architecture Audit: Fan-Out-on-Read (FOOR)

### 2.1 Current Implementation Mechanics

Our code inspection of `packages/backend/src/services/FeedService.ts` (lines 31–57) confirms the following read-time execution path for `scope === 'following'`:

```
User Requests Feed (scope: 'following')
               │
               ▼
1. Query follows collection:
   find({ follower_id: currentUserId })
   ──> Returns array of targetUserIds [usr_1, usr_2, ... usr_K]
               │
               ▼
2. Build MongoDB query filter:
   scopeFilter = { author_id: { $in: targetUserIds } }
               │
               ▼
3. Compound Query on posts collection:
   find({ author_id: { $in: targetUserIds }, ...cursorFilter })
     .sort({ hot_score: -1, created_at: -1, _id: -1 })
     .limit(limit + 1)
               │
               ▼
4. Batch Hydration:
   - Find distinct authors in pageDocs from users collection
   - Query post_votes and post_saves for current user
               │
               ▼
Return FeedResponse (data, next_cursor, meta)
```

In `packages/backend/src/services/PostService.ts` (lines 70–112), `createPost` writes directly to `posts` and increments `users.posts_count`. No write-time timeline distribution exists.

### 2.2 Algorithmic & Hardware Bottlenecks of FOOR

| Dimension | Fan-Out-on-Read (FOOR) Behavior | Scaling Implication |
|---|---|---|
| **Write Complexity** | $O(1)$ single insert into `posts` | Highly scalable post creation. |
| **Write Latency** | ~2–5 ms (single MongoDB write transaction) | Unaffected by author's follower count. |
| **Read Complexity** | $O(K \cdot \log M)$ where $K = |targetUserIds|$ | Degrades linearly as user follows more accounts. |
| **MongoDB Index Scan** | Multi-key index bounds scan on `{ author_id: 1, created_at: -1 }` across $K$ disjoint ranges | High B-tree traversal overhead; index cache thrashing. |
| **Memory Pressure** | High working-set consumption during sort/merge operations | Server CPU spikes under concurrent feed reads. |
| **Read Amplification** | $1 \text{ read request} \rightarrow 1 \text{ follow query} + 1 \text{ posts scan} + 1 \text{ user batch} + 2 \text{ meta lookups}$ | Read path carries 100% of the graph assembly burden. |

---

## 3. Proposed Architecture: Fan-Out-on-Write (FOOW)

### 3.1 Inbox Storage Primitive (`feed_inboxes`)

To eliminate the read-time `$in: targetUserIds` multi-range scan, we introduce a dedicated pre-computed timeline collection: `feed_inboxes`.

```typescript
// Proposed type definition for packages/backend/src/db/types.ts
export interface FeedInboxDoc {
  _id: string; // e.g. "inbox_<user_id>_<post_id>"
  user_id: string; // Recipient user ID (the follower)
  post_id: string; // ID of the published post
  author_id: string; // ID of the creator
  post_type: 'discussion' | 'visual';
  created_at: Date; // Post creation timestamp
  score: number; // Cached score for initial sorting
  hot_score: number; // Cached hot ranking score
}
```

#### Required MongoDB Indexes
In `packages/backend/src/db/indexes.ts`, register the following compound indexes:

1. **Chronological timeline scan:**  
   `{ user_id: 1, created_at: -1 }` (Covers `sort: 'new'`)
2. **Algorithmic hot timeline scan:**  
   `{ user_id: 1, hot_score: -1 }` (Covers `sort: 'hot'`)
3. **Top score timeline scan:**  
   `{ user_id: 1, score: -1 }` (Covers `sort: 'top'`)
4. **Idempotency unique constraint:**  
   `{ user_id: 1, post_id: 1 }` (Unique: prevents duplicate timeline entries on retries)

### 3.2 Write Path: Push-to-Inbox Hook in `PostService`

When author $A$ publishes post $P$:
1. Insert post document $P$ into `posts`.
2. Increment `users.posts_count` for author $A$.
3. Retrieve all active followers of author $A$:
   ```typescript
   const followers = await followsCol.find({ target_user_id: authorId }, { projection: { follower_id: 1 } }).toArray();
   ```
4. If $0 < |\text{followers}| \le \text{THRESHOLD}$:
   Prepare batch inbox documents:
   ```typescript
   const inboxDocs: FeedInboxDoc[] = followers.map((f) => ({
     _id: `inbox_${f.follower_id}_${postDoc._id}`,
     user_id: f.follower_id,
     post_id: postDoc._id,
     author_id: authorId,
     post_type: postDoc.post_type,
     created_at: postDoc.created_at,
     score: postDoc.score,
     hot_score: postDoc.hot_score,
   }));
   await inboxesCol.insertMany(inboxDocs, { ordered: false });
   ```

### 3.3 Read Path: Single Index Seek in `FeedService`

When client requests feed with `query.strategy === 'fanout_write'` and `scope === 'following'`:
```typescript
if (strategy === 'fanout_write' && scope === 'following') {
  const inboxesCol = this.db.collection<FeedInboxDoc>(COLLECTIONS.FEED_INBOXES);
  
  // 1. Single index scan on { user_id: 1, hot_score: -1 }
  const inboxItems = await inboxesCol
    .find({ user_id: currentUserId, ...inboxCursorFilter })
    .sort(sortSpec)
    .limit(limit + 1)
    .toArray();
    
  // 2. Hydrate post documents by primary key in one batch
  const postIds = inboxItems.map(i => i.post_id);
  const posts = await postsCol.find({ _id: { $in: postIds } }).toArray();
  
  // 3. Preserve inbox order & hydrate metadata
  ...
}
```

---

## 4. The Celebrity Problem & Hybrid Strategy

### 4.1 Write Amplification Vulnerability
In a pure FOOW model, if a user with $50,000$ followers publishes a post, the application must execute $50,000$ database writes across $50,000$ distinct user inboxes. Under high write concurrency, this produces severe write amplification, transaction locks, and IOPS saturation.

### 4.2 Proposed Hybrid Threshold Model
We establish a configurable threshold: `FOOW_MAX_FOLLOWERS_THRESHOLD = 500`.
- **Standard Creators ($\le 500$ followers):** Fan out to followers' inboxes on write.
- **High-Fanout / Celebrity Creators ($> 500$ followers):** Do *not* fan out on write.
- **Read Resolution for Hybrid:** The feed service reads the user's pre-computed inbox ($O(1)$), queries the few followed celebrity creators ($O(\text{celebrities})$), and performs a fast in-memory $K$-way merge.

---

## 5. Comparative Trade-Off Matrix

| Metric / Dimension | Fan-Out-on-Read (FOOR) | Fan-Out-on-Write (FOOW) | Hybrid Model |
|---|---|---|---|
| **Write Time Complexity** | $O(1)$ | $O(F)$ where $F = |\text{followers}|$ | $O(\min(F, \text{Threshold}))$ |
| **Write Latency (p95)** | $\le 5\text{ ms}$ | $15\text{ ms} - 120\text{ ms}$ (at $F=500$) | $\le 25\text{ ms}$ |
| **Read Time Complexity** | $O(K \cdot \log M)$ ($K = |\text{follows}|$) | $O(1)$ indexed range scan | $O(1) + O(C)$ ($C = \text{celebrities}$) |
| **Read Latency (p95)** | $25\text{ ms} - 95\text{ ms}$ (grows with $K$) | $\le 8\text{ ms}$ (flat) | $\le 12\text{ ms}$ |
| **Storage Overhead** | Zero timeline duplication | High ($F \times \text{post}$ pointers) | Moderate |
| **Data Staleness** | Zero (instant visibility) | Minimal (async insert completion) | Zero |
| **Failure Mode** | Database CPU exhaustion on feed queries | Write timeout / queue backlog on post creation | Balanced protection |

---

## 6. Benchmark Design & Workload Specification

To provide empirical proof rather than theoretical speculation, we specify a native benchmark test suite.

### 6.1 Database Isolation Boundary
- **Benchmark Database:** `mongodb://127.0.0.1:27017/socialgraph_benchmark`
- **Development Database:** `mongodb://127.0.0.1:27017/socialgraph` (UNTOUCHED)
- The benchmark script must automatically create, seed, benchmark, and drop `socialgraph_benchmark`.

### 6.2 Realistic Graph Topology (Zipf / Power-Law Distribution)
We seed an isolated graph of $N = 100$ users:
- **Tier 1 (Influencers, Top 5%):** 5 accounts with 45–60 followers each.
- **Tier 2 (Core Creators, Next 20%):** 20 accounts with 15–30 followers each.
- **Tier 3 (Casual Users, Remaining 75%):** 75 accounts with 2–8 followers each.
- **Initial Post Base:** 500 initial posts across all users.

### 6.3 Benchmark Execution Scenarios
The benchmark runner will measure 3 distinct execution phases:

1. **Write Latency Phase (100 Operations):**
   - 20 posts created by Tier 1 creators.
   - 40 posts created by Tier 2 creators.
   - 40 posts created by Tier 3 creators.
   - Record: Min, Mean, Median (p50), p95, p99 write latency (ms) for FOOR vs FOOW.

2. **Read Latency Phase (500 Operations):**
   - 150 feed reads for users following $>40$ accounts.
   - 200 feed reads for users following $15-30$ accounts.
   - 150 feed reads for users following $<5$ accounts.
   - Record: Min, Mean, Median (p50), p95, p99 read latency (ms) for FOOR vs FOOW.

3. **Mixed Concurrency Phase (80/20 Read/Write Ratio):**
   - 400 feed reads + 100 post creations interleaved.
   - Measure database memory growth and throughput (ops/sec).

---

## 7. Backend Action Items & Dependency Checklist

To allow frontend and backend teams to complete this milestone seamlessly, the backend teammate is requested to implement the following changes:

- [ ] **7.1 Add Collection Constant:** Add `FEED_INBOXES: 'feed_inboxes'` to `COLLECTIONS` in `packages/backend/src/db/collections.ts`.
- [ ] **7.2 Register Indexes:** In `packages/backend/src/db/indexes.ts`, register indexes on `feed_inboxes` for `{ user_id: 1, created_at: -1 }`, `{ user_id: 1, hot_score: -1 }`, and unique `{ user_id: 1, post_id: 1 }`.
- [ ] **7.3 Implement Write-Time Fan-Out:** In `PostService.createPost`, invoke `fanoutPostToInboxes(postDoc)` to populate `feed_inboxes`.
- [ ] **7.4 Dual-Path Feed Query:** In `FeedService.getFeed`, check `query.strategy`:
  - If `'fanout_read'`: execute existing `$in: targetUserIds` query.
  - If `'fanout_write'`: execute query against `feed_inboxes`.
- [ ] **7.5 Fix Saved Route Interception:** In `packages/backend/src/routes/posts.ts`, register `GET /posts/saved` *before* `GET /posts/:postId` so `/posts/saved` is not treated as a post ID.
- [ ] **7.6 Benchmark Script:** Provide standalone benchmark executable in `packages/backend/test/benchmark-feed-delivery.ts` targeting `socialgraph_benchmark`.
