import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectMongo, disconnectMongo, getDb } from '../src/db/mongo.js';
import { connectRedis, disconnectRedis } from '../src/cache/redis.js';
import { requiredTestServiceUrl } from './test-env.js';
import { ensureIndexes } from '../src/db/indexes.js';
import { COLLECTIONS } from '../src/db/collections.js';
import { PostService } from '../src/services/PostService.js';
import { FeedService } from '../src/services/FeedService.js';
import { UserService } from '../src/services/UserService.js';
import { calculateHotScore } from '../src/utils/pagination.js';
import type { PostDoc, UserDoc, FollowDoc, FeedInboxDoc } from '../src/db/types.js';

describe('Feed Delivery Architecture & Dual-Strategy Functional Equivalence', () => {
  let db: any;
  let postService: PostService;
  let feedService: FeedService;
  let userService: UserService;

  beforeAll(async () => {
    await connectMongo(requiredTestServiceUrl('MONGODB_TEST_URI'), 'socialgraph_feed_delivery_test');
    const redis = connectRedis(requiredTestServiceUrl('REDIS_TEST_URL'));
    await redis.connect();
    db = getDb();
    await ensureIndexes(db);

    postService = new PostService(500);
    feedService = new FeedService(500);
    userService = new UserService(500);
  });

  afterAll(async () => {
    try {
      if (db) await db.dropDatabase();
    } finally {
      await disconnectRedis();
      await disconnectMongo();
    }
  });

  beforeEach(async () => {
    // Clean collections before each test for test isolation
    for (const colName of Object.values(COLLECTIONS)) {
      await db.collection(colName).deleteMany({});
    }
  });

  // Helper to create a user
  async function createUser(id: string, username: string) {
    const userDoc: UserDoc = {
      _id: id,
      username,
      display_name: `User ${username}`,
      avatar_url: '/avatars/alex-dev.svg',
      bio: 'Bio',
      is_verified: false,
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
    await db.collection(COLLECTIONS.USERS).insertOne(userDoc);
    return userDoc;
  }

  // Helper to create follow edge directly
  async function createFollowEdge(followerId: string, targetUserId: string) {
    await db.collection(COLLECTIONS.FOLLOWS).insertOne({
      _id: `flw_${followerId}_${targetUserId}`,
      follower_id: followerId,
      target_user_id: targetUserId,
      created_at: new Date(),
    });
  }

  // ==========================================================================
  // 1. Sorting & Deterministic Tie-Breaking
  // ==========================================================================
  describe('1. Sorting & Deterministic Tie-Breaking', () => {
    it('preserves exact ordering between fanout_read and fanout_write for "new" sort', async () => {
      const viewer = await createUser('u_viewer', 'viewer');
      const author = await createUser('u_author', 'author');
      await createFollowEdge(viewer._id, author._id);

      // Create posts across distinct timestamps and tied timestamps
      const baseTime = Date.now();
      for (let i = 0; i < 5; i++) {
        await postService.createPost(
          {
            post_type: 'discussion',
            title: `Post ${i}`,
            content: `Content ${i}`,
          },
          author._id
        );
      }

      const readFeed = await feedService.getFeed(
        { scope: 'following', sort: 'new', strategy: 'fanout_read', limit: 10 },
        viewer._id
      );
      const writeFeed = await feedService.getFeed(
        { scope: 'following', sort: 'new', strategy: 'fanout_write', limit: 10 },
        viewer._id
      );

      expect(readFeed.success).toBe(true);
      expect(writeFeed.success).toBe(true);
      expect(readFeed.data.length).toBe(5);
      expect(writeFeed.data.length).toBe(5);

      const readIds = readFeed.data.map((p) => p.id);
      const writeIds = writeFeed.data.map((p) => p.id);
      expect(writeIds).toEqual(readIds);
    });

    it('preserves exact ordering between fanout_read and fanout_write for "top" sort with upvotes', async () => {
      const viewer = await createUser('u_viewer', 'viewer');
      const voter = await createUser('u_voter', 'voter');
      const author = await createUser('u_author', 'author');
      await createFollowEdge(viewer._id, author._id);

      const p1 = await postService.createPost({ post_type: 'discussion', title: 'Post 1', content: 'C1' }, author._id);
      const p2 = await postService.createPost({ post_type: 'discussion', title: 'Post 2', content: 'C2' }, author._id);
      const p3 = await postService.createPost({ post_type: 'discussion', title: 'Post 3', content: 'C3' }, author._id);

      // Vote on p2 to give it score 1
      await postService.votePost(p2.id, voter._id, 1);

      // Verify inbox copy score is updated
      const inboxP2 = await db.collection(COLLECTIONS.FEED_INBOXES).findOne({ post_id: p2.id, user_id: viewer._id });
      expect(inboxP2?.score).toBe(1);

      const readTop = await feedService.getFeed(
        { scope: 'following', sort: 'top', strategy: 'fanout_read', limit: 10 },
        viewer._id
      );
      const writeTop = await feedService.getFeed(
        { scope: 'following', sort: 'top', strategy: 'fanout_write', limit: 10 },
        viewer._id
      );

      expect(readTop.data.map((p) => p.id)).toEqual([p2.id, p3.id, p1.id]);
      expect(writeTop.data.map((p) => p.id)).toEqual(readTop.data.map((p) => p.id));
    });

    it('preserves exact ordering between fanout_read and fanout_write for "hot" sort', async () => {
      const viewer = await createUser('u_viewer', 'viewer');
      const voter = await createUser('u_voter', 'voter');
      const author = await createUser('u_author', 'author');
      await createFollowEdge(viewer._id, author._id);

      const p1 = await postService.createPost({ post_type: 'discussion', title: 'Hot 1', content: 'C1' }, author._id);
      const p2 = await postService.createPost({ post_type: 'discussion', title: 'Hot 2', content: 'C2' }, author._id);
      // Vote p1 to score 50 so its log10 boost dominates
      for (let v = 0; v < 5; v++) {
        const vt = await createUser(`u_v_${v}`, `v_${v}`);
        await postService.votePost(p1.id, vt._id, 1);
      }

      const readHot = await feedService.getFeed(
        { scope: 'following', sort: 'hot', strategy: 'fanout_read', limit: 10 },
        viewer._id
      );
      const writeHot = await feedService.getFeed(
        { scope: 'following', sort: 'hot', strategy: 'fanout_write', limit: 10 },
        viewer._id
      );

      expect(readHot.data.length).toBe(2);
      expect(writeHot.data.map((p) => p.id)).toEqual(readHot.data.map((p) => p.id));
    });
  });

  // ==========================================================================
  // 2. Multi-Page Cursor Pagination Consistency
  // ==========================================================================
  describe('2. Multi-Page Cursor Pagination Consistency', () => {
    it('paginates across multiple pages without duplicates or missing posts for both strategies', async () => {
      const viewer = await createUser('u_viewer', 'viewer');
      const author = await createUser('u_author', 'author');
      await createFollowEdge(viewer._id, author._id);

      const createdIds: string[] = [];
      for (let i = 0; i < 9; i++) {
        const p = await postService.createPost(
          { post_type: 'discussion', title: `Page Test ${i}`, content: `Content ${i}` },
          author._id
        );
        createdIds.push(p.id);
      }

      // Fan-Out-on-Read multi-page pagination (3 items per page)
      const readCollected: string[] = [];
      let readCursor: string | null = null;
      do {
        const page = await feedService.getFeed(
          { scope: 'following', sort: 'new', strategy: 'fanout_read', limit: 3, cursor: readCursor || undefined },
          viewer._id
        );
        readCollected.push(...page.data.map((p) => p.id));
        readCursor = page.next_cursor;
      } while (readCursor);

      // Fan-Out-on-Write multi-page pagination (3 items per page)
      const writeCollected: string[] = [];
      let writeCursor: string | null = null;
      do {
        const page = await feedService.getFeed(
          { scope: 'following', sort: 'new', strategy: 'fanout_write', limit: 3, cursor: writeCursor || undefined },
          viewer._id
        );
        writeCollected.push(...page.data.map((p) => p.id));
        writeCursor = page.next_cursor;
      } while (writeCursor);

      expect(readCollected.length).toBe(9);
      expect(writeCollected.length).toBe(9);
      // No duplicates in either
      expect(new Set(readCollected).size).toBe(9);
      expect(new Set(writeCollected).size).toBe(9);
      // Exactly identical ordering
      expect(writeCollected).toEqual(readCollected);
    });
  });

  // ==========================================================================
  // 3. Authors Followed by Requesting User & Exclusion of Unfollowed Authors
  // ==========================================================================
  describe('3. Follower Scope & Exclusion of Unfollowed Authors', () => {
    it('only returns posts from followed authors, excluding unrelated authors', async () => {
      const viewer = await createUser('u_viewer', 'viewer');
      const followedAuthor = await createUser('u_followed', 'followed');
      const unfollowedAuthor = await createUser('u_unfollowed', 'unfollowed');

      await createFollowEdge(viewer._id, followedAuthor._id);

      const pFollowed = await postService.createPost(
        { post_type: 'discussion', title: 'Followed Author Post', content: 'C' },
        followedAuthor._id
      );
      const pUnfollowed = await postService.createPost(
        { post_type: 'discussion', title: 'Unfollowed Author Post', content: 'C' },
        unfollowedAuthor._id
      );

      const readFeed = await feedService.getFeed(
        { scope: 'following', strategy: 'fanout_read' },
        viewer._id
      );
      const writeFeed = await feedService.getFeed(
        { scope: 'following', strategy: 'fanout_write' },
        viewer._id
      );

      expect(readFeed.data.map((p) => p.id)).toEqual([pFollowed.id]);
      expect(writeFeed.data.map((p) => p.id)).toEqual([pFollowed.id]);
      expect(writeFeed.data.some((p) => p.id === pUnfollowed.id)).toBe(false);
    });

    it('cleans up inbox entries and removes author posts on unfollow', async () => {
      const viewer = await createUser('u_viewer', 'viewer');
      const author = await createUser('u_author', 'author');

      // Use userService.toggleFollow to follow author
      await userService.toggleFollow(author._id, viewer._id);

      const post = await postService.createPost(
        { post_type: 'discussion', title: 'Author Post', content: 'C' },
        author._id
      );

      // Verify write strategy sees post
      const beforeUnfollow = await feedService.getFeed(
        { scope: 'following', strategy: 'fanout_write' },
        viewer._id
      );
      expect(beforeUnfollow.data.map((p) => p.id)).toContain(post.id);

      // Unfollow author via toggleFollow
      await userService.toggleFollow(author._id, viewer._id);

      // Inbox entries must be deleted
      const inboxEntries = await db.collection(COLLECTIONS.FEED_INBOXES).find({
        user_id: viewer._id,
        author_id: author._id,
      }).toArray();
      expect(inboxEntries.length).toBe(0);

      // Both strategies now return empty
      const afterRead = await feedService.getFeed({ scope: 'following', strategy: 'fanout_read' }, viewer._id);
      const afterWrite = await feedService.getFeed({ scope: 'following', strategy: 'fanout_write' }, viewer._id);
      expect(afterRead.data.length).toBe(0);
      expect(afterWrite.data.length).toBe(0);
    });

    it('delivers author existing posts to new follower on follow', async () => {
      const viewer = await createUser('u_viewer', 'viewer');
      const author = await createUser('u_author', 'author');

      // Author creates post BEFORE viewer follows
      const post = await postService.createPost(
        { post_type: 'discussion', title: 'Pre-existing post', content: 'Content' },
        author._id
      );

      // Viewer follows author
      await userService.toggleFollow(author._id, viewer._id);

      // Verify post was delivered into viewer's inbox
      const inboxDoc = await db.collection(COLLECTIONS.FEED_INBOXES).findOne({
        user_id: viewer._id,
        post_id: post.id,
      });
      expect(inboxDoc).toBeTruthy();

      const feed = await feedService.getFeed({ scope: 'following', strategy: 'fanout_write' }, viewer._id);
      expect(feed.data.map((p) => p.id)).toContain(post.id);
    });

    it('handles concurrent follow, unfollow, and post operations without duplicate deliveries or orphaned entries', async () => {
      const author = await createUser('u_active_author', 'activeauthor');
      const followerA = await createUser('u_follower_a', 'followera');
      const followerB = await createUser('u_follower_b', 'followerb');

      // 1. Initial follow by follower A
      await userService.toggleFollow(author._id, followerA._id);

      // 2. Concurrently:
      // - author creates post 1
      // - follower B follows author
      // - follower A unfollows author
      await Promise.all([
        postService.createPost({ post_type: 'discussion', title: 'Concurrent Post 1', content: 'C1' }, author._id),
        userService.toggleFollow(author._id, followerB._id),
        userService.toggleFollow(author._id, followerA._id),
      ]);

      // 3. Author creates post 2
      const p2 = await postService.createPost({ post_type: 'discussion', title: 'Concurrent Post 2', content: 'C2' }, author._id);

      // Authorization guarantee: even if an inbox write races with an unfollow,
      // FeedService's active follow check strictly ensures follower A sees 0 posts from author
      const feedA = await feedService.getFeed({ scope: 'following', strategy: 'fanout_write' }, followerA._id);
      expect(feedA.data.length).toBe(0);

      // Verify follower B (active follower): has p2, zero duplicate inbox documents for any post
      const inboxesB = await db.collection(COLLECTIONS.FEED_INBOXES).find({ user_id: followerB._id }).toArray();
      const postIdsB = inboxesB.map((i: any) => i.post_id);
      expect(new Set(postIdsB).size).toBe(postIdsB.length); // strictly unique
      const feedB = await feedService.getFeed({ scope: 'following', strategy: 'fanout_write' }, followerB._id);
      expect(feedB.data.map((p) => p.id)).toContain(p2.id);
    });
  });

  // ==========================================================================
  // 4. Posts Created Before Inbox Fan-Out Was Enabled & Safe Path Backfill
  // ==========================================================================
  describe('4. Posts Created Before Fan-Out & Safe Path Backfill', () => {
    it('backfills existing posts into inboxes and achieves full equivalence', async () => {
      const viewer = await createUser('u_viewer', 'viewer');
      const author = await createUser('u_author', 'author');
      await createFollowEdge(viewer._id, author._id);

      // Insert post directly into posts collection (simulating post created before FOOW was enabled)
      const now = new Date();
      const legacyPost: PostDoc = {
        _id: 'post_legacy_101',
        post_type: 'discussion',
        author_id: author._id,
        title: 'Legacy Post Title',
        content: 'Legacy Content',
        score: 5,
        hot_score: calculateHotScore(5, now),
        comments_count: 0,
        created_at: now,
        updated_at: now,
      };
      await db.collection(COLLECTIONS.POSTS).insertOne(legacyPost);

      // Prior to backfill, FOOW inbox has 0 items
      const beforeBackfill = await feedService.getFeed(
        { scope: 'following', strategy: 'fanout_write' },
        viewer._id
      );
      expect(beforeBackfill.data.length).toBe(0);

      // Run backfill utility
      const inserted = await feedService.backfillInboxes({ followerId: viewer._id });
      expect(inserted).toBe(1);

      // Now both strategies return identical results
      const readFeed = await feedService.getFeed({ scope: 'following', strategy: 'fanout_read' }, viewer._id);
      const writeFeed = await feedService.getFeed({ scope: 'following', strategy: 'fanout_write' }, viewer._id);
      expect(readFeed.data.map((p) => p.id)).toEqual(['post_legacy_101']);
      expect(writeFeed.data.map((p) => p.id)).toEqual(['post_legacy_101']);
    });
  });

  // ==========================================================================
  // 5. Content Deletion Cascade & Moderation
  // ==========================================================================
  describe('5. Content Deletion Cascade & Moderation', () => {
    it('deletes inbox entries when post is deleted and filters out stale references', async () => {
      const viewer = await createUser('u_viewer', 'viewer');
      const author = await createUser('u_author', 'author');
      await createFollowEdge(viewer._id, author._id);

      const post = await postService.createPost(
        { post_type: 'discussion', title: 'Post to delete', content: 'Content' },
        author._id
      );

      // Verify inbox has delivery
      const beforeDelete = await db.collection(COLLECTIONS.FEED_INBOXES).countDocuments({ post_id: post.id });
      expect(beforeDelete).toBe(1);

      // Delete post
      await postService.deletePost(post.id, author._id);

      // Inbox delivery must be deleted
      const afterDelete = await db.collection(COLLECTIONS.FEED_INBOXES).countDocuments({ post_id: post.id });
      expect(afterDelete).toBe(0);

      const writeFeed = await feedService.getFeed(
        { scope: 'following', strategy: 'fanout_write' },
        viewer._id
      );
      expect(writeFeed.data.length).toBe(0);
    });
  });

  // ==========================================================================
  // 6. Follower Boundary Testing: 0, Exactly 500, and >500 Followers
  // ==========================================================================
  describe('6. Follower Boundary Testing (0, 500, >500 followers)', () => {
    it('handles author with 0 followers without writing to inboxes', async () => {
      const author = await createUser('u_lonely', 'lonely');
      const post = await postService.createPost(
        { post_type: 'discussion', title: 'Zero followers post', content: 'No one sees this yet' },
        author._id
      );
      const inboxCount = await db.collection(COLLECTIONS.FEED_INBOXES).countDocuments({ post_id: post.id });
      expect(inboxCount).toBe(0);
    });

    it('fans out on write for author with exactly 500 followers (threshold boundary)', async () => {
      const customPostService = new PostService(500);
      const author = await createUser('u_boundary_500', 'boundary500');

      // Create 500 follower records
      const followsDocs = Array.from({ length: 500 }, (_, i) => ({
        _id: `flw_b_${i}_${author._id}`,
        follower_id: `u_bench_${i}`,
        target_user_id: author._id,
        created_at: new Date(),
      }));
      await db.collection(COLLECTIONS.FOLLOWS).insertMany(followsDocs);

      const post = await customPostService.createPost(
        { post_type: 'discussion', title: 'Boundary 500 Post', content: 'Testing boundary' },
        author._id
      );

      // Inboxes must contain all 500 deliveries
      const inboxes = await db.collection(COLLECTIONS.FEED_INBOXES).countDocuments({ post_id: post.id });
      expect(inboxes).toBe(500);
    });

    it('prevents duplicates and preserves correct ordering when author crosses threshold from standard to celebrity', async () => {
      const testThreshold = 5;
      const customPostService = new PostService(testThreshold);
      const customFeedService = new FeedService(testThreshold);
      const customUserService = new UserService(testThreshold);

      const author = await createUser('u_rising_star', 'risingstar');
      const viewer = await createUser('u_early_fan', 'earlyfan');

      // 1. Viewer follows author when author is small (1 follower)
      await customUserService.toggleFollow(author._id, viewer._id);

      // 2. Author creates Post 1 while <= 5 followers (inbox fan-out occurs)
      const p1 = await customPostService.createPost(
        { post_type: 'discussion', title: 'Post 1 (Early Days)', content: 'Hello early fans' },
        author._id
      );

      // Verify inbox has delivery for p1
      const inboxP1 = await db.collection(COLLECTIONS.FEED_INBOXES).findOne({ user_id: viewer._id, post_id: p1.id });
      expect(inboxP1).toBeTruthy();

      // 3. Author gains 5 more followers (total = 6, crossing threshold > 5)
      for (let i = 0; i < 5; i++) {
        const extraFollower = await createUser(`u_extra_fan_${i}`, `extrafan${i}`);
        await customUserService.toggleFollow(author._id, extraFollower._id);
      }

      // 4. Author creates Post 2 while > 5 followers (celebrity status, no inbox fan-out)
      const p2 = await customPostService.createPost(
        { post_type: 'discussion', title: 'Post 2 (Famous Now)', content: 'Hello world' },
        author._id
      );

      // Verify p2 did NOT fan out to viewer's inbox
      const inboxP2 = await db.collection(COLLECTIONS.FEED_INBOXES).findOne({ user_id: viewer._id, post_id: p2.id });
      expect(inboxP2).toBeNull();

      // 5. Read feed in both strategies
      const readFeed = await customFeedService.getFeed(
        { scope: 'following', sort: 'new', strategy: 'fanout_read' },
        viewer._id
      );
      const writeFeed = await customFeedService.getFeed(
        { scope: 'following', sort: 'new', strategy: 'fanout_write' },
        viewer._id
      );

      // Both feeds must contain exactly [p2.id, p1.id] with ZERO duplicates
      expect(readFeed.data.map((p) => p.id)).toEqual([p2.id, p1.id]);
      expect(writeFeed.data.map((p) => p.id)).toEqual([p2.id, p1.id]);
      expect(new Set(writeFeed.data.map((p) => p.id)).size).toBe(2);
    });

    it('does NOT fan out on write for author with >500 followers, and resolves via hybrid read merge', async () => {
      // Configure threshold to 5 for fast test execution
      const testThreshold = 5;
      const customPostService = new PostService(testThreshold);
      const customFeedService = new FeedService(testThreshold);

      const celebrity = await createUser('u_celeb', 'celeb');
      const viewer = await createUser('u_viewer_celeb', 'viewerceleb');

      // Add 6 followers (> 5 threshold) to celebrity
      const followDocs = [
        { _id: `flw_${viewer._id}_${celebrity._id}`, follower_id: viewer._id, target_user_id: celebrity._id, created_at: new Date() },
        ...Array.from({ length: 5 }, (_, i) => ({
          _id: `flw_extra_${i}_${celebrity._id}`,
          follower_id: `u_extra_${i}`,
          target_user_id: celebrity._id,
          created_at: new Date(),
        })),
      ];
      await db.collection(COLLECTIONS.FOLLOWS).insertMany(followDocs);

      // Celebrity posts
      const celebPost = await customPostService.createPost(
        { post_type: 'discussion', title: 'Celebrity Post', content: 'I have many followers' },
        celebrity._id
      );

      // Bounded fan-out check: NO inbox docs should be written for this post
      const celebInboxCount = await db.collection(COLLECTIONS.FEED_INBOXES).countDocuments({ post_id: celebPost.id });
      expect(celebInboxCount).toBe(0);

      // Read baseline (FOOR) and write (FOOW hybrid merge) must both include the post
      const readFeed = await customFeedService.getFeed(
        { scope: 'following', strategy: 'fanout_read' },
        viewer._id
      );
      const writeFeed = await customFeedService.getFeed(
        { scope: 'following', strategy: 'fanout_write' },
        viewer._id
      );

      expect(readFeed.data.map((p) => p.id)).toEqual([celebPost.id]);
      expect(writeFeed.data.map((p) => p.id)).toEqual([celebPost.id]);
    });
  });

  // ==========================================================================
  // 7. Transaction Rollback When Fan-Out Fails
  // ==========================================================================
  describe('7. Transaction Rollback & Atomicity', () => {
    it('rolls back post creation and user posts_count when fan-out inbox write fails', async () => {
      const viewer = await createUser('u_viewer', 'viewer');
      const author = await createUser('u_author', 'author');
      await createFollowEdge(viewer._id, author._id);

      // Mock Collection.prototype.insertMany to throw an error inside transaction for feed_inboxes
      const CollectionProto = Object.getPrototypeOf(db.collection(COLLECTIONS.FEED_INBOXES));
      const originalInsertMany = CollectionProto.insertMany;
      CollectionProto.insertMany = async function (this: any, ...args: any[]) {
        if (this.collectionName === COLLECTIONS.FEED_INBOXES) {
          throw new Error('Simulated database write failure during fan-out');
        }
        return originalInsertMany.apply(this, args);
      };

      try {
        await expect(
          postService.createPost(
            { post_type: 'discussion', title: 'Will Fail', content: 'Content' },
            author._id
          )
        ).rejects.toThrow('Simulated database write failure during fan-out');

        // Confirm rollback: 0 posts inserted, author posts_count remains 0
        const postCount = await db.collection(COLLECTIONS.POSTS).countDocuments({ author_id: author._id });
        expect(postCount).toBe(0);

        const updatedAuthor = await db.collection(COLLECTIONS.USERS).findOne({ _id: author._id });
        expect(updatedAuthor?.posts_count).toBe(0);
      } finally {
        CollectionProto.insertMany = originalInsertMany;
      }
    });
  });

  // ==========================================================================
  // 8. Deduplication & Idempotent Retries
  // ==========================================================================
  describe('8. Deduplication & Idempotent Retries', () => {
    it('enforces unique compound index on (user_id, post_id) preventing duplicate timeline deliveries', async () => {
      const doc1: FeedInboxDoc = {
        _id: 'inbox_u1_p1',
        user_id: 'u1',
        post_id: 'p1',
        author_id: 'a1',
        post_type: 'discussion',
        created_at: new Date(),
        score: 0,
        hot_score: 0,
      };
      await db.collection(COLLECTIONS.FEED_INBOXES).insertOne(doc1);

      // Attempting to insert duplicate user_id + post_id must throw code 11000
      await expect(
        db.collection(COLLECTIONS.FEED_INBOXES).insertOne({
          ...doc1,
          _id: 'inbox_u1_p1_duplicate_id',
        })
      ).rejects.toThrow(/E11000/);
    });

    it('returns existing post without duplicate fan-out on idempotent retry', async () => {
      const viewer = await createUser('u_viewer', 'viewer');
      const author = await createUser('u_author', 'author');
      await createFollowEdge(viewer._id, author._id);

      const idempotencyKey = 'idemp_key_123';
      const p1 = await postService.createPost(
        { post_type: 'discussion', title: 'Idempotent Post', content: 'Testing retries' },
        author._id,
        idempotencyKey
      );

      // Retry with same idempotency key
      const p2 = await postService.createPost(
        { post_type: 'discussion', title: 'Idempotent Post', content: 'Testing retries' },
        author._id,
        idempotencyKey
      );

      expect(p2.id).toBe(p1.id);

      // Only 1 post in posts collection
      const postCount = await db.collection(COLLECTIONS.POSTS).countDocuments({ author_id: author._id });
      expect(postCount).toBe(1);

      // Only 1 inbox delivery in feed_inboxes
      const inboxCount = await db.collection(COLLECTIONS.FEED_INBOXES).countDocuments({ post_id: p1.id });
      expect(inboxCount).toBe(1);
    });
  });
});
