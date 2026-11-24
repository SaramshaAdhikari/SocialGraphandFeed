# Comprehensive Application Source Code Inventory & Testing Reference

**Audit Baseline Commit:** `eb1f5ba4be1edd35f148d1f18a3dc748458828fb`  
**Purpose:** Formal documentation of production source code implementations corresponding to tested subsystems, algorithms, and validation barriers for the final Software Testing & QA report.

---

## 1. Authentication & Session Management (`AuthModule`)

### Code Excerpt 1.1: Password Hashing & Constant-Time Verification
- **File Path:** `packages/backend/src/services/AuthService.ts`
- **Lines:** 20–26
- **Function/Method:** `hashPassword(password)` & `verifyPassword(password, encoded)`
- **Associated Testing Technique:** Unit Testing (`UT-001`), Security Testing (`SEC-001`), White-Box Statement Coverage (`WB-03`)
- **Relevance:** Demonstrates the use of `bcryptjs` with work factor 12. Crucially shows anti-timing attack defense: if `encoded` hash is undefined, the function still executes a dummy bcrypt hash to ensure constant-time response behavior, preventing user enumeration via timing differentials.
- **Corresponding Evidence:** `testing/execution_logs/backend_integration_suites.log` (`identity.test.ts`), `QA_VERIFICATION/06_EXECUTION_LOGS/frontend_vitest_execution.log`.

```typescript
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, encoded?: string): Promise<boolean> {
  if (!encoded) {
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

### Code Excerpt 1.2: Session Fixation Invalidation & Authentication Logic
- **File Path:** `packages/backend/src/services/AuthService.ts`
- **Lines:** 43–51
- **Function/Method:** `AuthService.login(login, password, existingSessionToken)`
- **Associated Testing Technique:** White-Box Basis Path Testing (`WB-04`), Functional Testing (`FT-001`), Negative Testing (`NEG-001`)
- **Relevance:** Contains 4 basis execution paths (valid login, invalid username, invalid password, existing session replacement). Demonstrates explicit session fixation defense: whenever a user authenticates, any existing session token is explicitly invalidated before creating the new session.
- **Corresponding Evidence:** `QA_VERIFICATION/03_TEST_EXECUTION_EVIDENCE/E2E-001_Negative_Auth_Alert.png`, `testing/execution_logs/path_coverage_execution.log`.

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

---

## 2. Multi-Document Database Transactions (`TransactionTier`)

### Code Excerpt 2.1: Atomic State Transitions with E11000 Duplicate Key Retry
- **File Path:** `packages/backend/src/db/transaction.ts`
- **Lines:** 5–25
- **Function/Method:** `runInTransaction<T>(work)`
- **Associated Testing Technique:** Desk Checking (`WB-01`), Integration Testing (`IT-002`), Defect Bash Elimination (`BB-07`)
- **Relevance:** Multi-document ACID transactions spanning `posts`, `post_votes`, `post_saves`, and `follows` collections. Essential for preventing desynchronized follower counts or double-voting race conditions. Specifically handles MongoDB transient `E11000` race conditions by retrying the state transition.
- **Corresponding Evidence:** `testing/execution_logs/desk_checking_execution.log`, `testing/execution_logs/backend_integration_suites.log` (`mongo-integration.test.ts`).

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

---

## 3. Distributed Sliding-Window Rate Limiting (`RateLimitTier`)

### Code Excerpt 3.1: Atomic Lua Script for Sliding-Window Enforcement
- **File Path:** `packages/backend/src/services/RateLimitService.ts`
- **Lines:** 25–36
- **Script:** `ATOMIC_RATE_LIMIT_LUA`
- **Associated Testing Technique:** Stress Testing (`BB-10`), Non-Functional Security (`BB-19`), Integration Testing (`BB-02`)
- **Relevance:** Solves distributed race conditions where two rapid concurrent requests increment a Redis counter before setting its TTL expiration, creating "immortal" rate-limit keys. Lua execution in Redis guarantees atomic INCR and EXPIRE.
- **Corresponding Evidence:** `testing/execution_logs/backend_integration_suites.log` (`distributed-rate-limit.test.ts`).

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

---

## 4. Dual-Strategy Feed Delivery Engine (`FeedModule`)

### Code Excerpt 4.1: Hybrid Fan-Out-On-Write Cutoff & Pipeline Execution
- **File Path:** `packages/backend/src/services/FeedService.ts`
- **Lines:** 26–55
- **Function/Method:** `FeedService.getFeed(query, currentUserId)`
- **Associated Testing Technique:** Cyclomatic Complexity Analysis (`WB-08`), Scenario Testing (`BB-06`), System Testing (`BB-03`)
- **Relevance:** The core algorithmic engine of the platform inspired by Meta TAO. High cyclomatic complexity ($M = 22$) driven by conditional strategy branching (`fanout_write` vs. `pull`), ranking algorithms (`hot` vs. `new` vs. `top`), and cursor pagination decoding.
- **Corresponding Evidence:** `QA_VERIFICATION/06_EXECUTION_LOGS/cyclomatic_complexity_execution.log`, `QA_VERIFICATION/02_APPLICATION_SCREENSHOTS/APP-002_Home_Feed_Top_Tab.png`.

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
    // Reads timeline pre-computed in user's feed inbox
    ...
```

