import type { Db, Filter, Sort } from 'mongodb';
import {
  AppError,
  type UserProfile,
  type FeedQuery,
  type FeedResponse,
  type FollowToggleResponse,
  type FollowListResponse,
} from '@socialgraph/shared';
import { getDb } from '../db/mongo.js';
import { runInTransaction } from '../db/transaction.js';
import { COLLECTIONS } from '../db/collections.js';
import type { UserDoc, PostDoc, FollowDoc, PostVoteDoc, PostSaveDoc, FeedInboxDoc } from '../db/types.js';
import { toUserSummary, toUserProfile, toPostCard } from '../db/serialization.js';
import { buildCursorFilter, encodePostCursor } from '../utils/pagination.js';
import { getCached, setCachedWithTag, invalidateCachePattern } from '../cache/redis.js';
import { NotificationService } from './NotificationService.js';
import { config } from '../config/env.js';
import { realtimeEventBus } from '../realtime/EventBus.js';

export class UserService {
  private notificationService = new NotificationService();
  private foowThreshold: number;

  constructor(foowThreshold?: number) {
    this.foowThreshold = foowThreshold ?? config.FOOW_MAX_FOLLOWERS_THRESHOLD ?? 500;
  }
  private get db(): Db {
    return getDb();
  }

  public async invalidateUserProfileCache(username: string): Promise<void> {
    const normalized = username.trim().toLowerCase();
    await invalidateCachePattern(
      `cache:user:profile:${normalized}:_keys`,
      `cache:user:profile:${normalized}:*`
    );
  }

  public async getUserProfile(username: string, currentUserId?: string): Promise<UserProfile> {
    const normalizedUsername = username.trim().toLowerCase();
    const cacheKey = `cache:user:profile:${normalizedUsername}:${currentUserId ? `u:${currentUserId}` : 'anon'}`;
    const cached = await getCached<UserProfile>(cacheKey);
    if (cached) return cached;

    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);
    const followsCol = this.db.collection<FollowDoc>(COLLECTIONS.FOLLOWS);

    const user = await usersCol.findOne({
      $or: [{ username: normalizedUsername }, { username }],
    });
    if (!user) {
      throw AppError.notFound(`User with username '${username}' not found`);
    }

    let isFollowing = false;
    if (currentUserId && currentUserId !== user._id) {
      const follow = await followsCol.findOne({
        follower_id: currentUserId,
        target_user_id: user._id,
      });
      isFollowing = Boolean(follow);
    }

    const [followersCount, followingCount, postsCount] = await Promise.all([
      followsCol.countDocuments({ target_user_id: user._id }),
      followsCol.countDocuments({ follower_id: user._id }),
      this.db.collection<PostDoc>(COLLECTIONS.POSTS).countDocuments({ author_id: user._id }),
    ]);

    const profile: UserProfile = {
      ...toUserProfile(user, isFollowing),
      followers_count: followersCount,
      following_count: followingCount,
      posts_count: postsCount,
    };

    await setCachedWithTag(
      cacheKey,
      `cache:user:profile:${user.username.toLowerCase()}:_keys`,
      profile,
      30
    );

