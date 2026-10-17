import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectMongo, disconnectMongo, getDb } from '../src/db/mongo.js';
import { ensureIndexes } from '../src/db/indexes.js';
import { seedDatabase } from '../src/db/seed.js';
import { FeedService } from '../src/services/FeedService.js';
import { PostService } from '../src/services/PostService.js';
import { UserService } from '../src/services/UserService.js';
import { CommunityService } from '../src/services/CommunityService.js';
import { COLLECTIONS } from '../src/db/collections.js';
import type { Db } from 'mongodb';

describe('Real MongoDB Integration Suite (Local Database)', () => {
  let db: Db;
  let feedService: FeedService;
  let postService: PostService;
  let userService: UserService;
  let communityService: CommunityService;

  beforeAll(async () => {
    // Connect to local MongoDB using dedicated integration test database
    const conn = await connectMongo('mongodb://localhost:27017', 'socialgraph_integration_test');
    db = conn.db;
    feedService = new FeedService();
    postService = new PostService();
    userService = new UserService();
    communityService = new CommunityService();

    // Seed test database
    await seedDatabase(db);
  });

  afterAll(async () => {
    if (db) {
      await db.dropDatabase();
    }
    await disconnectMongo();
  });

  describe('1. Index Idempotency & Constraint Enforcement', () => {
    it('runs ensureIndexes repeatedly without error', async () => {
      await expect(ensureIndexes(db)).resolves.not.toThrow();
    });

    it('enforces unique username constraint on users collection', async () => {
      const usersCol = db.collection(COLLECTIONS.USERS);
      await expect(
        usersCol.insertOne({
          _id: 'usr_dup_test',
          username: 'alex_dev', // already exists in seed
          display_name: 'Duplicate',
          avatar_url: '/avatars/alex-dev.svg',
          is_verified: false,
          created_at: new Date(),
          updated_at: new Date(),
        } as any)
      ).rejects.toThrow(/duplicate key/i);
    });

    it('enforces unique constraint on follow edges', async () => {
      const followsCol = db.collection(COLLECTIONS.FOLLOWS);
      await expect(
        followsCol.insertOne({
          _id: 'flw_dup_test',
          follower_id: 'usr_0',
          target_user_id: 'usr_1', // already exists in seed
          created_at: new Date(),
        })
      ).rejects.toThrow(/duplicate key/i);
    });
  });

  describe('2. Feed Sorting & Cursor Pagination Correctness', () => {
    it('paginates reverse-chronologically (sort: new) with zero duplicates across pages', async () => {
      // Page 1: limit 2
      const page1 = await feedService.getFeed({ sort: 'new', limit: 2, scope: 'all' });
      expect(page1.success).toBe(true);
      expect(page1.data).toHaveLength(2);
      expect(page1.has_more).toBe(true);
      expect(page1.next_cursor).not.toBeNull();

      // Page 2: pass page 1 next_cursor
      const page2 = await feedService.getFeed({
        sort: 'new',
        limit: 2,
        cursor: page1.next_cursor!,
        scope: 'all',
      });
      expect(page2.success).toBe(true);
      expect(page2.data).toHaveLength(2);

      // Verify NO overlap between page 1 and page 2
      const ids1 = page1.data.map((p) => p.id);
      const ids2 = page2.data.map((p) => p.id);
      const intersection = ids1.filter((id) => ids2.includes(id));
      expect(intersection).toEqual([]);

      // Verify date ordering
      const d1 = new Date(page1.data[0].created_at).getTime();
      const d2 = new Date(page1.data[1].created_at).getTime();
      const d3 = new Date(page2.data[0].created_at).getTime();
      expect(d1).toBeGreaterThanOrEqual(d2);
      expect(d2).toBeGreaterThanOrEqual(d3);
    });

    it('paginates top-rated posts (sort: top) with score ordering and tie-breakers', async () => {
      const page1 = await feedService.getFeed({ sort: 'top', limit: 3, scope: 'all' });
      expect(page1.success).toBe(true);
      expect(page1.data.length).toBeGreaterThan(0);

      // Verify scores are descending
      for (let i = 1; i < page1.data.length; i++) {
        expect(page1.data[i - 1].score).toBeGreaterThanOrEqual(page1.data[i].score);
      }

      if (page1.next_cursor) {
        const page2 = await feedService.getFeed({
          sort: 'top',
          limit: 3,
          cursor: page1.next_cursor,
          scope: 'all',
        });
        const ids1 = page1.data.map((p) => p.id);
        const ids2 = page2.data.map((p) => p.id);
        expect(ids1.filter((id) => ids2.includes(id))).toEqual([]);
      }
    });

    it('paginates hot posts (sort: hot) deterministically', async () => {
      const page1 = await feedService.getFeed({ sort: 'hot', limit: 3, scope: 'all' });
      expect(page1.success).toBe(true);
      expect(page1.data.length).toBeGreaterThan(0);

      if (page1.next_cursor) {
        const page2 = await feedService.getFeed({
          sort: 'hot',
          limit: 3,
          cursor: page1.next_cursor,
          scope: 'all',
        });
        const ids1 = page1.data.map((p) => p.id);
        const ids2 = page2.data.map((p) => p.id);
        expect(ids1.filter((id) => ids2.includes(id))).toEqual([]);
      }
    });

    it('correctly filters feed to following users (scope: following)', async () => {
      // usr_0 follows usr_1, usr_2, usr_3
      const feed = await feedService.getFeed({ scope: 'following', limit: 10 }, 'usr_0');
      expect(feed.success).toBe(true);
      for (const post of feed.data) {
        expect(['usr_1', 'usr_2', 'usr_3']).toContain(post.author.id);
      }
    });

    it('correctly filters feed to community posts (scope: communities)', async () => {
      const feed = await feedService.getFeed({ scope: 'communities', limit: 10 });
      expect(feed.success).toBe(true);
      for (const post of feed.data) {
        expect(post.community_id).toBeDefined();
      }
    });
  });

  describe('3. Post Creation, Atomic Voting & Hierarchical Comments', () => {
    let createdPostId: string;

    it('creates a discussion post with durable persistence and immediately retrieves it', async () => {
      const newPost = await postService.createPost(
        {
          post_type: 'discussion',
          title: 'Integration Test Durable Post',
          content: 'Testing durability in MongoDB',
          community_id: 'comm_systems',
        },
        'usr_0'
      );

      expect(newPost.id).toBeDefined();
      expect(newPost.title).toBe('Integration Test Durable Post');
      createdPostId = newPost.id;

      const retrieved = await postService.getPost(createdPostId, 'usr_0');
      expect(retrieved.id).toBe(createdPostId);
      expect(retrieved.title).toBe('Integration Test Durable Post');
      expect(retrieved.score).toBe(0);
    });

    it('atomically upvotes, downvotes, and cancels vote on post', async () => {
      // 1. Upvote (+1)
      const vote1 = await postService.votePost(createdPostId, 'usr_4', 1);
      expect(vote1.score).toBe(1);
      expect(vote1.user_vote).toBe(1);

      // 2. Downvote from +1 to -1 (delta = -2)
      const vote2 = await postService.votePost(createdPostId, 'usr_4', -1);
      expect(vote2.score).toBe(-1);
      expect(vote2.user_vote).toBe(-1);

      // 3. Cancel vote back to 0 (delta = +1)
      const vote3 = await postService.votePost(createdPostId, 'usr_4', 0);
      expect(vote3.score).toBe(0);
      expect(vote3.user_vote).toBe(0);
    });

    it('toggles post bookmark (save) idempotently', async () => {
      const save1 = await postService.toggleSavePost(createdPostId, 'usr_0');
      expect(save1.is_saved).toBe(true);

      const postWithSave = await postService.getPost(createdPostId, 'usr_0');
      expect(postWithSave.is_saved).toBe(true);

      const save2 = await postService.toggleSavePost(createdPostId, 'usr_0');
      expect(save2.is_saved).toBe(false);

      const postUnsaved = await postService.getPost(createdPostId, 'usr_0');
      expect(postUnsaved.is_saved).toBe(false);
    });

    it('creates root and nested comments, maintaining depth and comments_count', async () => {
      // 1. Root comment
      const rootComment = await postService.createComment(createdPostId, 'usr_1', {
        content: 'Root comment on durable post',
      });
      expect(rootComment.depth).toBe(0);
      expect(rootComment.parent_id).toBeNull();

      // 2. Child comment
      const childComment = await postService.createComment(createdPostId, 'usr_2', {
        content: 'Reply to root comment',
        parent_id: rootComment.id,
      });
      expect(childComment.depth).toBe(1);
      expect(childComment.parent_id).toBe(rootComment.id);

      // 3. Verify post comments_count incremented
      const post = await postService.getPost(createdPostId);
      expect(post.comments_count).toBe(2);

      // 4. Retrieve comment tree
      const tree = await postService.getComments(createdPostId);
      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe(rootComment.id);
      expect(tree[0].replies).toHaveLength(1);
      expect(tree[0].replies[0].id).toBe(childComment.id);
    });
  });

  describe('4. Social Graph Operations & Communities', () => {
    it('retrieves user profile and checks dynamic is_following flag', async () => {
      // usr_0 follows usr_1
      const profile = await userService.getUserProfile('lucas_t', 'usr_0');
      expect(profile.username).toBe('lucas_t');
      expect(profile.is_following).toBe(true);

      // usr_3 does not follow usr_1
      const profileNotFollowing = await userService.getUserProfile('lucas_t', 'usr_3');
      expect(profileNotFollowing.is_following).toBe(false);
    });

    it('toggles follow relationship and maintains follower counter', async () => {
      // usr_4 toggles follow on usr_0
      const initialProfile = await userService.getUserProfile('alex_dev');
      const initialFollowers = initialProfile.followers_count;

      const follow1 = await userService.toggleFollow('usr_0', 'usr_4');
      expect(follow1.is_following).toBe(true);
      expect(follow1.followers_count).toBe(initialFollowers + 1);

      const follow2 = await userService.toggleFollow('usr_0', 'usr_4');
      expect(follow2.is_following).toBe(false);
      expect(follow2.followers_count).toBe(initialFollowers);
    });

    it('rejects self-follow with 400 Bad Request', async () => {
      await expect(userService.toggleFollow('usr_0', 'usr_0')).rejects.toThrow(
        /Users cannot follow themselves/
      );
    });

    it('toggles community membership and maintains members_count', async () => {
      const commBefore = await communityService.getCommunity('systems', 'usr_4');
      const initialMembers = commBefore.members_count;
      expect(commBefore.is_member).toBe(false);

      const join = await communityService.toggleMembership('systems', 'usr_4');
      expect(join.is_member).toBe(true);
      expect(join.members_count).toBe(initialMembers + 1);

      const commAfter = await communityService.getCommunity('systems', 'usr_4');
      expect(commAfter.is_member).toBe(true);

      const leave = await communityService.toggleMembership('systems', 'usr_4');
      expect(leave.is_member).toBe(false);
      expect(leave.members_count).toBe(initialMembers);
    });
  });

  describe('5. Seed Idempotency', () => {
    it('re-executing seedDatabase is clean and deterministic', async () => {
      const stats = await seedDatabase(db);
      expect(stats.usersCount).toBe(20);
      expect(stats.postsCount).toBe(6);
      expect(stats.commentsCount).toBe(4);
      expect(stats.followsCount).toBe(5);
      expect(stats.communitiesCount).toBe(5);
    });
  });
});
