# Comprehensive Source Code Reference & Verification Map

**Course:** Software Testing and Quality Assurance (23CSE502)  
**Institution:** JAIN (Deemed-to-be University), Department of Computer Science and Engineering  
**Application Under Test:** DMND (`SocialGraphandFeed`)  
**Baseline Git Commit:** `eb1f5ba4be1edd35f148d1f18a3dc748458828fb`  

---

## 1. Overview of Code Inventory Strategy

To ensure rigorous academic credibility, the Software Testing & QA report must not present testing results abstractly or generically. Every discussed testing technique—particularly White-Box, Unit, Boundary Value Analysis, Security, and Defect Classification—must directly reference, cite, and analyze the actual production implementation from the DMND repository.

This reference map links each key system module to its concrete source code excerpts, line numbers, function signatures, testing linkages, and academic significance.

```
+----------------------------------------------------------------------------------------------------+
|                                    Code Excerpt Reference Index                                    |
|  - Excerpt 1: Password Hashing & Anti-Timing Defense (AuthService.ts:20-34)                        |
|  - Excerpt 2: Session Fixation Defense & Basis Paths (AuthService.ts:43-56)                        |
|  - Excerpt 3: Multi-Document ACID Transactions & Retry Loop (transaction.ts:5-25)                  |
|  - Excerpt 4: Atomic Redis Sliding-Window Rate Limiter (RateLimitService.ts:25-36)                 |
|  - Excerpt 5: Dual-Strategy Hybrid Feed Distribution Pipeline (FeedService.ts:26-55)               |
|  - Excerpt 6: CreatePostInput TypeBox Schema Boundaries (schemas/post.ts:75-105)                   |
|  - Excerpt 7: Reverse Proxy Static Stream & Missing Headers [Defect SEC-005] (production-server.mjs)|
|  - Excerpt 8: Relative Timestamp Formatter [Finding LOC-005] (utils/date.ts:1-20)                  |
|  - Excerpt 9: Social Graph 2-Hop Neighborhood Exploration (routes/graph.routes.ts:15-45)           |
|  - Excerpt 10: Full-Text Multi-Token Regex Search Engine (routes/search.routes.ts:18-42)           |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Master Source Code Excerpt Register

### Code Excerpt 1: Password Hashing & Anti-Timing Attack Dummy Execution
- **Module:** Authentication Controller & Identity Tier
- **Repository File Path:** `packages/backend/src/services/AuthService.ts`
- **Line Numbers:** 20–34
- **Function Signature:** `export async function verifyPassword(password: string, encoded?: string): Promise<boolean>`
- **Associated Testing Techniques:**
  - Technique 15: White-Box Testing
  - Technique 25: Unit Testing (`UT-001`)
  - Technique 42: Security Testing (`SEC-001`)
- **Associated Test Case IDs:** `TC-UT-001`, `TC-SEC-001`, `TC-WB-003`
- **Source Code:**
```typescript
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, encoded?: string): Promise<boolean> {
  if (!encoded) {
    // Anti-timing attack defense: execute bcrypt dummy computation to equalize execution time
    await bcrypt.hash(password, 12);
    return false;
  }
  try {
    return await bcrypt.compare(password, encoded);
  } catch {
    return false;
  }
}
```
- **Academic Justification & Analysis:**  
  Demonstrates cryptographic rigor. Standard password verification without dummy hashing allows remote attackers to measure response times to determine whether a username exists (user enumeration via timing differential). By executing `bcrypt.hash(password, 12)` even when `encoded` is undefined, the function guarantees constant-time response profiles ($O(\text{work factor})$), neutralizing side-channel timing analysis.

---

### Code Excerpt 2: Session Fixation Prevention & Multi-Path Authentication
- **Module:** Authentication Controller & Identity Tier
- **Repository File Path:** `packages/backend/src/services/AuthService.ts`
- **Line Numbers:** 43–56
- **Method Signature:** `async login(login: string, password: string, existingSessionToken?: string): Promise<LoginResult>`
- **Associated Testing Techniques:**
  - Technique 5: Decision Table Testing
  - Technique 20: Path Coverage (Basis Path Analysis)
  - Technique 42: Security Testing
- **Associated Test Case IDs:** `TC-DTT-001`, `TC-PATH-001` through `TC-PATH-004`, `TC-SEC-002`
- **Source Code:**
```typescript
async login(login: string, password: string, existingSessionToken?: string) {
  const user = await this.users().findOne({ username: resolveLoginUsername(login, this.environment) });
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw AppError.unauthorized('Invalid username or password.');
  }
  // Session Fixation Defense: Always invalidate prior session on login
  if (existingSessionToken) {
    await this.logout(existingSessionToken);
  }
  return { user: safeUser(user), session: await this.createSession(user._id) };
}
```
- **Academic Justification & Analysis:**  
  Illustrates basis path testing. The function exhibits 4 linearly independent execution paths:
  1. `Path 1`: User lookup fails (`user === null`) $\rightarrow$ Throws `401 Unauthorized`.
  2. `Path 2`: User found, password invalid $\rightarrow$ Throws `401 Unauthorized`.
  3. `Path 3`: User valid, password valid, `existingSessionToken` undefined $\rightarrow$ Creates session $\rightarrow$ Returns `200 OK`.
  4. `Path 4`: User valid, password valid, `existingSessionToken` provided $\rightarrow$ Invalidates old token $\rightarrow$ Creates new session $\rightarrow$ Returns `200 OK`.  
  Crucially demonstrates proactive defense against session fixation attacks (OWASP A07:2021).

---

### Code Excerpt 3: Multi-Document ACID Transactions with E11000 Duplicate Key Retry
- **Module:** Database Transaction Management Tier
- **Repository File Path:** `packages/backend/src/db/transaction.ts`
- **Line Numbers:** 5–25
- **Function Signature:** `export async function runInTransaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T>`
- **Associated Testing Techniques:**
  - Technique 15: White-Box Testing
  - Technique 16: Desk Checking
  - Technique 26: Integration Testing
  - Technique 32: Reliability Testing
- **Associated Test Case IDs:** `TC-WB-001`, `TC-DC-001`, `TC-IT-002`, `TC-REL-001`
- **Source Code:**
```typescript
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
- **Academic Justification & Analysis:**  
  Solves a notorious concurrency defect in document databases: during simultaneous upvotes or follow toggles, MongoDB unique index constraints can throw `E11000 (Duplicate Key)` outside the standard transient transaction retry handler. By wrapping `session.withTransaction` in an explicit retry loop (up to 2 retry attempts), this code prevents state desynchronization between user action tables and entity counter caches.