---

## 5. Domain Boundary Schemas (`SharedContracts`)

### Code Excerpt 5.1: CreatePostInput Schema Boundaries
- **File Path:** `packages/shared/src/schemas/post.ts`
- **Lines:** 75–105
- **Schema:** `CreatePostInputSchema`
- **Associated Testing Technique:** Boundary Value Analysis (`BVA-01`), Equivalence Partitioning (`EP-POST`), Negative Testing (`NEG-01`)
- **Relevance:** Defines strict TypeBox type constraints, string bounds, and media array limits. Rejects payloads exceeding 300 characters in title, 40,000 characters in content, or 10 media items. Enforces `additionalProperties: false`.
- **Corresponding Evidence:** `QA_VERIFICATION/06_EXECUTION_LOGS/equivalence_partitioning_execution.log`, `testing/test-results/bva_and_negative_results.json`.

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

---

## 6. Single-Origin Reverse Proxy & Defect Target (`DeploymentTier`)

### Code Excerpt 6.1: Static HTML Serving and Missing Security Headers (Defect SEC-005)
- **File Path:** `production-server.mjs`
- **Lines:** 52–64
- **Function/Method:** Request handler in `http.createServer`
- **Associated Testing Technique:** Security Testing (`BB-19`), Desk Checking (`WB-01`), Defect Classification
- **Relevance:** Shows the exact mechanism behind Defect `SEC-005`. While API requests are proxied with Fastify Helmet security headers, the root SPA `index.html` is piped with only `content-type` and `cache-control`, omitting `Content-Security-Policy` and `X-Frame-Options: DENY`.
- **Corresponding Evidence:** `testing/execution_logs/security_execution.log`, `FINAL_QA_REPORT.md` (Part C, Section 3.3).

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
  // DEFECT SEC-005: Missing Helmet security headers on static HTML response
  res.writeHead(200, {
    'content-type': MIME[ext] || 'application/octet-stream',
    'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
  });
  fs.createReadStream(filePath).pipe(res);
});
```

---

## 7. Relative Time & Date Localization (`FrontendUtilities`)

### Code Excerpt 7.1: English Relative Timestamp Formatter
- **File Path:** `packages/frontend/src/utils/date.ts`
- **Lines:** 1–20
- **Function/Method:** `formatRelativeTime(dateString)`
- **Associated Testing Technique:** Localization Testing (`BB-15`), Unit Code Testing (`WB-02`)
- **Relevance:** Implements relative timestamp intervals (`just now`, `5m ago`, `2h ago`, `3d ago`). Directly analyzed under finding `LOC-005`: verified that while English relative time formatting functions accurately, the hardcoded string suffixes prevent dynamic multi-language locale switching.
- **Corresponding Evidence:** `testing/execution_logs/localization_execution.log`, `testing/execution_logs/unit_code_functional_execution.log`.

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
