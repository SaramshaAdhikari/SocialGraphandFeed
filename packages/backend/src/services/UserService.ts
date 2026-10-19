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
import type { UserDoc, PostDoc, FollowDoc, PostVoteDoc, PostSaveDoc } from '../db/types.js';
import { toUserSummary, toUserProfile, toPostCard } from '../db/serialization.js';
import { buildCursorFilter, encodePostCursor } from '../utils/pagination.js';

export class UserService {
  private get db(): Db {
    return getDb();
  }

  public async getUserProfile(username: string, currentUserId?: string): Promise<UserProfile> {
    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);
    const followsCol = this.db.collection<FollowDoc>(COLLECTIONS.FOLLOWS);

    const user = await usersCol.findOne({ username });
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
    return { ...toUserProfile(user, isFollowing), followers_count: followersCount, following_count: followingCount, posts_count: postsCount };
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

    return runInTransaction(async (session) => {
      const targetUser = await usersCol.findOne({ _id: targetUserId }, { session });
      const currentUser = await usersCol.findOne({ _id: currentUserId }, { session });
      if (!targetUser) throw AppError.notFound(`Target user ${targetUserId} not found`);
      if (!currentUser) throw AppError.notFound(`Current user ${currentUserId} not found`);

      const filter = { follower_id: currentUserId, target_user_id: targetUserId };
      const existing = await followsCol.findOne(filter, { session });
      if (existing) await followsCol.deleteOne(filter, { session });
      else {
        try { await followsCol.insertOne({ _id: `flw_${currentUserId}_${targetUserId}`, ...filter, created_at: new Date() }, { session }); }
        catch (error: any) { if (error?.code !== 11000) throw error; }
      }
      return { target_user_id: targetUserId, is_following: !existing, followers_count: await followsCol.countDocuments({ target_user_id: targetUserId }, { session }) };
    });
  }

  public async setFollow(targetUserId: string, currentUserId: string, isFollowing: boolean): Promise<FollowToggleResponse> {
    if (targetUserId === currentUserId) throw AppError.badRequest('Users cannot follow themselves');
    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);
    const followsCol = this.db.collection<FollowDoc>(COLLECTIONS.FOLLOWS);
    const [target, current] = await Promise.all([usersCol.findOne({ _id: targetUserId }), usersCol.findOne({ _id: currentUserId })]);
    if (!target) throw AppError.notFound(`Target user ${targetUserId} not found`);
    if (!current) throw AppError.notFound(`Current user ${currentUserId} not found`);
    const filter = { follower_id: currentUserId, target_user_id: targetUserId };
    if (isFollowing) {
      try { await followsCol.insertOne({ _id: `flw_${currentUserId}_${targetUserId}`, ...filter, created_at: new Date() }); }
      catch (error: any) { if (error?.code !== 11000) throw error; }
    } else await followsCol.deleteOne(filter);
    return { target_user_id: targetUserId, is_following: isFollowing, followers_count: await followsCol.countDocuments({ target_user_id: targetUserId }) };
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
}