---

### Code Excerpt 4: Distributed Sliding-Window Rate Limiting via Atomic Lua Script
- **Module:** Rate Limiting & Abuse Prevention Tier
- **Repository File Path:** `packages/backend/src/services/RateLimitService.ts`
- **Line Numbers:** 25–36
- **Script Identifier:** `ATOMIC_RATE_LIMIT_LUA`
- **Associated Testing Techniques:**
  - Technique 16: Desk Checking
  - Technique 31: Scalability Testing
  - Technique 33: Stress Testing
  - Technique 42: Security Testing
- **Associated Test Case IDs:** `TC-DC-002`, `TC-STRESS-001`, `TC-SEC-004`
- **Source Code:**
```lua
local current = redis.call('INCR', KEYS[1])
if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('TTL', KEYS[1])
if ttl < 0 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
    ttl = tonumber(ARGV[1])
end
return { current, ttl }
```
- **Academic Justification & Analysis:**  
  Analyzed during White-Box Desk Checking. Non-atomic implementations (e.g. issuing a Redis `INCR` followed by a separate `EXPIRE` over network sockets) are vulnerable to network partition races where the key is incremented but fails to receive a TTL, creating permanently rate-limited "zombie" accounts. Executing this Lua script inside Redis guarantees single-threaded atomic execution of both counter increments and TTL bounds.

---

### Code Excerpt 5: Dual-Strategy Hybrid Feed Distribution Pipeline (Meta TAO Pattern)
- **Module:** Feed Service & Timeline Delivery Engine
- **Repository File Path:** `packages/backend/src/services/FeedService.ts`
- **Line Numbers:** 26–55
- **Method Signature:** `public async getFeed(query: FeedQuery = {}, currentUserId?: string): Promise<FeedResponse>`
- **Associated Testing Techniques:**
  - Technique 10: Cause-Effect Graphing
  - Technique 24: Code Complexity Testing (McCabe Metric)
  - Technique 29: Scenario Testing
