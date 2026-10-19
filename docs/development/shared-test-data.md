# Shared Local Development Test Data

This file contains a small, fictional dataset for the existing `socialgraph` MongoDB database. It uses the MongoDB 7 `mongosh` shell provided by the Compose `mongodb` service.

The seed is **insert-only**. Every document has the marker `seed_key: "shared-test-data-v1"`. It uses deterministic IDs and first checks IDs plus unique usernames, community slugs, and relationship pairs. If a matching ID belongs to a document without this marker, or a unique value belongs to another record, the preflight stops before inserting anything. Existing marked documents are left as-is on reruns; unrelated records are never replaced or deleted. This intentionally means later edits to the sample dataset require a new seed version/IDs.

Seeded user records are fictional browseable personas without credentials. The commands do not create a password, set an administrator role, or modify `alex_dev`. To sign in as yourself, use the normal registration page with another username.

## Seed commands

Start `mongosh` using the README instructions, then paste the entire JavaScript block below into the shell. The project default database name is `socialgraph`. If `MONGODB_DB_NAME` is set to another local database in your `.env`, change the database name in the first line before executing it.

```javascript
const seedDb = db.getSiblingDB("socialgraph");
const seedKey = "shared-test-data-v1";
const seedStamp = (iso) => new Date(iso);

function validateSeedDocuments(collectionName, documents, uniqueFilters = []) {
  const collection = seedDb.getCollection(collectionName);
  for (const document of documents) {
    const byId = collection.findOne({ _id: document._id });
    if (byId && byId.seed_key !== seedKey) {
      throw new Error(`${collectionName}/${document._id} already exists and is not owned by this seed; nothing has been inserted.`);
    }
    for (const makeFilter of uniqueFilters) {
      const conflict = collection.findOne(makeFilter(document));
      if (conflict && conflict._id !== document._id) {
        throw new Error(`${collectionName} unique value conflicts with ${conflict._id}; nothing has been inserted.`);
      }
    }
  }
}

function insertMissingSeedDocuments(collectionName, documents) {
  const collection = seedDb.getCollection(collectionName);
  let inserted = 0;
  for (const document of documents) {
    if (!collection.findOne({ _id: document._id })) {
      collection.insertOne(document);
      inserted += 1;
    }
  }
  print(`${collectionName}: inserted ${inserted}; already present ${documents.length - inserted}`);
}

const users = [
  {
    _id: "usr_shared_ada", seed_key: seedKey, username: "shared_ada",
    display_name: "Ada Chen", avatar_url: "/avatars/sara-code.svg",
    bio: "Fictional developer exploring reliable feeds and graph systems.",
    is_verified: false, followers_count: 1, following_count: 1, posts_count: 2,
    created_at: seedStamp("2026-09-01T09:00:00.000Z"), updated_at: seedStamp("2026-09-01T09:00:00.000Z")
  },
  {
    _id: "usr_shared_mina", seed_key: seedKey, username: "shared_mina",
    display_name: "Mina Patel", avatar_url: "/avatars/elena-arch.svg",
    bio: "Fictional photographer documenting public spaces and architecture.",
    is_verified: false, followers_count: 1, following_count: 1, posts_count: 1,
    created_at: seedStamp("2026-09-02T09:00:00.000Z"), updated_at: seedStamp("2026-09-02T09:00:00.000Z")
  },
  {
    _id: "usr_shared_noah", seed_key: seedKey, username: "shared_noah",
    display_name: "Noah Kim", avatar_url: "/avatars/lucas-t.svg",
    bio: "Fictional backend engineer who enjoys clear benchmarks.",
    is_verified: false, followers_count: 1, following_count: 1, posts_count: 1,
    created_at: seedStamp("2026-09-03T09:00:00.000Z"), updated_at: seedStamp("2026-09-03T09:00:00.000Z")
  }
];

const communities = [
  {
    _id: "comm_shared_systems", seed_key: seedKey, name: "Shared Systems Lab",
    slug: "shared-systems", description: "A sample community for distributed systems discussions.",
    avatar_url: "/avatars/alex-dev.svg", members_count: 2,
    rules: [{ id: "rule_shared_1", title: "Show your evidence", description: "Include measurements or a reproducible example." }],
    created_at: seedStamp("2026-09-01T10:00:00.000Z"), updated_at: seedStamp("2026-09-01T10:00:00.000Z")
  },
  {
    _id: "comm_shared_visuals", seed_key: seedKey, name: "Shared Visual Stories",
    slug: "shared-visuals", description: "A sample community for photography and visual posts.",
    avatar_url: "/avatars/elena-arch.svg", members_count: 2,
    rules: [{ id: "rule_shared_2", title: "Add context", description: "Describe what viewers should notice." }],
    created_at: seedStamp("2026-09-02T10:00:00.000Z"), updated_at: seedStamp("2026-09-02T10:00:00.000Z")
  }
];

const posts = [
  {
    _id: "post_shared_001", seed_key: seedKey, post_type: "discussion", author_id: "usr_shared_ada",
    title: "Keeping a small feed page deterministic", content: "Stable ordering makes pagination easier to inspect. Which tie-breakers do you include?",
    community_id: "comm_shared_systems", community_slug: "shared-systems", flair: "Implementation",
    score: 2, hot_score: 2.373, comments_count: 2,
    created_at: seedStamp("2026-10-01T10:00:00.000Z"), updated_at: seedStamp("2026-10-01T10:00:00.000Z")
  },
  {
    _id: "post_shared_002", seed_key: seedKey, post_type: "visual", author_id: "usr_shared_mina",
    title: "Morning light in the civic courtyard", caption: "A fictional study of repeating lines and soft light.",
    community_id: "comm_shared_visuals", community_slug: "shared-visuals",
    media: { id: "media_shared_001", url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200", aspect_ratio: 1.33, width: 1200, height: 900, alt_text: "Geometric modern building facade" },
    dominant_color: "#64748B", tags: ["architecture", "light"],
    score: 1, hot_score: 2.072, comments_count: 1,
    created_at: seedStamp("2026-10-02T10:00:00.000Z"), updated_at: seedStamp("2026-10-02T10:00:00.000Z")
  },
  {
    _id: "post_shared_003", seed_key: seedKey, post_type: "discussion", author_id: "usr_shared_noah",
    title: "What belongs in a useful API smoke check?", content: "I start with one create, one read, and one rejected request. What else gives you confidence quickly?",
    community_id: "comm_shared_systems", community_slug: "shared-systems", flair: "Question",
    score: 0, hot_score: 0.000, comments_count: 1,
    created_at: seedStamp("2026-10-03T10:00:00.000Z"), updated_at: seedStamp("2026-10-03T10:00:00.000Z")
  },
  {
    _id: "post_shared_004", seed_key: seedKey, post_type: "discussion", author_id: "usr_shared_ada",
    title: "A short note on cursor pagination", content: "This second post by Ada helps exercise profiles and multi-page feeds.",
    score: 0, hot_score: 0.000, comments_count: 0,
    created_at: seedStamp("2026-10-04T10:00:00.000Z"), updated_at: seedStamp("2026-10-04T10:00:00.000Z")
  }
];

const comments = [
  { _id: "cmt_shared_001", seed_key: seedKey, post_id: "post_shared_001", parent_id: null, author_id: "usr_shared_mina", content: "I also include the ID as a stable tie-breaker.", score: 1, depth: 0, created_at: seedStamp("2026-10-01T10:10:00.000Z"), updated_at: seedStamp("2026-10-01T10:10:00.000Z") },
  { _id: "cmt_shared_002", seed_key: seedKey, post_id: "post_shared_001", parent_id: "cmt_shared_001", author_id: "usr_shared_noah", content: "That makes equal timestamps much easier to test.", score: 0, depth: 1, created_at: seedStamp("2026-10-01T10:20:00.000Z"), updated_at: seedStamp("2026-10-01T10:20:00.000Z") },
  { _id: "cmt_shared_003", seed_key: seedKey, post_id: "post_shared_002", parent_id: null, author_id: "usr_shared_ada", content: "The repeated geometry gives this scene a calm rhythm.", score: 1, depth: 0, created_at: seedStamp("2026-10-02T10:15:00.000Z"), updated_at: seedStamp("2026-10-02T10:15:00.000Z") },
  { _id: "cmt_shared_004", seed_key: seedKey, post_id: "post_shared_003", parent_id: null, author_id: "usr_shared_mina", content: "A negative case for invalid input is useful too.", score: 0, depth: 0, created_at: seedStamp("2026-10-03T10:15:00.000Z"), updated_at: seedStamp("2026-10-03T10:15:00.000Z") }
];

const follows = [
  { _id: "flw_shared_ada_mina", seed_key: seedKey, follower_id: "usr_shared_ada", target_user_id: "usr_shared_mina", created_at: seedStamp("2026-09-05T10:00:00.000Z") },
  { _id: "flw_shared_mina_noah", seed_key: seedKey, follower_id: "usr_shared_mina", target_user_id: "usr_shared_noah", created_at: seedStamp("2026-09-06T10:00:00.000Z") },
  { _id: "flw_shared_noah_ada", seed_key: seedKey, follower_id: "usr_shared_noah", target_user_id: "usr_shared_ada", created_at: seedStamp("2026-09-07T10:00:00.000Z") }
];

const memberships = [
  { _id: "mbr_shared_ada_systems", seed_key: seedKey, user_id: "usr_shared_ada", community_id: "comm_shared_systems", created_at: seedStamp("2026-09-08T10:00:00.000Z") },
  { _id: "mbr_shared_mina_systems", seed_key: seedKey, user_id: "usr_shared_mina", community_id: "comm_shared_systems", created_at: seedStamp("2026-09-08T10:05:00.000Z") },
  { _id: "mbr_shared_ada_visuals", seed_key: seedKey, user_id: "usr_shared_ada", community_id: "comm_shared_visuals", created_at: seedStamp("2026-09-09T10:00:00.000Z") },
  { _id: "mbr_shared_noah_visuals", seed_key: seedKey, user_id: "usr_shared_noah", community_id: "comm_shared_visuals", created_at: seedStamp("2026-09-09T10:05:00.000Z") }
];

const votes = [
  { _id: "vote_shared_001_mina", seed_key: seedKey, post_id: "post_shared_001", user_id: "usr_shared_mina", direction: 1, created_at: seedStamp("2026-10-05T10:00:00.000Z"), updated_at: seedStamp("2026-10-05T10:00:00.000Z") },
  { _id: "vote_shared_001_noah", seed_key: seedKey, post_id: "post_shared_001", user_id: "usr_shared_noah", direction: 1, created_at: seedStamp("2026-10-05T10:05:00.000Z"), updated_at: seedStamp("2026-10-05T10:05:00.000Z") },
  { _id: "vote_shared_002_ada", seed_key: seedKey, post_id: "post_shared_002", user_id: "usr_shared_ada", direction: 1, created_at: seedStamp("2026-10-05T10:10:00.000Z"), updated_at: seedStamp("2026-10-05T10:10:00.000Z") },
  { _id: "vote_shared_003_ada", seed_key: seedKey, post_id: "post_shared_003", user_id: "usr_shared_ada", direction: 1, created_at: seedStamp("2026-10-05T10:15:00.000Z"), updated_at: seedStamp("2026-10-05T10:15:00.000Z") },
  { _id: "vote_shared_003_mina", seed_key: seedKey, post_id: "post_shared_003", user_id: "usr_shared_mina", direction: -1, created_at: seedStamp("2026-10-05T10:20:00.000Z"), updated_at: seedStamp("2026-10-05T10:20:00.000Z") }
];

const saves = [
  { _id: "save_shared_002_ada", seed_key: seedKey, post_id: "post_shared_002", user_id: "usr_shared_ada", created_at: seedStamp("2026-10-06T10:00:00.000Z") },
  { _id: "save_shared_001_noah", seed_key: seedKey, post_id: "post_shared_001", user_id: "usr_shared_noah", created_at: seedStamp("2026-10-06T10:05:00.000Z") }
];

const hotScore = (score, createdAt) => {
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  const seconds = createdAt.getTime() / 1000 - 1704067200;
  return Number((sign * order + seconds / 45000).toFixed(7));
};
for (const post of posts) post.hot_score = hotScore(post.score, post.created_at);

// Preflight the complete dataset before the first write. These filters mirror
// the unique indexes in packages/backend/src/db/indexes.ts.
validateSeedDocuments("users", users, [document => ({ username: document.username })]);
validateSeedDocuments("communities", communities, [document => ({ slug: document.slug })]);
validateSeedDocuments("posts", posts);
validateSeedDocuments("comments", comments);
validateSeedDocuments("follows", follows, [document => ({ follower_id: document.follower_id, target_user_id: document.target_user_id })]);
validateSeedDocuments("community_memberships", memberships, [document => ({ user_id: document.user_id, community_id: document.community_id })]);
validateSeedDocuments("post_votes", votes, [document => ({ post_id: document.post_id, user_id: document.user_id })]);
validateSeedDocuments("post_saves", saves, [document => ({ post_id: document.post_id, user_id: document.user_id })]);

insertMissingSeedDocuments("users", users);
insertMissingSeedDocuments("communities", communities);
insertMissingSeedDocuments("posts", posts);
insertMissingSeedDocuments("comments", comments);
insertMissingSeedDocuments("follows", follows);
insertMissingSeedDocuments("community_memberships", memberships);
insertMissingSeedDocuments("post_votes", votes);
insertMissingSeedDocuments("post_saves", saves);

print("Shared local development test data is ready.");
```

## Expected records

| Collection | Seed records |
| --- | ---: |
| `users` | 3 |
| `posts` | 4 |
| `comments` | 4 |
| `follows` | 3 |
| `communities` | 2 |
| `community_memberships` | 4 |
| `post_votes` | 5 |
| `post_saves` | 2 |

The records cover discussion and visual posts, multiple post authors, a two-level comment thread, votes, saved posts, followed users, community feeds, and memberships. The stored post scores match their seeded votes, and the community member counts match their seeded memberships.
