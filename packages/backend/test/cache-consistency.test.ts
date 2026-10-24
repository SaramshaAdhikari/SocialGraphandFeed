import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import type { Db } from 'mongodb';
import type { Redis } from 'ioredis';
import { connectMongo, disconnectMongo, getDb } from '../src/db/mongo.js';
import { connectRedis, disconnectRedis, getRedisClient } from '../src/cache/redis.js';
import { seedDatabase } from '../src/db/seed.js';
import { UserService } from '../src/services/UserService.js';
import { PostService } from '../src/services/PostService.js';
import { CommunityService } from '../src/services/CommunityService.js';
import { requiredTestServiceUrl } from './test-env.js';
import { AppError } from '@socialgraph/shared';

describe('Redis Cache Consistency & Invalidation Suite', () => {
  let db: Db;
  let redis: Redis;
  let userService: UserService;
  let postService: PostService;
  let communityService: CommunityService;

  beforeAll(async () => {
    const conn = await connectMongo(
      requiredTestServiceUrl('MONGODB_TEST_URI'),
      'socialgraph_cache_consistency_test'
    );
    db = conn.db;

    redis = connectRedis(requiredTestServiceUrl('REDIS_TEST_URL'));
    if (redis.status === 'wait') await redis.connect().catch(() => {});
    await redis.flushdb().catch(() => {});

    userService = new UserService();
    postService = new PostService();
    communityService = new CommunityService();

    await seedDatabase(db);
  });

  afterAll(async () => {
    if (db) {
      await db.dropDatabase().catch(() => {});
    }
    if (redis) {
      await redis.flushdb().catch(() => {});
    }
    await disconnectMongo();
    await disconnectRedis();
  });

  beforeEach(async () => {
    // Clean cache keys before each test for deterministic assertions
    await redis.flushdb().catch(() => {});
  });

  describe('1. User Profile Caching and Social Graph Invalidation', () => {
    it('caches user profile in Redis on first read and hits cache on subsequent read', async () => {
      const username = 'alex_dev';
      const cacheKey = `cache:user:profile:${username}:anon`;

      // Verify no key before read
      const beforeRead = await redis.get(cacheKey);
      expect(beforeRead).toBeNull();

      // First read: reads from DB and populates Redis
      const profile1 = await userService.getUserProfile(username);
      expect(profile1.username).toBe(username);

      // Verify key exists in Redis with TTL
      const cachedRaw = await redis.get(cacheKey);
      expect(cachedRaw).not.toBeNull();
      const parsed = JSON.parse(cachedRaw!);
      expect(parsed.username).toBe(username);
      expect(parsed.followers_count).toBe(profile1.followers_count);

      const ttl = await redis.ttl(cacheKey);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(30);

      // Verify tag set tracks the viewer key
      const tagKey = `cache:user:profile:${username}:_keys`;
      const trackedKeys = await redis.smembers(tagKey);
      expect(trackedKeys).toContain(cacheKey);

      // Second read: served from cache
      const profile2 = await userService.getUserProfile(username);
      expect(profile2).toEqual(profile1);
    });

    it('invalidates target and follower profile caches on follow toggle while preserving unrelated caches', async () => {
      // Setup: cache alex_dev (usr_0), lucas_t (usr_1), and elena_arch (usr_2)
      await userService.getUserProfile('alex_dev', 'usr_4'); // usr_4 viewing alex_dev
      await userService.getUserProfile('lucas_t', 'usr_4'); // usr_4 viewing lucas_t (follower)
      await userService.getUserProfile('elena_arch'); // unrelated user

      expect(await redis.get('cache:user:profile:alex_dev:u:usr_4')).not.toBeNull();
      expect(await redis.get('cache:user:profile:lucas_t:u:usr_4')).not.toBeNull();
      expect(await redis.get('cache:user:profile:elena_arch:anon')).not.toBeNull();

      // Mutation: usr_4 toggles follow on alex_dev (usr_0)
      const res = await userService.toggleFollow('usr_0', 'usr_4');
      expect(res.target_user_id).toBe('usr_0');

      // Assertions:
      // 1. alex_dev profile cache MUST be evicted
      expect(await redis.get('cache:user:profile:alex_dev:u:usr_4')).toBeNull();
      // 2. unrelated elena_arch profile cache MUST remain intact
      expect(await redis.get('cache:user:profile:elena_arch:anon')).not.toBeNull();

      // 3. Fresh fetch of alex_dev profile reflects new followers count
      const updatedProfile = await userService.getUserProfile('alex_dev', 'usr_4');
      expect(updatedProfile.followers_count).toBe(res.followers_count);
      expect(updatedProfile.is_following).toBe(res.is_following);
    });

    it('invalidates both profiles on setFollow', async () => {
      // Pre-populate caches
      await userService.getUserProfile('lucas_t', 'usr_6');
      expect(await redis.get('cache:user:profile:lucas_t:u:usr_6')).not.toBeNull();

      // Mutate via setFollow
      await userService.setFollow('usr_1', 'usr_6', true);

      // Cache for lucas_t should be invalidated
      expect(await redis.get('cache:user:profile:lucas_t:u:usr_6')).toBeNull();

      const freshProfile = await userService.getUserProfile('lucas_t', 'usr_6');
      expect(freshProfile.is_following).toBe(true);
    });

    it('invalidates author profile cache when author creates a post', async () => {
      // Cache author's profile
      const initialProfile = await userService.getUserProfile('alex_dev');
      const startPostsCount = initialProfile.posts_count;
      expect(await redis.get('cache:user:profile:alex_dev:anon')).not.toBeNull();

      // Author creates a post
      await postService.createPost(
        {
          post_type: 'discussion',
          title: 'Cache Invalidation Post',
          content: 'Verifying posts_count cache invalidation',
        },
        'usr_0' // alex_dev
      );

      // Author's profile cache MUST be invalidated
      expect(await redis.get('cache:user:profile:alex_dev:anon')).toBeNull();

      // Fresh profile fetch reflects updated posts_count
      const refreshedProfile = await userService.getUserProfile('alex_dev');
      expect(refreshedProfile.posts_count).toBe(startPostsCount + 1);
    });
  });

  describe('2. Post Caching and Interaction Invalidation', () => {
    it('caches post on read and serves subsequent read from Redis', async () => {
      const postId = 'post_101';
      const cacheKey = `cache:post:${postId}:u:usr_0`;

      // Read post
      const post1 = await postService.getPost(postId, 'usr_0');
      expect(post1.id).toBe(postId);

      // Cache key exists
      const cached = await redis.get(cacheKey);
      expect(cached).not.toBeNull();
      expect(JSON.parse(cached!).title).toBe(post1.title);

      // Tag key exists and tracks viewer
      const tagKey = `cache:post:${postId}:_keys`;
      const tracked = await redis.smembers(tagKey);
      expect(tracked).toContain(cacheKey);
    });

    it('invalidates post cache on vote and reflects updated score and hot_score', async () => {
      const postId = 'post_101';
      const unrelatedPostId = 'post_102';

      // Seed caches
      await postService.getPost(postId, 'usr_3');
      await postService.getPost(unrelatedPostId, 'usr_3');

      expect(await redis.get(`cache:post:${postId}:u:usr_3`)).not.toBeNull();
      expect(await redis.get(`cache:post:${unrelatedPostId}:u:usr_3`)).not.toBeNull();

      // Vote on post_101
      const voteRes = await postService.votePost(postId, 'usr_3', 1);

      // post_101 cache MUST be invalidated
      expect(await redis.get(`cache:post:${postId}:u:usr_3`)).toBeNull();
      // post_102 cache MUST remain intact
      expect(await redis.get(`cache:post:${unrelatedPostId}:u:usr_3`)).not.toBeNull();

      // Subsequent read reflects updated score
      const freshPost = await postService.getPost(postId, 'usr_3');
      expect(freshPost.score).toBe(voteRes.new_score);
      expect(freshPost.user_vote).toBe(1);
    });

    it('invalidates post cache on bookmark toggle and reflects updated is_saved', async () => {
      const postId = 'post_101';
      const userId = 'usr_5';

      // Populate cache
      const initial = await postService.getPost(postId, userId);
      expect(initial.is_saved).toBe(false);
      expect(await redis.get(`cache:post:${postId}:u:${userId}`)).not.toBeNull();

      // Toggle bookmark
      const saveRes = await postService.toggleSavePost(postId, userId);
      expect(saveRes.is_saved).toBe(true);

      // Cache is invalidated
      expect(await redis.get(`cache:post:${postId}:u:${userId}`)).toBeNull();

      // Fresh read shows is_saved = true
      const fresh = await postService.getPost(postId, userId);
      expect(fresh.is_saved).toBe(true);
    });

    it('invalidates post cache on comment creation and reflects updated comments_count', async () => {
      const postId = 'post_101';
      const initialPost = await postService.getPost(postId);
      const startComments = initialPost.comments_count;

      expect(await redis.get(`cache:post:${postId}:anon`)).not.toBeNull();

      // Create a comment
      await postService.createComment(postId, 'usr_0', {
        content: 'Testing cache invalidation on comment addition',
      });

      // Post cache is invalidated
      expect(await redis.get(`cache:post:${postId}:anon`)).toBeNull();

      // Fresh read shows incremented comments_count
      const refreshedPost = await postService.getPost(postId);
      expect(refreshedPost.comments_count).toBe(startComments + 1);
    });
  });

  describe('3. Community Caching and Membership Invalidation', () => {
    it('caches community and community list, and invalidates both on membership change', async () => {
      const slug = 'systems';
      const userId = 'usr_5';

      // Read single community and list
      const comm1 = await communityService.getCommunity(slug, userId);
      const list1 = await communityService.getCommunities(userId);

      expect(comm1.slug).toBe(slug);
      expect(list1.length).toBeGreaterThan(0);

      const commCacheKey = `cache:community:${slug}:u:${userId}`;
      const listCacheKey = `cache:communities:${userId}`;

      expect(await redis.get(commCacheKey)).not.toBeNull();
      expect(await redis.get(listCacheKey)).not.toBeNull();

      // Mutate membership
      const targetState = !comm1.is_member;
      await communityService.setMembership(slug, userId, targetState);

      // Both caches MUST be invalidated
      expect(await redis.get(commCacheKey)).toBeNull();
      expect(await redis.get(listCacheKey)).toBeNull();

      // Fresh reads reflect the state transition
      const comm2 = await communityService.getCommunity(slug, userId);
      expect(comm2.is_member).toBe(targetState);
    });
  });

  describe('4. Transaction Rollback & Invalidation Safety', () => {
    it('does not invalidate or corrupt cache when an operation is rejected before transaction begins', async () => {
      const username = 'alex_dev';
      const cacheKey = `cache:user:profile:${username}:anon`;

      // Seed cache
      const profileBefore = await userService.getUserProfile(username);
      expect(await redis.get(cacheKey)).not.toBeNull();

      // Attempt invalid self-follow (rejected before transaction begins)
      await expect(userService.toggleFollow('usr_0', 'usr_0')).rejects.toThrow(AppError);

      // Cache MUST still be intact and uncorrupted
      const cachedAfter = await redis.get(cacheKey);
      expect(cachedAfter).not.toBeNull();
      expect(JSON.parse(cachedAfter!).followers_count).toBe(profileBefore.followers_count);
    });

    it('does not invalidate or corrupt cache when an active MongoDB transaction rolls back', async () => {
      const postId = 'post_101';
      const cacheKey = `cache:post:${postId}:anon`;
      const tagKey = `cache:post:${postId}:_keys`;

      // Seed post cache
      const postBefore = await postService.getPost(postId);
      expect(await redis.get(cacheKey)).not.toBeNull();
      expect(await redis.exists(tagKey)).toBe(1);

      // Trigger an operation that aborts inside runInTransaction (target post does not exist)
      await expect(
        postService.createComment('nonexistent_post_xyz', 'usr_0', {
          content: 'This comment must fail and abort the transaction',
        })
      ).rejects.toThrow(AppError);

      // Original cached post and tag set MUST remain completely intact and unevicted
      const cachedAfter = await redis.get(cacheKey);
      expect(cachedAfter).not.toBeNull();
      expect(JSON.parse(cachedAfter!).comments_count).toBe(postBefore.comments_count);
      expect(await redis.exists(tagKey)).toBe(1);
    });
  });

  describe('5. Non-blocking Redis Invalidation (No KEYS Command) & Tag Metadata Lifecycle', () => {
    it('uses non-blocking SCAN and tracked tag sets without ever executing blocking redis.keys', async () => {
      // Spy on redis.keys
      const keysSpy = vi.spyOn(redis, 'keys');

      // Populate caches
      await userService.getUserProfile('alex_dev', 'usr_1');
      await postService.getPost('post_101', 'usr_1');
      await communityService.getCommunity('systems', 'usr_1');

      // Run invalidations
      await userService.invalidateUserProfileCache('alex_dev');
      await postService.invalidatePostCache('post_101');
      await communityService.invalidateCommunityCache('systems');

      // Assert that redis.keys was NEVER invoked
      expect(keysSpy).not.toHaveBeenCalled();

      keysSpy.mockRestore();
    });

    it('cleans up tag metadata sets on invalidation and assigns a safety TTL to avoid memory leaks', async () => {
      const username = 'alex_dev';
      const cacheKey = `cache:user:profile:${username}:anon`;
      const tagKey = `cache:user:profile:${username}:_keys`;

      // Read profile to populate cache and tag set
      await userService.getUserProfile(username);
      expect(await redis.get(cacheKey)).not.toBeNull();
      expect(await redis.exists(tagKey)).toBe(1);

      // Verify tag set has a positive sliding TTL so it never leaks if unmutated
      const tagTtl = await redis.ttl(tagKey);
      expect(tagTtl).toBeGreaterThan(0);
      expect(tagTtl).toBeLessThanOrEqual(60);

      // Invalidate the profile
      await userService.invalidateUserProfileCache(username);

      // Both the cached entry AND the tag key set must be deleted
      expect(await redis.get(cacheKey)).toBeNull();
      expect(await redis.exists(tagKey)).toBe(0);
    });
  });

  describe('6. Graceful Degradation / Resilience on Redis Failures', () => {
    it('seamlessly falls back to MongoDB when Redis get throws', async () => {
      const getSpy = vi.spyOn(redis, 'get').mockRejectedValueOnce(new Error('Redis connection timeout'));

      // Request profile while Redis get throws
      const profile = await userService.getUserProfile('lucas_t');
      expect(profile).toBeDefined();
      expect(profile.username).toBe('lucas_t');

      getSpy.mockRestore();
    });

    it('fails open without throwing when Redis invalidation pipeline encounters an error', async () => {
      const delSpy = vi.spyOn(redis, 'del').mockRejectedValueOnce(new Error('Redis DEL connection reset'));

      // Invalidation must fail-open and not crash caller
      await expect(userService.invalidateUserProfileCache('alex_dev')).resolves.not.toThrow();

      delSpy.mockRestore();
    });
  });
});
