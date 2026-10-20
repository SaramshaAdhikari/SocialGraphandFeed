import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { connectMongo, disconnectMongo, getDb } from '../src/db/mongo.js';
import { connectRedis, disconnectRedis } from '../src/cache/redis.js';
import { requiredTestServiceUrl } from './test-env.js';
import { AuthService } from '../src/services/AuthService.js';
import { UserService } from '../src/services/UserService.js';
import { PostService } from '../src/services/PostService.js';
import { NotificationService } from '../src/services/NotificationService.js';
import { ensureIndexes } from '../src/db/indexes.js';
import { COLLECTIONS } from '../src/db/collections.js';
import type { NotificationDoc, UserDoc, PostDoc } from '../db/types.js';

describe('Persistent Social Notifications Integration Suite', () => {
  let app: FastifyInstance;
  let authService: AuthService;
  let userService: UserService;
  let postService: PostService;
  let notificationService: NotificationService;

  let userA: { id: string; username: string; token: string; csrf: string };
  let userB: { id: string; username: string; token: string; csrf: string };
  let userC: { id: string; username: string; token: string; csrf: string };

  const getHeaders = (user: { token: string; csrf: string }) => ({
    cookie: `sg_session=${user.token}`,
    'x-csrf-token': user.csrf,
  });

  beforeAll(async () => {
    await connectMongo(requiredTestServiceUrl('MONGODB_TEST_URI'), 'socialgraph_notifications_test');
    const redis = connectRedis(requiredTestServiceUrl('REDIS_TEST_URL'));
    if (redis.status === 'wait') await redis.connect().catch(() => {});
    await redis.flushdb().catch(() => {});

    await ensureIndexes(getDb());

    authService = new AuthService();
    userService = new UserService();
    postService = new PostService();
    notificationService = new NotificationService();

    app = buildApp({}, { devUserBypass: false });
    await app.ready();

    // Create 3 distinct test users
    const timestamp = Date.now();
    const [regA, regB, regC] = await Promise.all([
      authService.register(`notif_user_a_${timestamp}`, 'password123'),
      authService.register(`notif_user_b_${timestamp}`, 'password123'),
      authService.register(`notif_user_c_${timestamp}`, 'password123'),
    ]);

    const [sessA, sessB, sessC] = await Promise.all([
      authService.createSession(regA.id),
      authService.createSession(regB.id),
      authService.createSession(regC.id),
    ]);

    userA = { id: regA.id, username: regA.username, token: sessA.token, csrf: sessA.csrf };
    userB = { id: regB.id, username: regB.username, token: sessB.token, csrf: sessB.csrf };
    userC = { id: regC.id, username: regC.username, token: sessC.token, csrf: sessC.csrf };
  });

  afterAll(async () => {
    if (app) await app.close();
    await getDb().dropDatabase().catch(() => {});
    await disconnectMongo();
    await disconnectRedis();
  });

  describe('1. Supported Notification Interactions', () => {
    it('creates a follow notification when User A follows User B', async () => {
      const followRes = await userService.toggleFollow(userB.id, userA.id);
      expect(followRes.is_following).toBe(true);

      const notifs = await notificationService.getNotifications(userB.id);
      expect(notifs.data.length).toBeGreaterThanOrEqual(1);

      const followNotif = notifs.data.find((n) => n.type === 'follow' && n.actor_id === userA.id);
      expect(followNotif).toBeDefined();
      expect(followNotif?.recipient_id).toBe(userB.id);
      expect(followNotif?.read).toBe(false);
      expect(followNotif?.actor?.username).toBe(userA.username);
    });

    it('creates a comment notification when User A comments on User B post', async () => {
      // User B creates a post
      const post = await postService.createPost(
        {
          post_type: 'discussion',
          title: 'Post by User B',
          content: 'Discussion post content',
        },
        userB.id
      );

      // User A comments on User B's post
      const comment = await postService.createComment(post.id, userA.id, {
        content: 'Great post by User B!',
      });

      const notifs = await notificationService.getNotifications(userB.id);
      const commentNotif = notifs.data.find(
        (n) => n.type === 'comment' && n.actor_id === userA.id && n.post_id === post.id
      );

      expect(commentNotif).toBeDefined();
      expect(commentNotif?.recipient_id).toBe(userB.id);
      expect(commentNotif?.comment_id).toBe(comment.id);
      expect(commentNotif?.read).toBe(false);
    });

    it('creates a reply notification when User A replies to User B comment', async () => {
      // User C creates a post
      const post = await postService.createPost(
        {
          post_type: 'discussion',
          title: 'Community thread by C',
          content: 'Thread content',
        },
        userC.id
      );

      // User B creates a top-level comment
      const parentComment = await postService.createComment(post.id, userB.id, {
        content: 'Top-level comment from User B',
      });

      // User A replies to User B's comment
      const reply = await postService.createComment(post.id, userA.id, {
        content: 'Reply to User B',
        parent_id: parentComment.id,
      });

      // User B (parent comment author) should receive reply notification
      const notifsB = await notificationService.getNotifications(userB.id);
      const replyNotif = notifsB.data.find(
        (n) => n.type === 'reply' && n.actor_id === userA.id && n.comment_id === reply.id
      );

      expect(replyNotif).toBeDefined();
      expect(replyNotif?.recipient_id).toBe(userB.id);
      expect(replyNotif?.post_id).toBe(post.id);
    });
  });

  describe('2. Self-Interaction Suppression', () => {
    it('does not create a notification when a user comments on their own post', async () => {
      const initialCount = await notificationService.getUnreadCount(userA.id);

      const post = await postService.createPost(
        {
          post_type: 'discussion',
          title: 'Author own post',
          content: 'Author content',
        },
        userA.id
      );

      await postService.createComment(post.id, userA.id, {
        content: 'Comment on my own post',
      });

      const newCount = await notificationService.getUnreadCount(userA.id);
      expect(newCount).toBe(initialCount);
    });

    it('does not create a notification when a user replies to their own comment', async () => {
      const initialCount = await notificationService.getUnreadCount(userA.id);

      const post = await postService.createPost(
        {
          post_type: 'discussion',
          title: 'Post by B for self-reply test',
        },
        userB.id
      );

      const parentComment = await postService.createComment(post.id, userA.id, {
        content: 'User A top comment',
      });

      await postService.createComment(post.id, userA.id, {
        content: 'User A replies to User A comment',
        parent_id: parentComment.id,
      });

      const newCount = await notificationService.getUnreadCount(userA.id);
      expect(newCount).toBe(initialCount);
    });
  });

  describe('3. Duplicate Prevention & Idempotency', () => {
    it('does not duplicate follow notifications when a user unfollows and follows again', async () => {
      // User C follows User B
      await userService.setFollow(userB.id, userC.id, true);
      const notifs1 = await notificationService.getNotifications(userB.id);
      const cFollowNotifs1 = notifs1.data.filter((n) => n.type === 'follow' && n.actor_id === userC.id);
      expect(cFollowNotifs1.length).toBe(1);

      // User C unfollows
      await userService.setFollow(userB.id, userC.id, false);

      // User C follows again
      await userService.setFollow(userB.id, userC.id, true);
      const notifs2 = await notificationService.getNotifications(userB.id);
      const cFollowNotifs2 = notifs2.data.filter((n) => n.type === 'follow' && n.actor_id === userC.id);
      expect(cFollowNotifs2.length).toBe(1);
    });

    it('does not duplicate comment notifications on idempotent retries', async () => {
      const post = await postService.createPost(
        {
          post_type: 'discussion',
          title: 'Idempotency Post',
        },
        userB.id
      );

      const idempKey = `idemp_cmt_${Date.now()}`;
      const cmt1 = await postService.createComment(post.id, userA.id, { content: 'Unique comment' }, idempKey);
      const cmt2 = await postService.createComment(post.id, userA.id, { content: 'Unique comment' }, idempKey);

      expect(cmt1.id).toBe(cmt2.id);

      const notifs = await notificationService.getNotifications(userB.id);
      const matching = notifs.data.filter((n) => n.comment_id === cmt1.id);
      expect(matching.length).toBe(1);
    });
  });

  describe('4. Pagination & Reverse-Chronological Ordering', () => {
    it('retrieves notifications ordered newest-first with cursor pagination', async () => {
      // Generate multiple distinct notifications for User C
      const targetUser = userC;
      for (let i = 0; i < 4; i++) {
        await notificationService.createNotification({
          recipient_id: targetUser.id,
          actor_id: userA.id,
          type: 'comment',
          post_id: `post_page_test`,
          comment_id: `cmt_page_test_${i}_${Date.now()}`,
        });
        // Slight delay to ensure distinct timestamps
        await new Promise((r) => setTimeout(r, 10));
      }

      // Page 1 with limit 2
      const page1Res = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications?limit=2',
        headers: getHeaders(targetUser),
      });

      expect(page1Res.statusCode).toBe(200);
      const page1 = page1Res.json();
      expect(page1.success).toBe(true);
      expect(page1.data.length).toBe(2);
      expect(page1.has_more).toBe(true);
      expect(page1.next_cursor).toBeTruthy();

      // Page 2 using next_cursor
      const page2Res = await app.inject({
        method: 'GET',
        url: `/api/v1/notifications?limit=2&cursor=${page1.next_cursor}`,
        headers: getHeaders(targetUser),
      });

      expect(page2Res.statusCode).toBe(200);
      const page2 = page2Res.json();
      expect(page2.success).toBe(true);
      expect(page2.data.length).toBeGreaterThanOrEqual(1);

      // Verify strict descending chronological order across pages
      const date1 = new Date(page1.data[0].created_at).getTime();
      const date2 = new Date(page1.data[1].created_at).getTime();
      const date3 = new Date(page2.data[0].created_at).getTime();
      expect(date1).toBeGreaterThanOrEqual(date2);
      expect(date2).toBeGreaterThanOrEqual(date3);
    });

    it('rejects malformed pagination cursors with HTTP 400', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications?cursor=not-a-valid-base64-cursor',
        headers: getHeaders(userA),
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().code).toBe('BAD_REQUEST');
    });
  });

  describe('5. Unread Counts & State Transitions', () => {
    it('tracks unread counts and marks an individual notification as read', async () => {
      // Get initial unread count for User B
      const initialCountRes = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications/unread-count',
        headers: getHeaders(userB),
      });
      expect(initialCountRes.statusCode).toBe(200);
      const initialCount = initialCountRes.json().unread_count;
      expect(initialCount).toBeGreaterThan(0);

      // Retrieve first unread notification
      const listRes = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications?unread_only=true',
        headers: getHeaders(userB),
      });
      const unreadItem = listRes.json().data[0];
      expect(unreadItem.read).toBe(false);

      // Mark single notification as read
      const markRes = await app.inject({
        method: 'PATCH',
        url: `/api/v1/notifications/${unreadItem.id}/read`,
        headers: getHeaders(userB),
      });
      expect(markRes.statusCode).toBe(200);
      const markData = markRes.json();
      expect(markData.success).toBe(true);
      expect(markData.notification.read).toBe(true);
      expect(markData.notification.read_at).toBeTruthy();

      // Verify unread count decremented
      const updatedCountRes = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications/unread-count',
        headers: getHeaders(userB),
      });
      expect(updatedCountRes.json().unread_count).toBe(initialCount - 1);
    });

    it('marks all notifications as read via PATCH /notifications/read-all', async () => {
      const markAllRes = await app.inject({
        method: 'PATCH',
        url: '/api/v1/notifications/read-all',
        headers: getHeaders(userB),
      });

      expect(markAllRes.statusCode).toBe(200);
      expect(markAllRes.json().success).toBe(true);
      expect(markAllRes.json().updated_count).toBeGreaterThanOrEqual(1);

      // Verify unread count is now 0
      const finalCountRes = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications/unread-count',
        headers: getHeaders(userB),
      });
      expect(finalCountRes.json().unread_count).toBe(0);

      // Verify unread_only query returns empty
      const unreadListRes = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications?unread_only=true',
        headers: getHeaders(userB),
      });
      expect(unreadListRes.json().data.length).toBe(0);
    });
  });

  describe('6. Authorization and Privacy Boundaries', () => {
    it('rejects unauthenticated requests to notifications endpoints with HTTP 401', async () => {
      const listRes = await app.inject({ method: 'GET', url: '/api/v1/notifications' });
      expect(listRes.statusCode).toBe(401);

      const countRes = await app.inject({ method: 'GET', url: '/api/v1/notifications/unread-count' });
      expect(countRes.statusCode).toBe(401);

      const markRes = await app.inject({ method: 'PATCH', url: '/api/v1/notifications/some_id/read' });
      expect(markRes.statusCode).toBe(401);

      const markAllRes = await app.inject({ method: 'PATCH', url: '/api/v1/notifications/read-all' });
      expect(markAllRes.statusCode).toBe(401);
    });

    it('prevents User A from marking User B notification as read (returns 404 NOT_FOUND)', async () => {
      // Create a notification specifically for User B
      const notifB = await notificationService.createNotification({
        recipient_id: userB.id,
        actor_id: userC.id,
        type: 'follow',
      });
      expect(notifB).toBeDefined();

      // User A attempts to mark User B's notification as read
      const forbiddenRes = await app.inject({
        method: 'PATCH',
        url: `/api/v1/notifications/${notifB!._id}/read`,
        headers: getHeaders(userA),
      });

      expect(forbiddenRes.statusCode).toBe(404);
      expect(forbiddenRes.json().code).toBe('NOT_FOUND');

      // Verify notification remains unread for User B
      const notifsB = await notificationService.getNotifications(userB.id);
      const item = notifsB.data.find((n) => n.id === notifB!._id);
      expect(item?.read).toBe(false);
    });

    it('returns 404 NOT_FOUND for non-existent notification IDs', async () => {
      const notFoundRes = await app.inject({
        method: 'PATCH',
        url: '/api/v1/notifications/non_existent_notif_999/read',
        headers: getHeaders(userA),
      });

      expect(notFoundRes.statusCode).toBe(404);
      expect(notFoundRes.json().code).toBe('NOT_FOUND');
    });
  });

  describe('7. Failure Consistency & Transactional Rollback', () => {
    it('does not persist notifications if the originating operation aborts', async () => {
      const beforeCount = await getDb().collection(COLLECTIONS.NOTIFICATIONS).countDocuments();

      // Attempt commenting on a non-existent post (will fail transactionally)
      await expect(
        postService.createComment('non_existent_post_id', userA.id, {
          content: 'Comment on ghost post',
        })
      ).rejects.toThrow();

      const afterCount = await getDb().collection(COLLECTIONS.NOTIFICATIONS).countDocuments();
      expect(afterCount).toBe(beforeCount);
    });
  });
});