- **Associated Test Case IDs:** `TC-CEG-001`, `TC-CC-001`, `TC-SCEN-003`
- **Source Code:**
```typescript
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
      return { success: true, data: [], next_cursor: null, has_more: false, meta: { count: 0, server_execution_time_ms: Number((performance.now() - start).toFixed(2)) } };
    }
    const follows = await followsCol.find({ follower_id: currentUserId }).toArray();
    const targetUserIds = follows.map((f) => f.target_user_id);
    // Pipeline aggregation reading pre-computed timeline inboxes...
```
- **Academic Justification & Analysis:**  
  Represents the most architecturally complex function in the application ($M = 11$, flagged in AST Cyclomatic Complexity audit). It manages the hybrid fan-out cutoff: regular users push posts to follower timelines (fan-out-on-write), while high-fanout celebrity accounts ($>10,000$ followers) are aggregated dynamically on read (fan-out-on-read) to prevent write-amplification thrashing.

---

### Code Excerpt 6: CreatePostInput TypeBox Schema Boundaries
- **Module:** Shared Domain Contracts & Validation Tier
- **Repository File Path:** `packages/shared/src/schemas/post.ts`
- **Line Numbers:** 75–105
- **Schema Identifier:** `CreatePostInputSchema`
- **Associated Testing Techniques:**
  - Technique 3: Equivalence Partitioning
  - Technique 4: Boundary Value Analysis
  - Technique 14: Error Guessing Testing
- **Associated Test Case IDs:** `TC-EP-001`, `TC-BVA-001` through `TC-BVA-012`, `TC-EG-003`
- **Source Code:**
```typescript
export const CreatePostInputSchema = Type.Object({
  title: Type.Optional(Type.String({ maxLength: 300 })),
  content: Type.Optional(Type.String({ maxLength: 40000 })),
  post_type: Type.Optional(Type.Union([
    Type.Literal('discussion'),
    Type.Literal('visual'),
    Type.Literal('link'),
  ])),
  community_id: Type.Optional(Type.String({ maxLength: 64, pattern: '^[A-Za-z0-9_-]+$' })),
  destination_url: Type.Optional(Type.String({ format: 'uri', maxLength: 2048 })),
  media: Type.Optional(Type.Array(MediaAttachmentSchema, { maxItems: 10 })),
  tags: Type.Optional(Type.Array(TagSchema, { maxItems: 20 })),
}, { additionalProperties: false });
```
- **Academic Justification & Analysis:**  
  The mathematical baseline for Boundary Value Analysis ($min=0, max=300$ for title; $min=0, max=40,000$ for content; $maxItems=10$ for media attachments). The setting `{ additionalProperties: false }` serves as a critical defense against parameter injection and mass assignment vulnerabilities.

---

### Code Excerpt 7: Static Reverse Proxy Stream & Missing Security Headers (Defect SEC-005)
- **Module:** Reverse Proxy & Static Asset Server
- **Repository File Path:** `production-server.mjs`
- **Line Numbers:** 52–64
- **Function Signature:** Request callback in `http.createServer((req, res) => ...)`
- **Associated Testing Techniques:**
  - Technique 30: Defect Bash Elimination
  - Technique 42: Security Testing
  - Chapter 7: Defect Identification & Analysis
- **Associated Test Case IDs:** `TC-SEC-005`, `DEFECT-SEC-005`
- **Source Code:**
```javascript
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
    return proxy(req, res);
  }
  let filePath = path.join(DIST, url.pathname);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html');
  }
  const ext = path.extname(filePath).toLowerCase();
  // DEFECT SEC-005: Missing Helmet security headers on static HTML response stream
  res.writeHead(200, {
    'content-type': MIME[ext] || 'application/octet-stream',
    'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
  });
  fs.createReadStream(filePath).pipe(res);
});
```
- **Academic Justification & Analysis:**  
  Identified during Defect Bash testing. While Fastify API endpoints attach full Helmet headers (`Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`), the Node.js reverse proxy serving the root SPA `index.html` omits them. This leaves the SPA vulnerable to clickjacking via malicious iframe framing. The report presents this code and its verified remediation patch.

---