    return profile;
  }

  public async getUserPosts(
    username: string,
    query: FeedQuery = {},
    currentUserId?: string
  ): Promise<FeedResponse> {
    const start = performance.now();
    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);
    const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
    const votesCol = this.db.collection<PostVoteDoc>(COLLECTIONS.POST_VOTES);
    const savesCol = this.db.collection<PostSaveDoc>(COLLECTIONS.POST_SAVES);

    const user = await usersCol.findOne({ username });
    if (!user) {
      throw AppError.notFound(`User with username '${username}' not found`);
    }

    const sort = query.sort || 'new';
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);

    const baseFilter: Filter<PostDoc> = { author_id: user._id };
    const cursorFilter = buildCursorFilter(sort, query.cursor);

    const finalFilter: Filter<PostDoc> = cursorFilter
      ? { $and: [baseFilter, cursorFilter] }
      : baseFilter;

    let sortSpec: Sort = { created_at: -1, _id: -1 };
    if (sort === 'top') {
      sortSpec = { score: -1, created_at: -1, _id: -1 };
    } else if (sort === 'hot') {
      sortSpec = { hot_score: -1, created_at: -1, _id: -1 };
    }

    const rawDocs = await postsCol.find(finalFilter).sort(sortSpec).limit(limit + 1).toArray();
    const hasMore = rawDocs.length > limit;
    const pageDocs = hasMore ? rawDocs.slice(0, limit) : rawDocs;

    if (pageDocs.length === 0) {
      return {
        success: true,
        data: [],
        next_cursor: null,
        has_more: false,
        meta: { count: 0, server_execution_time_ms: Number((performance.now() - start).toFixed(2)) },
      };
    }

    const authorSummary = toUserSummary(user);
    const postIds = pageDocs.map((p) => p._id);
    let voteMap = new Map<string, 1 | -1 | 0>();
    let saveSet = new Set<string>();

    if (currentUserId) {
      const [votes, saves] = await Promise.all([
        votesCol.find({ user_id: currentUserId, post_id: { $in: postIds } }).toArray(),
        savesCol.find({ user_id: currentUserId, post_id: { $in: postIds } }).toArray(),
      ]);
      for (const v of votes) voteMap.set(v.post_id, v.direction);
      for (const s of saves) saveSet.add(s.post_id);
    }

    const data = pageDocs.map((p) =>
      toPostCard(p, authorSummary, voteMap.get(p._id) ?? 0, saveSet.has(p._id))
    );

    const nextCursor = hasMore && pageDocs.length > 0 ? encodePostCursor(pageDocs[pageDocs.length - 1], sort) : null;

    return {
      success: true,
      data,
      next_cursor: nextCursor,
      has_more: hasMore,
      meta: {
        count: data.length,
        server_execution_time_ms: Number((performance.now() - start).toFixed(2)),
      },
    };
  }

  public async toggleFollow(
    targetUserId: string,
    currentUserId: string
  ): Promise<FollowToggleResponse> {
    if (targetUserId === currentUserId) {
      throw AppError.badRequest('Users cannot follow themselves');
    }

    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);
    const followsCol = this.db.collection<FollowDoc>(COLLECTIONS.FOLLOWS);

    const res = await runInTransaction(async (session) => {
      const targetUser = await usersCol.findOne({ _id: targetUserId }, { session });
      const currentUser = await usersCol.findOne({ _id: currentUserId }, { session });
      if (!targetUser) throw AppError.notFound(`Target user ${targetUserId} not found`);
      if (!currentUser) throw AppError.notFound(`Current user ${currentUserId} not found`);

      const filter = { follower_id: currentUserId, target_user_id: targetUserId };
      const inboxesCol = this.db.collection<FeedInboxDoc>(COLLECTIONS.FEED_INBOXES);
      const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
      const existing = await followsCol.findOne(filter, { session });
      if (existing) {
        await followsCol.deleteOne(filter, { session });
        await inboxesCol.deleteMany({ user_id: currentUserId, author_id: targetUserId }, { session });
      } else {
        try {
          await followsCol.insertOne({ _id: `flw_${currentUserId}_${targetUserId}`, ...filter, created_at: new Date() }, { session });
          await this.notificationService.createNotification({
            recipient_id: targetUserId,
            actor_id: currentUserId,
            type: 'follow',
            session,
          });
          const targetFollowersCount = await followsCol.countDocuments({ target_user_id: targetUserId }, { session });
          if (targetFollowersCount <= this.foowThreshold) {
            const authorPosts = await postsCol.find({ author_id: targetUserId }, { session }).toArray();
            if (authorPosts.length > 0) {
              const inboxDocs: FeedInboxDoc[] = authorPosts.map((p) => ({
                _id: `inbox_${currentUserId}_${p._id}`,
                user_id: currentUserId,
                post_id: p._id,
                author_id: targetUserId,
                post_type: p.post_type,
                created_at: p.created_at,
                score: p.score,
                hot_score: p.hot_score,
              }));
              await inboxesCol.insertMany(inboxDocs, { ordered: false, session });
            }
          }
        }
        catch (error: any) { if (error?.code !== 11000) throw error; }
      }
      const followersCount = await followsCol.countDocuments({ target_user_id: targetUserId }, { session });
      return {
        target_user_id: targetUserId,
        is_following: !existing,
        followers_count: followersCount,
        target_username: targetUser.username,
        current_username: currentUser.username,
        current_user_id: currentUserId,
      };
    });

    await Promise.all([
      this.invalidateUserProfileCache(res.target_username),
      this.invalidateUserProfileCache(res.current_username),
    ]);
    realtimeEventBus.publish({
      type: res.is_following ? 'follow.created' : 'follow.deleted',
      actor_id: res.current_user_id,
      target_user_id: res.target_user_id,
    });

    return {
      target_user_id: res.target_user_id,
      is_following: res.is_following,
      followers_count: res.followers_count,
    };
  }

  public async setFollow(targetUserId: string, currentUserId: string, isFollowing: boolean): Promise<FollowToggleResponse> {
    if (targetUserId === currentUserId) throw AppError.badRequest('Users cannot follow themselves');
    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);
    const followsCol = this.db.collection<FollowDoc>(COLLECTIONS.FOLLOWS);
    const [target, current] = await Promise.all([usersCol.findOne({ _id: targetUserId }), usersCol.findOne({ _id: currentUserId })]);
    if (!target) throw AppError.notFound(`Target user ${targetUserId} not found`);
    if (!current) throw AppError.notFound(`Current user ${currentUserId} not found`);
    const filter = { follower_id: currentUserId, target_user_id: targetUserId };
    const inboxesCol = this.db.collection<FeedInboxDoc>(COLLECTIONS.FEED_INBOXES);
    const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
    if (isFollowing) {
      try {
        await followsCol.insertOne({ _id: `flw_${currentUserId}_${targetUserId}`, ...filter, created_at: new Date() });
        await this.notificationService.createNotification({
          recipient_id: targetUserId,
          actor_id: currentUserId,
          type: 'follow',
        });
        const targetFollowersCount = await followsCol.countDocuments({ target_user_id: targetUserId });
        if (targetFollowersCount <= this.foowThreshold) {
          const authorPosts = await postsCol.find({ author_id: targetUserId }).toArray();
          if (authorPosts.length > 0) {
            const inboxDocs: FeedInboxDoc[] = authorPosts.map((p) => ({
              _id: `inbox_${currentUserId}_${p._id}`,
              user_id: currentUserId,
              post_id: p._id,
              author_id: targetUserId,
              post_type: p.post_type,
              created_at: p.created_at,
              score: p.score,
              hot_score: p.hot_score,
            }));
            await inboxesCol.insertMany(inboxDocs, { ordered: false });
          }
        }
      }
      catch (error: any) { if (error?.code !== 11000) throw error; }
    } else {
      await followsCol.deleteOne(filter);
      await inboxesCol.deleteMany({ user_id: currentUserId, author_id: targetUserId });
    }
    const followersCount = await followsCol.countDocuments({ target_user_id: targetUserId });

    await Promise.all([
      this.invalidateUserProfileCache(target.username),
      this.invalidateUserProfileCache(current.username),
    ]);
    realtimeEventBus.publish({
      type: isFollowing ? 'follow.created' : 'follow.deleted',
      actor_id: currentUserId,
      target_user_id: targetUserId,
    });

    return { target_user_id: targetUserId, is_following: isFollowing, followers_count: followersCount };
  }

  public async getFollowList(username: string, direction: 'followers' | 'following', currentUserId?: string, cursor?: string | null, requestedLimit = 20): Promise<FollowListResponse> {
    const users = this.db.collection<UserDoc>(COLLECTIONS.USERS);
    const follows = this.db.collection<FollowDoc>(COLLECTIONS.FOLLOWS);
    const target = await users.findOne({ username });
    if (!target) throw AppError.notFound(`User with username '${username}' not found`);
    const limit = Math.min(Math.max(requestedLimit, 1), 50);
    const filter: any = direction === 'followers' ? { target_user_id: target._id } : { follower_id: target._id };
    if (cursor) {
      try { const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString()) as { created_at: string; id: string };
        const date = new Date(decoded.created_at);
        if (!Number.isFinite(date.getTime()) || !decoded.id) throw new Error();
        filter.$or = [{ created_at: { $lt: date } }, { created_at: date, _id: { $lt: decoded.id } }];
      } catch { throw AppError.badRequest('Invalid follow-list cursor'); }
    }
    const [total, edges] = await Promise.all([follows.countDocuments(direction === 'followers' ? { target_user_id: target._id } : { follower_id: target._id }), follows.find(filter).sort({ created_at: -1, _id: -1 }).limit(limit + 1).toArray()]);
    const hasMore = edges.length > limit;
    const page = hasMore ? edges.slice(0, limit) : edges;
    const ids = page.map((edge) => direction === 'followers' ? edge.follower_id : edge.target_user_id);
    const docs = ids.length ? await users.find({ _id: { $in: ids } }).toArray() : [];
    const byId = new Map(docs.map((doc) => [doc._id, doc]));
    const viewerEdges = currentUserId && ids.length ? await follows.find({ follower_id: currentUserId, target_user_id: { $in: ids } }).toArray() : [];
    const viewerFollowing = new Set(viewerEdges.map((edge) => edge.target_user_id));
    const data = ids.flatMap((id) => { const user = byId.get(id); return user ? [{ ...toUserSummary(user), is_following: viewerFollowing.has(id) }] : []; });
    const last = page[page.length - 1];
    return { data, total_count: total, has_more: hasMore, next_cursor: hasMore && last ? Buffer.from(JSON.stringify({ created_at: last.created_at.toISOString(), id: last._id })).toString('base64url') : null };
  }

  public async getGraphNeighborhood(userId: string, requestedLimit = 20): Promise<{
    center: ReturnType<typeof toUserSummary>;
    nodes: ReturnType<typeof toUserSummary>[];
    edges: Array<{ source: string; target: string }>;
  }> {
    const users = this.db.collection<UserDoc>(COLLECTIONS.USERS);
    const follows = this.db.collection<FollowDoc>(COLLECTIONS.FOLLOWS);
    const center = await users.findOne({ _id: userId });
    if (!center) throw AppError.notFound(`User ${userId} not found`);
    const limit = Math.min(Math.max(requestedLimit, 1), 50);
    const directEdges = await follows.find({ $or: [{ follower_id: userId }, { target_user_id: userId }] }).limit(limit * 2).toArray();
    const directIds = new Set<string>([userId]);
    for (const edge of directEdges) {
      directIds.add(edge.follower_id);
      directIds.add(edge.target_user_id);
    }
    const edges = await follows.find({
      $or: [
        { follower_id: { $in: Array.from(directIds) } },
        { target_user_id: { $in: Array.from(directIds) } },
      ],
    }).limit(limit * 4).toArray();
    const nodeIds = new Set<string>([userId]);
    for (const edge of edges) {
      nodeIds.add(edge.follower_id);
      nodeIds.add(edge.target_user_id);
      if (nodeIds.size >= limit + 1) break;
    }
    const boundedIds = new Set(Array.from(nodeIds).slice(0, limit + 1));
    const nodeDocs = await users.find({ _id: { $in: Array.from(boundedIds) } }).toArray();
    const uniqueEdges = new Map<string, { source: string; target: string }>();
    for (const edge of edges) {
      if (boundedIds.has(edge.follower_id) && boundedIds.has(edge.target_user_id)) {
        uniqueEdges.set(edge._id, { source: edge.follower_id, target: edge.target_user_id });
      }
    }
    return { center: toUserSummary(center), nodes: nodeDocs.map(toUserSummary), edges: Array.from(uniqueEdges.values()) };
  }
}
