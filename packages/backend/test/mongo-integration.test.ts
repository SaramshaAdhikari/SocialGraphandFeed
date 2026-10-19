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
import { requiredTestServiceUrl } from './test-env.js';
import { calculateHotScore } from '../src/utils/pagination.js';
import { reconcileCommunityMemberCounts } from '../src/db/membershipIntegrity.js';
import { promoteExistingAlexAdmin } from '../src/db/bootstrap-admin.js';
import { AuthService, verifyPassword } from '../src/services/AuthService.js';
import { buildApp } from '../src/app.js';
import { connectRedis } from '../src/cache/redis.js';

describe('Real MongoDB Integration Suite (Local Database)', () => {
  let db: Db;
  let feedService: FeedService;
  let postService: PostService;
  let userService: UserService;
  let communityService: CommunityService;
  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    // This suite drops its database after execution; never fall back to a developer DB.
    const conn = await connectMongo(requiredTestServiceUrl('MONGODB_TEST_URI'), 'socialgraph_integration_test');
    db = conn.db;
    const redis = connectRedis();
    if (redis.status === 'wait') await redis.connect().catch(() => {});
    await redis.flushdb().catch(() => {});

    feedService = new FeedService();
    postService = new PostService();
    userService = new UserService();
    communityService = new CommunityService();
    app = buildApp();
    await app.ready();

    // Seed test database
    await seedDatabase(db);
  });

  afterAll(async () => {
    if (app) await app.close();
    if (db) {
      await db.dropDatabase();
    }
    const redis = connectRedis();
    await redis.flushdb().catch(() => {});
    await disconnectMongo();
  });

  describe('1. Index Idempotency & Constraint Enforcement', () => {
    it('registers, logs in, restores and invalidates a session with CSRF enforcement', async () => {
      const username = `auth_test_${Date.now()}`;
      const registration = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: { username, password: 'correct horse battery', password_confirmation: 'correct horse battery' } });
      expect(registration.statusCode).toBe(200);
      expect(registration.body).not.toContain('password_hash');
      expect(registration.json().user.username).toBe(username);
      const login = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { username: username.toUpperCase(), password: 'correct horse battery' } });
      expect(login.statusCode).toBe(200);
      const cookie = login.headers['set-cookie']?.split(';')[0];
      const csrf = login.json().csrf_token;
      expect(login.headers['set-cookie']).toContain('HttpOnly');
      const restored = await app.inject({ method: 'GET', url: '/api/v1/auth/session', headers: { cookie } });
      expect(restored.statusCode).toBe(200);
      expect(restored.json().user.username).toBe(username);
      const csrfRejected = await app.inject({ method: 'POST', url: '/api/v1/posts', headers: { cookie }, payload: { post_type: 'discussion', title: 'A valid test post', content: 'body' } });
      expect(csrfRejected.statusCode).toBe(403);
      const logout = await app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: { cookie, 'x-csrf-token': csrf }, payload: {} });
      expect(logout.statusCode).toBe(200);
      expect(logout.headers['set-cookie']).toContain('Max-Age=0');
      const invalidated = await app.inject({ method: 'GET', url: '/api/v1/auth/session', headers: { cookie } });
      expect(invalidated.statusCode).toBe(401);
      const protectedAfterLogout = await app.inject({ method: 'POST', url: '/api/v1/communities/systems/join', headers: { cookie, 'x-csrf-token': csrf }, payload: {} });
      expect(protectedAfterLogout.statusCode).toBe(401);
      const duplicate = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: { username: username.toUpperCase(), password: 'correct horse battery', password_confirmation: 'correct horse battery' } });
      expect(duplicate.statusCode).toBe(400);
      const wrongPassword = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { username, password: 'wrong password' } });
      expect(wrongPassword.statusCode).toBe(401);
      await db.collection(COLLECTIONS.USERS).deleteOne({ username });
    });
    it('promotes alex_dev repeatably without changing identity or existing relationships', async () => {
      const before = await db.collection(COLLECTIONS.USERS).findOne({ _id: 'usr_0' });
      const posts = await db.collection(COLLECTIONS.POSTS).countDocuments({ author_id: 'usr_0' });
      const comments = await db.collection(COLLECTIONS.COMMENTS).countDocuments({ author_id: 'usr_0' });
      const follows = await db.collection(COLLECTIONS.FOLLOWS).countDocuments({ $or: [{ follower_id: 'usr_0' }, { target_user_id: 'usr_0' }] });
      const memberships = await db.collection(COLLECTIONS.COMMUNITY_MEMBERSHIPS).countDocuments({ user_id: 'usr_0' });
      const votes = await db.collection(COLLECTIONS.POST_VOTES).countDocuments({ user_id: 'usr_0' });
      const saves = await db.collection(COLLECTIONS.POST_SAVES).countDocuments({ user_id: 'usr_0' });
      await promoteExistingAlexAdmin(db, 'admin');
      await promoteExistingAlexAdmin(db, 'must-not-reset-existing-password');
      const after = await db.collection(COLLECTIONS.USERS).findOne({ _id: 'usr_0' });
      expect(after?._id).toBe(before?._id);
      expect(after?.username).toBe('alex_dev');
      expect(after?.role).toBe('admin');
      expect(await verifyPassword('admin', after?.password_hash)).toBe(true);
      expect(await verifyPassword('must-not-reset-existing-password', after?.password_hash)).toBe(false);
      const developmentLogin = await new AuthService('development').login('admin', 'admin');
      expect(developmentLogin.user.id).toBe(before?._id);
      expect(developmentLogin.user.role).toBe('admin');
      expect(await db.collection(COLLECTIONS.USERS).countDocuments({ username: 'alex_dev' })).toBe(1);
      expect(await db.collection(COLLECTIONS.POSTS).countDocuments({ author_id: 'usr_0' })).toBe(posts);
      expect(await db.collection(COLLECTIONS.COMMENTS).countDocuments({ author_id: 'usr_0' })).toBe(comments);
      expect(await db.collection(COLLECTIONS.FOLLOWS).countDocuments({ $or: [{ follower_id: 'usr_0' }, { target_user_id: 'usr_0' }] })).toBe(follows);
      expect(await db.collection(COLLECTIONS.COMMUNITY_MEMBERSHIPS).countDocuments({ user_id: 'usr_0' })).toBe(memberships);
      expect(await db.collection(COLLECTIONS.POST_VOTES).countDocuments({ user_id: 'usr_0' })).toBe(votes);
      expect(await db.collection(COLLECTIONS.POST_SAVES).countDocuments({ user_id: 'usr_0' })).toBe(saves);
      const adminSession = await new AuthService().createSession('usr_0');
      const adminList = await app.inject({ method: 'GET', url: '/api/v1/admin/users', headers: { cookie: `sg_session=${adminSession.token}` } });
      expect(adminList.statusCode).toBe(200);
      expect(adminList.body).not.toContain('password_hash');
      const ordinarySession = await new AuthService().createSession('usr_1');
      const forbiddenAdmin = await app.inject({ method: 'GET', url: '/api/v1/admin/users', headers: { cookie: `sg_session=${ordinarySession.token}`, 'x-user-role': 'admin' } });
      expect(forbiddenAdmin.statusCode).toBe(403);
    });

    it('expires sessions and rate limits repeated invalid login attempts', async () => {
      const session = await new AuthService().createSession('usr_0');
      const { createHmac } = await import('node:crypto');
      const { config } = await import('../src/config/env.js');
      const sessionId = createHmac('sha256', config.SESSION_SECRET).update(session.token).digest('hex');
      await db.collection(COLLECTIONS.SESSIONS).updateOne({ _id: sessionId }, { $set: { expires_at: new Date(Date.now() - 1000) } });
      const expired = await app.inject({ method: 'GET', url: '/api/v1/auth/session', headers: { cookie: `sg_session=${session.token}` } });
      expect(expired.statusCode).toBe(401);
      expect(expired.headers['set-cookie']).toContain('Max-Age=0');
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const rejected = await app.inject({ method: 'POST', url: '/api/v1/auth/login', remoteAddress: '198.51.100.23', payload: { username: 'absent_user', password: 'incorrect' } });
        expect(rejected.statusCode).toBe(401);
      }
      const limited = await app.inject({ method: 'POST', url: '/api/v1/auth/login', remoteAddress: '198.51.100.23', payload: { username: 'absent_user', password: 'incorrect' } });
      expect(limited.statusCode).toBe(429);
    });
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

    it('enforces unique user-community membership pairs', async () => {
      await expect(db.collection(COLLECTIONS.COMMUNITY_MEMBERSHIPS).insertOne({
        _id: 'mbr_duplicate_pair',
        user_id: 'usr_0',
        community_id: 'comm_systems',
        created_at: new Date(),
      })).rejects.toThrow(/duplicate key/i);
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

    it('rejects a post that references a missing community without writing it', async () => {
      const before = await db.collection(COLLECTIONS.POSTS).countDocuments({ author_id: 'usr_0' });
      await expect(postService.createPost({
        post_type: 'discussion',
        title: 'Missing community reference',
        content: 'must not create a dangling relation',
        community_id: 'comm_missing',
      }, 'usr_0')).rejects.toThrow(/Community comm_missing not found/);
      expect(await db.collection(COLLECTIONS.POSTS).countDocuments({ author_id: 'usr_0' })).toBe(before);
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

    it('uses persisted edges for idempotent follow state, counts, and paginated lists', async () => {
      await Promise.all([
        userService.setFollow('usr_1', 'usr_6', true),
        userService.setFollow('usr_1', 'usr_6', true),
      ]);
      const freshProfile = await userService.getUserProfile('lucas_t', 'usr_6');
      expect(freshProfile.is_following).toBe(true);
      expect(freshProfile.followers_count).toBe(await db.collection(COLLECTIONS.FOLLOWS).countDocuments({ target_user_id: 'usr_1' }));
      expect(await db.collection(COLLECTIONS.FOLLOWS).countDocuments({ follower_id: 'usr_6', target_user_id: 'usr_1' })).toBe(1);
      const followers = await userService.getFollowList('lucas_t', 'followers', 'usr_6', null, 50);
      expect(followers.data.map((entry) => entry.id)).toContain('usr_6');
      expect(followers.total_count).toBe(freshProfile.followers_count);
      await userService.setFollow('usr_1', 'usr_6', false);
      expect((await userService.getUserProfile('lucas_t', 'usr_6')).is_following).toBe(false);
    });

    it('rejects self-follow with 400 Bad Request', async () => {
      await expect(userService.toggleFollow('usr_0', 'usr_0')).rejects.toThrow(
        /Users cannot follow themselves/
      );
    });

    it('sets membership idempotently and keeps persisted state, listings, and counts consistent', async () => {
      const commBefore = await communityService.getCommunity('systems', 'usr_4');
      const initialMembers = commBefore.members_count;
      expect(commBefore.is_member).toBe(false);

      const join = await communityService.setMembership('systems', 'usr_4', true);
      expect(join.is_member).toBe(true);
      expect(join.members_count).toBe(initialMembers + 1);
      const repeatedJoin = await communityService.setMembership('systems', 'usr_4', true);
      expect(repeatedJoin.members_count).toBe(initialMembers + 1);
      expect(await db.collection(COLLECTIONS.COMMUNITY_MEMBERSHIPS).countDocuments({ user_id: 'usr_4', community_id: 'comm_systems' })).toBe(1);

      const commAfter = await communityService.getCommunity('systems', 'usr_4');
      expect(commAfter.is_member).toBe(true);
      expect((await communityService.getCommunities('usr_4')).find((c) => c.slug === 'systems')).toMatchObject({ is_member: true, members_count: initialMembers + 1 });
      expect((await communityService.getCommunity('systems', 'usr_3')).is_member).toBe(false);

      const leave = await communityService.setMembership('systems', 'usr_4', false);
      expect(leave.is_member).toBe(false);
      expect(leave.members_count).toBe(initialMembers);
      const repeatedLeave = await communityService.setMembership('systems', 'usr_4', false);
      expect(repeatedLeave.members_count).toBe(initialMembers);
      expect(await db.collection(COLLECTIONS.COMMUNITY_MEMBERSHIPS).countDocuments({ user_id: 'usr_4', community_id: 'comm_systems' })).toBe(0);
      expect((await communityService.getCommunity('systems', 'usr_4')).is_member).toBe(false);
    });

    it('serializes concurrent joins without duplicate memberships or count drift', async () => {
      const before = await communityService.getCommunity('systems', 'usr_3');
      expect(before.is_member).toBe(false);
      await Promise.all([
        communityService.setMembership('systems', 'usr_3', true),
        communityService.setMembership('systems', 'usr_3', true),
      ]);
      const after = await communityService.getCommunity('systems', 'usr_3');
      expect(after.is_member).toBe(true);
      expect(after.members_count).toBe(before.members_count + 1);
      expect(await db.collection(COLLECTIONS.COMMUNITY_MEMBERSHIPS).countDocuments({ user_id: 'usr_3', community_id: 'comm_systems' })).toBe(1);
      expect((await communityService.getCommunity('systems', 'usr_0')).is_member).toBe(true);
      await communityService.setMembership('systems', 'usr_3', false);
    });

    it('rolls back the membership row if updating the derived count fails', async () => {
      const communities = db.collection(COLLECTIONS.COMMUNITIES);
      const before = await communityService.getCommunity('systems', 'usr_3');
      const prototype = Object.getPrototypeOf(communities);
      const originalUpdateOne = prototype.updateOne;
      prototype.updateOne = async function (filter: any, ...args: any[]) {
        if (this.collectionName === COLLECTIONS.COMMUNITIES && filter?._id === 'comm_systems') {
          throw new Error('injected membership counter failure');
        }
        return originalUpdateOne.call(this, filter, ...args);
      };
      try {
        await expect(communityService.setMembership('systems', 'usr_3', true)).rejects.toThrow('injected membership counter failure');
      } finally {
        prototype.updateOne = originalUpdateOne;
      }
      expect(await db.collection(COLLECTIONS.COMMUNITY_MEMBERSHIPS).countDocuments({ user_id: 'usr_3', community_id: 'comm_systems' })).toBe(0);
      expect((await communityService.getCommunity('systems', 'usr_3'))).toMatchObject({ is_member: false, members_count: before.members_count });
    });

    it('rejects unknown users without creating membership and repairs only stale derived counters', async () => {
      const memberships = db.collection(COLLECTIONS.COMMUNITY_MEMBERSHIPS);
      const beforeRows = await memberships.find({}).toArray();
      await expect(communityService.setMembership('systems', 'unknown_user', true)).rejects.toThrow(/User unknown_user not found/);
      expect(await memberships.find({}).toArray()).toEqual(beforeRows);

      await db.collection(COLLECTIONS.COMMUNITIES).updateOne({ _id: 'comm_systems' }, { $set: { members_count: 999 } });
      const repaired = await reconcileCommunityMemberCounts(db, (await import('../src/db/mongo.js')).getMongoClient()!);
      expect(repaired).toBeGreaterThan(0);
      expect(await memberships.find({}).toArray()).toEqual(beforeRows);
      expect((await communityService.getCommunity('systems', 'usr_0')).members_count).toBe(await memberships.countDocuments({ community_id: 'comm_systems' }));
    });

    it('retrieves all communities with getCommunities and checks membership', async () => {
      const allComms = await communityService.getCommunities('usr_0');
      expect(allComms.length).toBeGreaterThanOrEqual(5);

      const systemsComm = allComms.find((c) => c.slug === 'systems');
      expect(systemsComm).toBeDefined();
      expect(systemsComm?.is_member).toBe(true); // usr_0 is a member in seed
    });
  });

  describe('5. Universal Search Engine', () => {
    let searchService: any;

    beforeAll(async () => {
      const { SearchService } = await import('../src/services/SearchService.js');
      searchService = new SearchService();
    });

    it('matches across discussions, communities, and people for multi-entity term "systems"', async () => {
      const res = await searchService.search({ q: 'systems', category: 'all' }, 'usr_0');
      expect(res.total_count).toBeGreaterThan(0);

      const foundComm = res.communities.find((c: any) => c.slug === 'systems');
      expect(foundComm).toBeDefined();

      const foundUser = res.users.find((u: any) => u.username === 'lucas_t');
      expect(foundUser).toBeDefined();

      expect(res.discussions.length).toBeGreaterThan(0);
    });

    it('filters strictly by category', async () => {
      const discOnly = await searchService.search({ q: 'systems', category: 'discussions' });
      expect(discOnly.discussions.length).toBeGreaterThan(0);
      expect(discOnly.visuals).toHaveLength(0);
      expect(discOnly.communities).toHaveLength(0);
      expect(discOnly.users).toHaveLength(0);
      expect(discOnly.total_count).toBe(discOnly.discussions.length);

      const commOnly = await searchService.search({ q: 'systems', category: 'communities' });
      expect(commOnly.communities.length).toBeGreaterThan(0);
      expect(commOnly.discussions).toHaveLength(0);
      expect(commOnly.total_count).toBe(commOnly.communities.length);
    });

    it('sorts search results by top and new', async () => {
      const topSearch = await searchService.search({ q: 'concrete', category: 'visual', sort: 'top' });
      expect(topSearch.visuals.length).toBeGreaterThan(0);

      const newSearch = await searchService.search({ q: 'systems', category: 'discussions', sort: 'new' });
      expect(newSearch.discussions.length).toBeGreaterThan(0);
    });
  });

  describe('6. Mutation Integrity & Concurrency Safety', () => {
    it('handles concurrent votes from the same user idempotently without score drift', async () => {
      // 1. Create a dedicated post for concurrency testing
      const testPost = await postService.createPost(
        {
          post_type: 'discussion',
          title: 'Concurrency Test Post',
          content: 'Testing atomic updates under concurrency',
        },
        'usr_0'
      );

      // 2. Fire 3 concurrent upvotes from the SAME user
      const results = await Promise.all([
        postService.votePost(testPost.id, 'usr_3', 1),
        postService.votePost(testPost.id, 'usr_3', 1),
        postService.votePost(testPost.id, 'usr_3', 1),
      ]);

      const finalPost = await postService.getPost(testPost.id);
      // Net score must be exactly 1, not 3
      expect(finalPost.score).toBe(1);
      expect(await db.collection(COLLECTIONS.POST_VOTES).countDocuments({ post_id: testPost.id, user_id: 'usr_3' })).toBe(1);
      const persistedPost = await db.collection(COLLECTIONS.POSTS).findOne({ _id: testPost.id });
      expect(persistedPost?.hot_score).toBe(calculateHotScore(1, persistedPost!.created_at));
    });

    it('handles concurrent upvotes from distinct users correctly summing score', async () => {
      const testPost = await postService.createPost(
        {
          post_type: 'discussion',
          title: 'Multi-User Concurrency Post',
          content: 'Testing multiple users voting at once',
        },
        'usr_0'
      );

      // 3 distinct users upvote simultaneously; the post score is the serialization point.
      await Promise.all([
        postService.votePost(testPost.id, 'usr_1', 1),
        postService.votePost(testPost.id, 'usr_2', 1),
        postService.votePost(testPost.id, 'usr_4', 1),
      ]);

      const finalPost = await postService.getPost(testPost.id);
      expect(finalPost.score).toBe(3);
      expect(await db.collection(COLLECTIONS.POST_VOTES).countDocuments({ post_id: testPost.id })).toBe(3);
    });

    it('handles concurrent follow requests safely without corrupting counters', async () => {
      const initialProfile = await userService.getUserProfile('elena_arch');
      const startCount = initialProfile.followers_count;

      // Two toggles serialize as two state transitions, leaving the original state and counters intact.
      await Promise.all([
        userService.toggleFollow('usr_2', 'usr_3'),
        userService.toggleFollow('usr_2', 'usr_3'),
      ]);

      const finalProfile = await userService.getUserProfile('elena_arch');
      expect(finalProfile.followers_count).toBe(startCount);
      expect(finalProfile.is_following).toBe(false);
      expect(await db.collection(COLLECTIONS.FOLLOWS).countDocuments({ follower_id: 'usr_3', target_user_id: 'usr_2' })).toBe(0);
    });

    it('serializes concurrent saves and keeps the unique save record consistent', async () => {
      const post = await postService.createPost({ post_type: 'discussion', title: 'Concurrent save', content: 'test' }, 'usr_0');
      await Promise.all([
        postService.toggleSavePost(post.id, 'usr_3'),
        postService.toggleSavePost(post.id, 'usr_3'),
      ]);
      expect((await postService.getPost(post.id, 'usr_3')).is_saved).toBe(false);
      expect(await db.collection(COLLECTIONS.POST_SAVES).countDocuments({ post_id: post.id, user_id: 'usr_3' })).toBe(0);
    });

    it('rolls back a vote record when the score update fails mid-transaction', async () => {
      const post = await postService.createPost({ post_type: 'discussion', title: 'Failed vote transaction', content: 'test' }, 'usr_0');
      const prototype = Object.getPrototypeOf(db.collection(COLLECTIONS.POSTS));
      const originalUpdateOne = prototype.updateOne;
      prototype.updateOne = async function (filter: any, ...args: any[]) {
        if (this.collectionName === COLLECTIONS.POSTS && filter?._id === post.id) {
          throw new Error('injected score write failure');
        }
        return originalUpdateOne.call(this, filter, ...args);
      };
      try {
        await expect(postService.votePost(post.id, 'usr_3', 1)).rejects.toThrow('injected score write failure');
      } finally {
        prototype.updateOne = originalUpdateOne;
      }
      expect(await db.collection(COLLECTIONS.POST_VOTES).countDocuments({ post_id: post.id, user_id: 'usr_3' })).toBe(0);
      expect((await db.collection(COLLECTIONS.POSTS).findOne({ _id: post.id }))?.score).toBe(0);
    });

    it('keeps follow records authoritative without mutating cached user counters', async () => {
      const targetBefore = await db.collection(COLLECTIONS.USERS).findOne({ _id: 'usr_2' });
      const followerBefore = await db.collection(COLLECTIONS.USERS).findOne({ _id: 'usr_3' });
      await userService.setFollow('usr_2', 'usr_3', true);
      expect(await db.collection(COLLECTIONS.FOLLOWS).countDocuments({ follower_id: 'usr_3', target_user_id: 'usr_2' })).toBe(1);
      expect((await db.collection(COLLECTIONS.USERS).findOne({ _id: 'usr_2' }))?.followers_count).toBe(targetBefore?.followers_count);
      expect((await db.collection(COLLECTIONS.USERS).findOne({ _id: 'usr_3' }))?.following_count).toBe(followerBefore?.following_count);
      await userService.setFollow('usr_2', 'usr_3', false);
    });

    it('keeps concurrent comment records and comments_count in sync', async () => {
      const post = await postService.createPost({ post_type: 'discussion', title: 'Concurrent comments', content: 'test' }, 'usr_0');
      await Promise.all(Array.from({ length: 8 }, (_, index) =>
        postService.createComment(post.id, 'usr_1', { content: `comment ${index}` })
      ));
      const savedPost = await db.collection(COLLECTIONS.POSTS).findOne({ _id: post.id });
      const comments = await db.collection(COLLECTIONS.COMMENTS).countDocuments({ post_id: post.id });
      expect(comments).toBe(8);
      expect(savedPost?.comments_count).toBe(comments);
    });

    it('rolls back a comment record when the counter update fails mid-transaction', async () => {
      const post = await postService.createPost({ post_type: 'discussion', title: 'Failed comment transaction', content: 'test' }, 'usr_0');
      const prototype = Object.getPrototypeOf(db.collection(COLLECTIONS.POSTS));
      const originalUpdateOne = prototype.updateOne;
      prototype.updateOne = async function (filter: any, ...args: any[]) {
        if (this.collectionName === COLLECTIONS.POSTS && filter?._id === post.id) {
          throw new Error('injected counter write failure');
        }
        return originalUpdateOne.call(this, filter, ...args);
      };
      try {
        await expect(postService.createComment(post.id, 'usr_1', { content: 'must roll back' })).rejects.toThrow('injected counter write failure');
      } finally {
        prototype.updateOne = originalUpdateOne;
      }
      expect(await db.collection(COLLECTIONS.COMMENTS).countDocuments({ post_id: post.id })).toBe(0);
      expect((await db.collection(COLLECTIONS.POSTS).findOne({ _id: post.id }))?.comments_count).toBe(0);
    });

    it('retries a duplicate-key race and commits the comment exactly once', async () => {
      const post = await postService.createPost({ post_type: 'discussion', title: 'Retry comment transaction', content: 'test' }, 'usr_0');
      const prototype = Object.getPrototypeOf(db.collection(COLLECTIONS.COMMENTS));
      const originalInsertOne = prototype.insertOne;
      let injectedRace = true;
      prototype.insertOne = async function (document: any, ...args: any[]) {
        if (this.collectionName === COLLECTIONS.COMMENTS && document?.post_id === post.id && injectedRace) {
          injectedRace = false;
          throw Object.assign(new Error('injected duplicate-key race'), { code: 11000 });
        }
        return originalInsertOne.call(this, document, ...args);
      };
      try {
        await postService.createComment(post.id, 'usr_1', { content: 'retry me once' });
      } finally {
        prototype.insertOne = originalInsertOne;
      }
      expect(injectedRace).toBe(false);
      expect(await db.collection(COLLECTIONS.COMMENTS).countDocuments({ post_id: post.id })).toBe(1);
      expect((await db.collection(COLLECTIONS.POSTS).findOne({ _id: post.id }))?.comments_count).toBe(1);
    });
  });

  describe('7. Seed Safety & Fixture Scoping', () => {
    it('derives seed counters and ranking values from persisted records', async () => {
      const users = await db.collection(COLLECTIONS.USERS).find({ _id: { $in: Array.from({ length: 20 }, (_, i) => `usr_${i}`) } }).toArray();
      for (const user of users) {
        expect(user.followers_count).toBe(await db.collection(COLLECTIONS.FOLLOWS).countDocuments({ target_user_id: user._id }));
        expect(user.following_count).toBe(await db.collection(COLLECTIONS.FOLLOWS).countDocuments({ follower_id: user._id }));
        expect(user.posts_count).toBe(await db.collection(COLLECTIONS.POSTS).countDocuments({ author_id: user._id }));
      }
      const communities = await db.collection(COLLECTIONS.COMMUNITIES).find({}).toArray();
      for (const community of communities) {
        expect(community.members_count).toBe(await db.collection(COLLECTIONS.COMMUNITY_MEMBERSHIPS).countDocuments({ community_id: community._id }));
      }
      const posts = await db.collection(COLLECTIONS.POSTS).find({ _id: { $in: ['post_101', 'post_102', 'post_103', 'post_104', 'post_tie_301', 'post_tie_302'] } }).toArray();
      for (const post of posts) {
        const votes = await db.collection(COLLECTIONS.POST_VOTES).find({ post_id: post._id }).toArray();
        expect(post.score).toBe(votes.reduce((score, vote) => score + vote.direction, 0));
        expect(post.comments_count).toBe(await db.collection(COLLECTIONS.COMMENTS).countDocuments({ post_id: post._id }));
      }
    });

    it('re-executing seedDatabase is clean and deterministic', async () => {
      const stats = await seedDatabase(db);
      expect(stats.usersCount).toBe(20);
      expect(stats.postsCount).toBe(6);
      expect(stats.commentsCount).toBe(4);
      expect(stats.followsCount).toBe(5);
      expect(stats.communitiesCount).toBe(5);
    });

    it('preserves non-seed user data when seedDatabase is re-executed', async () => {
      const usersCol = db.collection(COLLECTIONS.USERS);
      const postsCol = db.collection(COLLECTIONS.POSTS);

      // Create custom non-seed user and post
      const customUserId = 'usr_custom_preserve_test';
      const customPostId = 'post_custom_preserve_test';

      await usersCol.insertOne({
        _id: customUserId,
        username: 'unrelated_dev',
        display_name: 'Unrelated Developer',
        avatar_url: '/avatars/alex-dev.svg',
        bio: 'Preserve me across seeds!',
        is_verified: false,
        followers_count: 0,
        following_count: 0,
        posts_count: 1,
        created_at: new Date(),
        updated_at: new Date(),
      } as any);

      await postsCol.insertOne({
        _id: customPostId,
        post_type: 'discussion',
        author_id: customUserId,
        title: 'Preserved Unrelated Post',
        score: 0,
        hot_score: 100,
        comments_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      } as any);

      // Re-run seed
      await seedDatabase(db);

      // Verify that the custom user and post were NOT deleted
      const foundUser = await usersCol.findOne({ _id: customUserId as any });
      const foundPost = await postsCol.findOne({ _id: customPostId as any });

      expect(foundUser).not.toBeNull();
      expect(foundUser?.username).toBe('unrelated_dev');
      expect(foundPost).not.toBeNull();
      expect(foundPost?.title).toBe('Preserved Unrelated Post');

      // Cleanup custom records
      await usersCol.deleteOne({ _id: customUserId as any });
      await postsCol.deleteOne({ _id: customPostId as any });
    });

    it('preserves alex_dev credentials, role, profile, and id when the seed is rerun', async () => {
      const alex = db.collection(COLLECTIONS.USERS);
      const markerHash = 'preserved-test-hash';
      await alex.updateOne({ _id: 'usr_0' }, { $set: { role: 'admin', password_hash: markerHash, display_name: 'Alex test profile' } });
      await seedDatabase(db);
      const after = await alex.findOne({ _id: 'usr_0' });
      expect(after).toMatchObject({ _id: 'usr_0', username: 'alex_dev', role: 'admin', password_hash: markerHash, display_name: 'Alex test profile' });
    });
  });
});
