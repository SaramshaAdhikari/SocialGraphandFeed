import type { Db, Filter, Sort } from 'mongodb';
import {
  AppError,
  type UserProfile,
  type FeedQuery,
  type FeedResponse,
  type FollowToggleResponse,
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

    return toUserProfile(user, isFollowing);
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
      if (existing) {
        const deleted = await followsCol.deleteOne({ ...filter, _id: existing._id }, { session });
        if (deleted.deletedCount) {
          await usersCol.updateOne({ _id: targetUserId }, { $inc: { followers_count: -1 } }, { session });
          await usersCol.updateOne({ _id: currentUserId }, { $inc: { following_count: -1 } }, { session });
        }
        const updated = await usersCol.findOne({ _id: targetUserId }, { session });
        return { target_user_id: targetUserId, is_following: false, followers_count: Math.max(updated?.followers_count ?? 0, 0) };
      }

      await followsCol.insertOne({
        _id: `flw_${currentUserId}_${targetUserId}`,
        ...filter,
        created_at: new Date(),
      }, { session });
      await usersCol.updateOne({ _id: targetUserId }, { $inc: { followers_count: 1 } }, { session });
      await usersCol.updateOne({ _id: currentUserId }, { $inc: { following_count: 1 } }, { session });
      const updated = await usersCol.findOne({ _id: targetUserId }, { session });
      return { target_user_id: targetUserId, is_following: true, followers_count: updated?.followers_count ?? targetUser.followers_count + 1 };
    });
  }
}