### Code Excerpt 8: Relative Time Formatter & Hardcoded English Literals (Finding LOC-005)
- **Module:** Frontend Date & Time Formatting Utilities
- **Repository File Path:** `packages/frontend/src/utils/date.ts`
- **Line Numbers:** 1–20
- **Function Signature:** `export function formatRelativeTime(dateString: string): string`
- **Associated Testing Techniques:**
  - Technique 17: Unit / Code Functional Testing
  - Technique 38: Localization (L10N) Testing
- **Associated Test Case IDs:** `TC-UT-008`, `TC-L10N-001`
- **Source Code:**
```typescript
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

    if (diffInSeconds < 60) return 'just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    return `${Math.floor(diffInDays / 365)}y ago`;
  } catch {
    return dateString;
  }
}
```
- **Academic Justification & Analysis:**  
  Evaluated under Unit Testing and Localization Testing. Mathematically, the function computes elapsed intervals correctly. However, from a localization engineering standpoint, hardcoded English suffixes (`"just now"`, `"m ago"`, `"h ago"`, `"d ago"`) prevent locale-aware translation into other languages, substantiating Finding `LOC-005`.

---

### Code Excerpt 9: Social Graph 2-Hop Neighborhood Exploration
- **Module:** Social Graph Engine & Adjacency Traverser
- **Repository File Path:** `packages/backend/src/routes/graph.routes.ts`
- **Line Numbers:** 15–45
- **Route Handler:** `GET /api/v1/graph/neighborhood`
- **Associated Testing Techniques:**
  - Technique 7: Exploratory Testing
  - Technique 26: Integration Testing
  - Technique 34: Interoperability Testing
- **Associated Test Case IDs:** `TC-EXP-001`, `TC-IT-005`
- **Source Code:**
```typescript
fastify.get('/neighborhood', { schema: GetNeighborhoodSchema }, async (request, reply) => {
  const { depth = 1, limit = 50 } = request.query as any;
  const currentUserId = (request as any).session?.userId;
  if (!currentUserId) throw AppError.unauthorized('Session required for graph exploration.');

  const followsCol = fastify.mongo.db.collection('follows');
  const directFollows = await followsCol.find({ follower_id: currentUserId }).limit(limit).toArray();
  const directTargetIds = directFollows.map(f => f.target_user_id);

  let secondaryTargetIds: string[] = [];
  if (depth > 1) {
    const secondaryFollows = await followsCol.find({ follower_id: { $in: directTargetIds } }).limit(limit * 2).toArray();
    secondaryTargetIds = secondaryFollows.map(f => f.target_user_id);
  }
  // Construct adjacency nodes and edges payload...
  return reply.send({ success: true, nodes: [...], links: [...] });
});
```
- **Academic Justification & Analysis:**  
  Powers the interactive HTML5 force-directed graph canvas visualizer (`APP-005`). Demonstrates bounded breadth-first traversal ($depth \in \{1, 2\}$, $limit \le 100$) to prevent runaway combinatorial graph expansion from consuming server RAM.

---

### Code Excerpt 10: Multi-Token Universal Search Engine
- **Module:** Full-Text Search Engine
- **Repository File Path:** `packages/backend/src/routes/search.routes.ts`
- **Line Numbers:** 18–42
- **Route Handler:** `GET /api/v1/search`
- **Associated Testing Techniques:**
  - Technique 8: Random / Monkey Fuzzing
  - Technique 40: Language Compatibility Testing
- **Associated Test Case IDs:** `TC-RND-001`, `TC-LANG-001`
- **Source Code:**
```typescript
fastify.get('/', { schema: SearchQuerySchema }, async (request, reply) => {
  const { q, limit = 20 } = request.query as any;
  if (!q || q.trim().length === 0) {
    return reply.send({ success: true, posts: [], users: [], tags: [] });
  }
  const cleanQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Sanitize regex tokens
  const regex = new RegExp(cleanQuery, 'i');

  const [posts, users] = await Promise.all([
    fastify.mongo.db.collection('posts').find({ $or: [{ title: regex }, { content: regex }] }).limit(limit).toArray(),
    fastify.mongo.db.collection('users').find({ $or: [{ username: regex }, { bio: regex }] }).limit(limit).toArray(),
  ]);

  return reply.send({ success: true, posts, users });
});
```
- **Academic Justification & Analysis:**  
  Demonstrates sanitization of regex metacharacters (`cleanQuery`), which directly neutralizes Regular Expression Denial of Service (ReDoS) vulnerabilities during fuzz testing and random monkey input testing.
