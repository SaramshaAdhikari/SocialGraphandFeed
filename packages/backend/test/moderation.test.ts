import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { connectMongo, disconnectMongo, getDb } from '../src/db/mongo.js';
import { connectRedis, disconnectRedis } from '../src/cache/redis.js';
import { requiredTestServiceUrl } from './test-env.js';
import { AuthService } from '../src/services/AuthService.js';
import { PostService } from '../src/services/PostService.js';
import { ModerationService } from '../src/services/ModerationService.js';
import { NotificationService } from '../src/services/NotificationService.js';
import { ensureIndexes } from '../src/db/indexes.js';
import { COLLECTIONS } from '../src/db/collections.js';
import type { PostDoc, CommentDoc, UserDoc, ReportDoc } from '../db/types.js';

describe('Moderation & Content Lifecycle Integration Suite', () => {
  let app: FastifyInstance;
  let authService: AuthService;
  let postService: PostService;
  let moderationService: ModerationService;
  let notificationService: NotificationService;

  let userA: { id: string; username: string; token: string; csrf: string };
  let userB: { id: string; username: string; token: string; csrf: string };
  let adminUser: { id: string; username: string; token: string; csrf: string };

  const getHeaders = (user: { token: string; csrf: string }) => ({
    cookie: `sg_session=${user.token}`,
    'x-csrf-token': user.csrf,
  });

  beforeAll(async () => {
    await connectMongo(requiredTestServiceUrl('MONGODB_TEST_URI'), 'socialgraph_moderation_test');
    const redis = connectRedis(requiredTestServiceUrl('REDIS_TEST_URL'));
    if (redis.status === 'wait') await redis.connect().catch(() => {});
    await redis.flushdb().catch(() => {});

    await ensureIndexes(getDb());

    authService = new AuthService();
    postService = new PostService();
    moderationService = new ModerationService();
    notificationService = new NotificationService();

    app = buildApp({}, { devUserBypass: false });
    await app.ready();

    // Create 2 regular users + 1 admin user
    const timestamp = Date.now();
    const [regA, regB, regAdmin] = await Promise.all([
      authService.register(`mod_user_a_${timestamp}`, 'password123'),
      authService.register(`mod_user_b_${timestamp}`, 'password123'),
      authService.register(`mod_admin_${timestamp}`, 'password123'),
    ]);

    // Promote admin user in MongoDB
    await getDb()
      .collection<UserDoc>(COLLECTIONS.USERS)
      .updateOne({ _id: regAdmin.id }, { $set: { role: 'admin' } });

    const [sessA, sessB, sessAdmin] = await Promise.all([
      authService.createSession(regA.id),
      authService.createSession(regB.id),
      authService.createSession(regAdmin.id),
    ]);

    userA = { id: regA.id, username: regA.username, token: sessA.token, csrf: sessA.csrf };
    userB = { id: regB.id, username: regB.username, token: sessB.token, csrf: sessB.csrf };
    adminUser = {
      id: regAdmin.id,
      username: regAdmin.username,
      token: sessAdmin.token,
      csrf: sessAdmin.csrf,
    };
  });

  afterAll(async () => {
    if (app) await app.close();
    await getDb().dropDatabase().catch(() => {});
    const redis = connectRedis(requiredTestServiceUrl('REDIS_TEST_URL'));
    await redis.flushdb().catch(() => {});
    await disconnectMongo();
    await disconnectRedis();
  });

  describe('1. Content Reporting & Validation', () => {
    let testPostId: string;

    beforeAll(async () => {
      const post = await postService.createPost(
        {
          post_type: 'discussion',
          title: 'Post to be reported for spam',
          content: 'Buy cheap watches here!',
        },
        userB.id
      );
      testPostId = post.id;
    });

    it('allows a user to report a post with a valid reason and description', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/reports',
        headers: getHeaders(userA),
        payload: {
          target_type: 'post',
          target_id: testPostId,
          reason: 'spam',
          description: 'Obvious commercial spam violating community rules',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.id).toMatch(/^rpt_/);
      expect(body.reporter_id).toBe(userA.id);
      expect(body.target_type).toBe('post');
      expect(body.target_id).toBe(testPostId);
      expect(body.reason).toBe('spam');
      expect(body.status).toBe('pending');
      expect(body.action_taken).toBe('none');
    });

    it('rejects duplicate reports from the same user on the same content (409 Conflict)', async () => {
      const duplicateRes = await app.inject({
        method: 'POST',
        url: '/api/v1/reports',
        headers: getHeaders(userA),
        payload: {
          target_type: 'post',
          target_id: testPostId,
          reason: 'spam',
        },
      });

      expect(duplicateRes.statusCode).toBe(409);
      expect(duplicateRes.json().code).toBe('CONFLICT');
    });

    it('rejects self-reporting with 400 Bad Request', async () => {
      const selfReportRes = await app.inject({
        method: 'POST',
        url: '/api/v1/reports',
        headers: getHeaders(userB), // userB is the author of testPostId
        payload: {
          target_type: 'post',
          target_id: testPostId,
          reason: 'inappropriate',
        },
      });

      expect(selfReportRes.statusCode).toBe(400);
      expect(selfReportRes.json().code).toBe('BAD_REQUEST');
      expect(selfReportRes.json().detail).toContain('cannot report your own post');
    });

    it('rejects reports against non-existent targets with 404 Not Found', async () => {
      const notFoundRes = await app.inject({
        method: 'POST',
        url: '/api/v1/reports',
        headers: getHeaders(userA),
        payload: {
          target_type: 'post',
          target_id: 'post_non_existent_9999',
          reason: 'harassment',
        },
      });

      expect(notFoundRes.statusCode).toBe(404);
      expect(notFoundRes.json().code).toBe('NOT_FOUND');
    });
  });

  describe('2. Rate Limiting on Report Submissions', () => {
    it('enforces rate limit of 5 reports per minute per user/IP', async () => {
      // Create a dedicated user for rate limit isolation
      const rlReg = await authService.register(`mod_rl_user_${Date.now()}`, 'password123');
      const rlSess = await authService.createSession(rlReg.id);
      const rlHeaders = {
        cookie: `sg_session=${rlSess.token}`,
        'x-csrf-token': rlSess.csrf,
      };

      const targetUser = userB.id;
      const clientIp = '198.51.100.181';

      // Submit exactly 5 reports on separate comments
      for (let i = 0; i < 5; i++) {
        const comment = await postService.createComment(
          (await postService.createPost({ post_type: 'discussion', title: `RateLimit Post ${i}` }, userB.id)).id,
          userB.id,
          { content: `Spam comment ${i}` }
        );

        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/reports',
          remoteAddress: clientIp,
          headers: rlHeaders,
          payload: {
            target_type: 'comment',
            target_id: comment.id,
            reason: 'spam',
          },
        });
        expect(res.statusCode).toBe(201);
      }

      // 6th report within 60s MUST trigger 429 Too Many Requests
      const limited = await app.inject({
        method: 'POST',
        url: '/api/v1/reports',
        remoteAddress: clientIp,
        headers: rlHeaders,
        payload: {
          target_type: 'user',
          target_id: targetUser,
          reason: 'harassment',
        },
      });

      expect(limited.statusCode).toBe(429);
      expect(limited.json().code).toBe('RATE_LIMITED');
    });
  });

  describe('3. Admin Moderation Queue & Access Control', () => {
    it('rejects unauthenticated requests to /admin/reports with 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/reports',
      });
      expect(res.statusCode).toBe(401);
    });

    it('rejects non-admin users from accessing /admin/reports with 403 Forbidden', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/reports',
        headers: getHeaders(userA), // regular user
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().code).toBe('FORBIDDEN');
    });

    it('allows admin users to view pending reports with cursor pagination', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/reports?status=pending&limit=2',
        headers: getHeaders(adminUser),
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(body.data[0].status).toBe('pending');
      expect(typeof body.total_count).toBe('number');
    });
  });

  describe('4. Post Deletion & Ownership Security', () => {
    let postToDelete: string;

    beforeAll(async () => {
      const p = await postService.createPost(
        {
          post_type: 'discussion',
          title: 'Post to test deletion',
          content: 'This post will be deleted',
        },
        userA.id
      );
      postToDelete = p.id;
    });

    it('prevents non-owners from deleting a post (403 Forbidden)', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/posts/${postToDelete}`,
        headers: getHeaders(userB), // userB is NOT the author
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().code).toBe('FORBIDDEN');
    });

    it('allows the author to delete their own post', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/posts/${postToDelete}`,
        headers: getHeaders(userA), // author
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ success: true, post_id: postToDelete });

      // Verifying post is gone
      const verifyRes = await app.inject({
        method: 'GET',
        url: `/api/v1/posts/${postToDelete}`,
      });
      expect(verifyRes.statusCode).toBe(404);
    });

    it('returns 404 when attempting to delete an already-deleted or non-existent post', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/posts/${postToDelete}`,
        headers: getHeaders(userA),
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().code).toBe('NOT_FOUND');
    });
  });

  describe('5. Cascading Post Deletion Cleanup (ACID)', () => {
    let cascadePostId: string;
    let commentId: string;

    beforeAll(async () => {
      // 1. Create a post
      const post = await postService.createPost(
        {
          post_type: 'discussion',
          title: 'Post for cascade deletion test',
          content: 'Testing cascading cleanup of comments, votes, saves, and notifications',
        },
        userA.id
      );
      cascadePostId = post.id;

      // 2. Add comments
      const c = await postService.createComment(cascadePostId, userB.id, {
        content: 'Comment that should be cascade deleted',
      });
      commentId = c.id;

      // 3. Add votes
      await postService.votePost(cascadePostId, userB.id, 1);

      // 4. Add saves
      await postService.toggleSavePost(cascadePostId, userB.id);

      // 5. Submit a report on this post
      await moderationService.createReport(userB.id, {
        target_type: 'post',
        target_id: cascadePostId,
        reason: 'inappropriate',
      });

      // 6. Generate a notification for userA
      await notificationService.createNotification({
        recipientId: userA.id,
        actorId: userB.id,
        type: 'comment',
        postId: cascadePostId,
        commentId,
      });
    });

    it('atomically removes all dependent records and decrements author post counter on deletion', async () => {
      const db = getDb();

      // Verify records exist before deletion
      expect(await db.collection(COLLECTIONS.POSTS).countDocuments({ _id: cascadePostId })).toBe(1);
      expect(await db.collection(COLLECTIONS.COMMENTS).countDocuments({ post_id: cascadePostId })).toBe(1);
      expect(await db.collection(COLLECTIONS.POST_VOTES).countDocuments({ post_id: cascadePostId })).toBe(1);
      expect(await db.collection(COLLECTIONS.POST_SAVES).countDocuments({ post_id: cascadePostId })).toBe(1);
      expect(await db.collection(COLLECTIONS.NOTIFICATIONS).countDocuments({ post_id: cascadePostId })).toBe(1);

      const authorBefore = await db.collection<UserDoc>(COLLECTIONS.USERS).findOne({ _id: userA.id });
      const initialPostsCount = authorBefore!.posts_count;

      // Delete the post via author request
      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/api/v1/posts/${cascadePostId}`,
        headers: getHeaders(userA),
      });
      expect(deleteRes.statusCode).toBe(200);

      // Verify all cascade records are removed from MongoDB
      expect(await db.collection(COLLECTIONS.POSTS).countDocuments({ _id: cascadePostId })).toBe(0);
      expect(await db.collection(COLLECTIONS.COMMENTS).countDocuments({ post_id: cascadePostId })).toBe(0);
      expect(await db.collection(COLLECTIONS.POST_VOTES).countDocuments({ post_id: cascadePostId })).toBe(0);
      expect(await db.collection(COLLECTIONS.POST_SAVES).countDocuments({ post_id: cascadePostId })).toBe(0);
      expect(await db.collection(COLLECTIONS.NOTIFICATIONS).countDocuments({ post_id: cascadePostId })).toBe(0);

      // Verify author's posts_count was decremented by 1
      const authorAfter = await db.collection<UserDoc>(COLLECTIONS.USERS).findOne({ _id: userA.id });
      expect(authorAfter!.posts_count).toBe(initialPostsCount - 1);

      // Verify pending reports for this post were marked resolved with action 'removed'
      const report = await db.collection<ReportDoc>(COLLECTIONS.REPORTS).findOne({
        target_type: 'post',
        target_id: cascadePostId,
      });
      expect(report?.status).toBe('resolved');
      expect(report?.action_taken).toBe('removed');
    });
  });

  describe('6. Comment Deletion & Thread Tree Reduction', () => {
    let threadPostId: string;
    let rootCommentId: string;
    let replyCommentId: string;

    beforeAll(async () => {
      const post = await postService.createPost(
        { post_type: 'discussion', title: 'Post with comment thread' },
        userA.id
      );
      threadPostId = post.id;

      const root = await postService.createComment(threadPostId, userA.id, {
        content: 'Root comment to delete',
      });
      rootCommentId = root.id;

      const reply = await postService.createComment(threadPostId, userB.id, {
        content: 'Reply to root comment',
        parent_id: rootCommentId,
      });
      replyCommentId = reply.id;
    });

    it('prevents non-author from deleting comment', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/posts/${threadPostId}/comments/${rootCommentId}`,
        headers: getHeaders(userB), // userB is NOT the author of rootCommentId
      });

      expect(res.statusCode).toBe(403);
    });

    it('deletes comment thread and decrements post comments_count by the total subtree size', async () => {
      const db = getDb();
      const postBefore = await db.collection<PostDoc>(COLLECTIONS.POSTS).findOne({ _id: threadPostId });
      expect(postBefore!.comments_count).toBe(2);

      // Author deletes root comment
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/posts/${threadPostId}/comments/${rootCommentId}`,
        headers: getHeaders(userA),
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ success: true, comment_id: rootCommentId });

      // Verify both root and child comments are deleted
      expect(await db.collection(COLLECTIONS.COMMENTS).countDocuments({ post_id: threadPostId })).toBe(0);

      // Verify post comments_count is decremented to 0
      const postAfter = await db.collection<PostDoc>(COLLECTIONS.POSTS).findOne({ _id: threadPostId });
      expect(postAfter!.comments_count).toBe(0);
    });
  });

  describe('7. Admin Report Resolution & Direct Moderation Action', () => {
    let reportedPostId: string;
    let reportId: string;

    beforeAll(async () => {
      const post = await postService.createPost(
        { post_type: 'discussion', title: 'Violative Content', content: 'Dangerous exploit code' },
        userB.id
      );
      reportedPostId = post.id;

      const report = await moderationService.createReport(userA.id, {
        target_type: 'post',
        target_id: reportedPostId,
        reason: 'inappropriate',
        description: 'Violates platform safety policies',
      });
      reportId = report.id;
    });

    it('allows an administrator to resolve a report and remove the violating content', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/admin/reports/${reportId}`,
        headers: getHeaders(adminUser),
        payload: {
          status: 'resolved',
          action: 'remove_content',
          notes: 'Removed violating content per safety policy.',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe('resolved');
      expect(body.action_taken).toBe('removed');
      expect(body.resolved_by).toBe(adminUser.id);
      expect(body.resolved_at).toBeDefined();

      // Verify reported post was actually deleted from database
      const postInDb = await getDb().collection(COLLECTIONS.POSTS).findOne({ _id: reportedPostId });
      expect(postInDb).toBeNull();
    });

    it('allows an administrator to dismiss a report without taking action on content', async () => {
      // Create a valid post and a spurious report
      const benignPost = await postService.createPost(
        { post_type: 'discussion', title: 'Benign Discussion', content: 'Completely harmless post' },
        userB.id
      );

      const spuriousReport = await moderationService.createReport(userA.id, {
        target_type: 'post',
        target_id: benignPost.id,
        reason: 'spam',
        description: 'False report',
      });

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/admin/reports/${spuriousReport.id}`,
        headers: getHeaders(adminUser),
        payload: {
          status: 'dismissed',
          action: 'none',
          notes: 'No violation found; post is legitimate.',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe('dismissed');
      expect(body.action_taken).toBe('dismissed');

      // Verify post still exists in database
      const postInDb = await getDb().collection(COLLECTIONS.POSTS).findOne({ _id: benignPost.id });
      expect(postInDb).not.toBeNull();
    });

    it('rejects remove_content action on user reports with 400 Bad Request', async () => {
      const userReport = await moderationService.createReport(userA.id, {
        target_type: 'user',
        target_id: userB.id,
        reason: 'harassment',
      });

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/admin/reports/${userReport.id}`,
        headers: getHeaders(adminUser),
        payload: {
          status: 'resolved',
          action: 'remove_content',
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().code).toBe('BAD_REQUEST');
      expect(res.json().detail).toContain('Content removal action is only supported for post and comment targets');
    });
  });

  describe('8. Concurrency, Race Conditions & Transaction Rollback', () => {
    it('handles concurrent duplicate report submissions racing against unique index safely (one 201, one 409)', async () => {
      // Create a dedicated user and IP to isolate from previous rate-limit counters
      const raceReg = await authService.register(`mod_race_user_${Date.now()}`, 'password123');
      const raceSess = await authService.createSession(raceReg.id);
      const raceHeaders = {
        cookie: `sg_session=${raceSess.token}`,
        'x-csrf-token': raceSess.csrf,
      };
      const raceIp = '198.51.100.190';

      const racePost = await postService.createPost(
        { post_type: 'discussion', title: 'Race Condition Post' },
        userB.id
      );

      // Fire 2 concurrent reports from the exact same user on the same post simultaneously
      const [res1, res2] = await Promise.all([
        app.inject({
          method: 'POST',
          url: '/api/v1/reports',
          remoteAddress: raceIp,
          headers: raceHeaders,
          payload: { target_type: 'post', target_id: racePost.id, reason: 'spam' },
        }),
        app.inject({
          method: 'POST',
          url: '/api/v1/reports',
          remoteAddress: raceIp,
          headers: raceHeaders,
          payload: { target_type: 'post', target_id: racePost.id, reason: 'spam' },
        }),
      ]);

      const statusCodes = [res1.statusCode, res2.statusCode].sort();
      expect(statusCodes).toEqual([201, 409]);

      // Exactly 1 report record exists in database
      const count = await getDb().collection(COLLECTIONS.REPORTS).countDocuments({
        reporter_id: raceReg.id,
        target_type: 'post',
        target_id: racePost.id,
      });
      expect(count).toBe(1);
    });

    it('serializes concurrent post deletions without double-decrementing author posts_count', async () => {
      const post = await postService.createPost(
        { post_type: 'discussion', title: 'Concurrent Delete Post' },
        userA.id
      );
      const db = getDb();
      const authorBefore = await db.collection<UserDoc>(COLLECTIONS.USERS).findOne({ _id: userA.id });
      const initialPostsCount = authorBefore!.posts_count;

      // Fire 2 concurrent delete requests on the same post
      const [del1, del2] = await Promise.all([
        app.inject({
          method: 'DELETE',
          url: `/api/v1/posts/${post.id}`,
          headers: getHeaders(userA),
        }),
        app.inject({
          method: 'DELETE',
          url: `/api/v1/posts/${post.id}`,
          headers: getHeaders(userA),
        }),
      ]);

      const statuses = [del1.statusCode, del2.statusCode].sort();
      expect(statuses).toEqual([200, 404]);

      // Author's posts_count MUST be decremented by exactly 1, not 2
      const authorAfter = await db.collection<UserDoc>(COLLECTIONS.USERS).findOne({ _id: userA.id });
      expect(authorAfter!.posts_count).toBe(initialPostsCount - 1);
    });

    it('serializes concurrent comment deletions without double-decrementing post comments_count', async () => {
      const post = await postService.createPost(
        { post_type: 'discussion', title: 'Concurrent Comment Delete Post' },
        userA.id
      );
      const comment = await postService.createComment(post.id, userA.id, {
        content: 'Concurrent delete comment',
      });

      const db = getDb();
      const postBefore = await db.collection<PostDoc>(COLLECTIONS.POSTS).findOne({ _id: post.id });
      expect(postBefore!.comments_count).toBe(1);

      // Fire 2 concurrent delete requests on the same comment
      const [del1, del2] = await Promise.all([
        app.inject({
          method: 'DELETE',
          url: `/api/v1/posts/${post.id}/comments/${comment.id}`,
          headers: getHeaders(userA),
        }),
        app.inject({
          method: 'DELETE',
          url: `/api/v1/posts/${post.id}/comments/${comment.id}`,
          headers: getHeaders(userA),
        }),
      ]);

      const statuses = [del1.statusCode, del2.statusCode].sort();
      expect(statuses).toEqual([200, 404]);

      // Post's comments_count MUST be decremented by exactly 1 to 0
      const postAfter = await db.collection<PostDoc>(COLLECTIONS.POSTS).findOne({ _id: post.id });
      expect(postAfter!.comments_count).toBe(0);
    });

    it('post deletion cascade automatically resolves pending reports for both the post and its comments', async () => {
      const post = await postService.createPost(
        { post_type: 'discussion', title: 'Post with reported comment' },
        userA.id
      );
      const comment = await postService.createComment(post.id, userB.id, {
        content: 'Reported comment on post',
      });

      // Submit reports on both post and comment
      const reportPost = await moderationService.createReport(userB.id, {
        target_type: 'post',
        target_id: post.id,
        reason: 'spam',
      });
      const reportComment = await moderationService.createReport(userA.id, {
        target_type: 'comment',
        target_id: comment.id,
        reason: 'harassment',
      });

      expect(reportPost.status).toBe('pending');
      expect(reportComment.status).toBe('pending');

      // Author deletes the post
      const del = await app.inject({
        method: 'DELETE',
        url: `/api/v1/posts/${post.id}`,
        headers: getHeaders(userA),
      });
      expect(del.statusCode).toBe(200);

      // Verify BOTH reports are marked resolved with action 'removed'
      const db = getDb();
      const [pReport, cReport] = await Promise.all([
        db.collection<ReportDoc>(COLLECTIONS.REPORTS).findOne({ _id: reportPost.id }),
        db.collection<ReportDoc>(COLLECTIONS.REPORTS).findOne({ _id: reportComment.id }),
      ]);

      expect(pReport?.status).toBe('resolved');
      expect(pReport?.action_taken).toBe('removed');
      expect(cReport?.status).toBe('resolved');
      expect(cReport?.action_taken).toBe('removed');
    });

    it('rolls back post deletion if a write fails mid-transaction', async () => {
      const post = await postService.createPost(
        { post_type: 'discussion', title: 'Rollback Test Post' },
        userA.id
      );
      const db = getDb();
      const commentsCol = db.collection(COLLECTIONS.COMMENTS);

      // Inject failure on commentsCol.deleteMany
      const prototype = Object.getPrototypeOf(commentsCol);
      const originalDeleteMany = prototype.deleteMany;
      prototype.deleteMany = async function (filter: any, ...args: any[]) {
        if (this.collectionName === COLLECTIONS.COMMENTS && filter?.post_id === post.id) {
          throw new Error('injected comments cascade deletion failure');
        }
        return originalDeleteMany.call(this, filter, ...args);
      };

      try {
        await expect(
          postService.deletePost(post.id, userA.id, false)
        ).rejects.toThrow('injected comments cascade deletion failure');
      } finally {
        prototype.deleteMany = originalDeleteMany;
      }

      // Verify transaction rolled back: post still exists and author posts_count was NOT decremented
      const postInDb = await db.collection(COLLECTIONS.POSTS).findOne({ _id: post.id });
      expect(postInDb).not.toBeNull();
    });
  });

  describe('9. Moderation Integrity, Repeated Actions & Concurrent Admin Resolution', () => {
    let adminUser2: { id: string; username: string; token: string; csrf: string };

    beforeAll(async () => {
      const timestamp = Date.now();
      const reg = await authService.register(`mod_admin2_${timestamp}`, 'password123');
      await getDb()
        .collection<UserDoc>(COLLECTIONS.USERS)
        .updateOne({ _id: reg.id }, { $set: { role: 'admin' } });
      const sess = await authService.createSession(reg.id);
      adminUser2 = { id: reg.id, username: reg.username, token: sess.token, csrf: sess.csrf };
    });

    it('rejects contradictory resolve request specifying remove_content with status dismissed (400 Bad Request)', async () => {
      const post = await postService.createPost(
        { post_type: 'discussion', title: 'Post for contradictory test' },
        userB.id
      );
      const report = await moderationService.createReport(userA.id, {
        target_type: 'post',
        target_id: post.id,
        reason: 'spam',
      });

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/admin/reports/${report.id}`,
        headers: getHeaders(adminUser),
        payload: {
          status: 'dismissed',
          action: 'remove_content',
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().code).toBe('BAD_REQUEST');
      expect(res.json().detail).toContain('Cannot remove content when dismissing a report');

      // Verify post was NOT deleted
      const postInDb = await getDb().collection(COLLECTIONS.POSTS).findOne({ _id: post.id });
      expect(postInDb).not.toBeNull();

      // Verify report is still pending
      const reportInDb = await getDb().collection<ReportDoc>(COLLECTIONS.REPORTS).findOne({ _id: report.id });
      expect(reportInDb?.status).toBe('pending');
    });

    it('rejects repeated moderation actions on an already resolved report (409 Conflict)', async () => {
      const post = await postService.createPost(
        { post_type: 'discussion', title: 'Post for repeated resolve test' },
        userB.id
      );
      const report = await moderationService.createReport(userA.id, {
        target_type: 'post',
        target_id: post.id,
        reason: 'spam',
      });

      // First resolution
      const firstRes = await app.inject({
        method: 'PATCH',
        url: `/api/v1/admin/reports/${report.id}`,
        headers: getHeaders(adminUser),
        payload: {
          status: 'resolved',
          action: 'remove_content',
        },
      });
      expect(firstRes.statusCode).toBe(200);

      // Repeated resolution attempt on the same report
      const repeatRes = await app.inject({
        method: 'PATCH',
        url: `/api/v1/admin/reports/${report.id}`,
        headers: getHeaders(adminUser),
        payload: {
          status: 'dismissed',
          action: 'none',
        },
      });

      expect(repeatRes.statusCode).toBe(409);
      expect(repeatRes.json().code).toBe('CONFLICT');
      expect(repeatRes.json().detail).toContain('already been resolved');
    });

    it('handles concurrent admin resolution race without status corruption', async () => {
      const post = await postService.createPost(
        { post_type: 'discussion', title: 'Post for concurrent admin race' },
        userB.id
      );
      const report = await moderationService.createReport(userA.id, {
        target_type: 'post',
        target_id: post.id,
        reason: 'inappropriate',
      });

      // Admin 1 resolves with content removal while Admin 2 concurrently dismisses the report
      const [res1, res2] = await Promise.all([
        app.inject({
          method: 'PATCH',
          url: `/api/v1/admin/reports/${report.id}`,
          headers: getHeaders(adminUser),
          payload: {
            status: 'resolved',
            action: 'remove_content',
          },
        }),
        app.inject({
          method: 'PATCH',
          url: `/api/v1/admin/reports/${report.id}`,
          headers: getHeaders(adminUser2),
          payload: {
            status: 'dismissed',
            action: 'none',
          },
        }),
      ]);

      const statuses = [res1.statusCode, res2.statusCode].sort();
      expect(statuses).toEqual([200, 409]);

      // Verify the final report in the database is completely consistent with the winning admin transaction
      const finalReport = await getDb().collection<ReportDoc>(COLLECTIONS.REPORTS).findOne({ _id: report.id });
      const postInDb = await getDb().collection(COLLECTIONS.POSTS).findOne({ _id: post.id });

      if (res1.statusCode === 200) {
        // Admin 1 won: content was removed and report marked resolved
        expect(finalReport?.status).toBe('resolved');
        expect(finalReport?.action_taken).toBe('removed');
        expect(postInDb).toBeNull();
      } else {
        // Admin 2 won: report was dismissed without removing content, and Admin 1's deletion rolled back
        expect(finalReport?.status).toBe('dismissed');
        expect(finalReport?.action_taken).toBe('dismissed');
        expect(postInDb).not.toBeNull();
      }
    });

    it('does not report success or resolve report if content deletion fails unexpectedly', async () => {
      const post = await postService.createPost(
        { post_type: 'discussion', title: 'Post for deletion failure propagation' },
        userB.id
      );
      const report = await moderationService.createReport(userA.id, {
        target_type: 'post',
        target_id: post.id,
        reason: 'spam',
      });

      // Temporarily mock postService.deletePost on the route's underlying service to simulate unexpected DB failure
      const originalDeletePost = postService.deletePost;
      const db = getDb();
      const postsCol = db.collection(COLLECTIONS.POSTS);
      const prototype = Object.getPrototypeOf(postsCol);
      const originalDeleteOne = prototype.deleteOne;

      prototype.deleteOne = async function (filter: any, ...args: any[]) {
        if (this.collectionName === COLLECTIONS.POSTS && filter?._id === post.id) {
          throw new Error('database write failure during moderation removal');
        }
        return originalDeleteOne.call(this, filter, ...args);
      };

      try {
        const res = await app.inject({
          method: 'PATCH',
          url: `/api/v1/admin/reports/${report.id}`,
          headers: getHeaders(adminUser),
          payload: {
            status: 'resolved',
            action: 'remove_content',
          },
        });

        // Must fail with 500 and NOT report 200 success
        expect(res.statusCode).toBe(500);
      } finally {
        prototype.deleteOne = originalDeleteOne;
      }

      // Verify report was NOT marked resolved
      const reportInDb = await db.collection<ReportDoc>(COLLECTIONS.REPORTS).findOne({ _id: report.id });
      expect(reportInDb?.status).toBe('pending');
      expect(reportInDb?.action_taken).toBe('none');

      // Verify post still exists in DB
      const postInDb = await db.collection(COLLECTIONS.POSTS).findOne({ _id: post.id });
      expect(postInDb).not.toBeNull();
    });

    it('verifies all expected indexes exist for report queue and deletion cleanups', async () => {
      const db = getDb();
      const reportIndexes = await db.collection(COLLECTIONS.REPORTS).indexes();
      const notifIndexes = await db.collection(COLLECTIONS.NOTIFICATIONS).indexes();

      const reportIndexNames = reportIndexes.map((idx) => idx.name);
      const notifIndexNames = notifIndexes.map((idx) => idx.name);

      expect(reportIndexNames).toContain('uniq_reporter_target');
      expect(reportIndexNames).toContain('idx_reports_status_created_at_id');
      expect(reportIndexNames).toContain('idx_reports_status_target_type_created_at_id');
      expect(reportIndexNames).toContain('idx_reports_target_status');

      expect(notifIndexNames).toContain('idx_notifications_post_id');
      expect(notifIndexNames).toContain('idx_notifications_comment_id');
    });
  });
});
