import { ObjectId, type Db, type Filter, type Sort } from 'mongodb';
import { AppError, type Community, type FeedQuery, type FeedResponse } from '@socialgraph/shared';
import { getDb } from '../db/mongo.js';
import { runInTransaction } from '../db/transaction.js';
import { COLLECTIONS } from '../db/collections.js';
import type {
  CommunityDoc,
  CommunityMembershipDoc,
  PostDoc,
  UserDoc,
  PostVoteDoc,
  PostSaveDoc,
} from '../db/types.js';
import { toCommunity, toUserSummary, toPostCard } from '../db/serialization.js';
import { buildCursorFilter, encodePostCursor } from '../utils/pagination.js';
import { getRedisClient } from '../cache/redis.js';

export class CommunityService {
  private get db(): Db {
    return getDb();
  }

  public async getCommunity(communitySlug: string, currentUserId?: string): Promise<Community> {
    const commsCol = this.db.collection<CommunityDoc>(COLLECTIONS.COMMUNITIES);
    const membershipsCol = this.db.collection<CommunityMembershipDoc>(
      COLLECTIONS.COMMUNITY_MEMBERSHIPS
    );

    const comm = await commsCol.findOne({ slug: communitySlug });
    if (!comm) {
      throw AppError.notFound(`Community with slug '${communitySlug}' not found`);
    }

    let isMember = false;
    if (currentUserId) {
      const membership = await membershipsCol.findOne({
        user_id: currentUserId,
        community_id: comm._id,
      });
      isMember = Boolean(membership);
    }

    const membersCount = await membershipsCol.countDocuments({ community_id: comm._id });
    return toCommunity({ ...comm, members_count: membersCount }, isMember);
  }

  public async getCommunityFeed(
    communitySlug: string,
    query: FeedQuery = {},
    currentUserId?: string
  ): Promise<FeedResponse> {
    const start = performance.now();
    const commsCol = this.db.collection<CommunityDoc>(COLLECTIONS.COMMUNITIES);
    const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);
    const votesCol = this.db.collection<PostVoteDoc>(COLLECTIONS.POST_VOTES);
    const savesCol = this.db.collection<PostSaveDoc>(COLLECTIONS.POST_SAVES);

    const comm = await commsCol.findOne({ slug: communitySlug });
    if (!comm) {
      throw AppError.notFound(`Community with slug '${communitySlug}' not found`);
    }

    const sort = query.sort || 'hot';
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);

    const baseFilter: Filter<PostDoc> = { community_id: comm._id };
    const cursorFilter = buildCursorFilter(sort, query.cursor);

    const finalFilter: Filter<PostDoc> = cursorFilter
      ? { $and: [baseFilter, cursorFilter] }
      : baseFilter;

    let sortSpec: Sort = { hot_score: -1, created_at: -1, _id: -1 };
    if (sort === 'new') {
      sortSpec = { created_at: -1, _id: -1 };
    } else if (sort === 'top') {
      sortSpec = { score: -1, created_at: -1, _id: -1 };
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

    const authorIds = [...new Set(pageDocs.map((p) => p.author_id))];
    const authors = await usersCol.find({ _id: { $in: authorIds } }).toArray();
    const authorMap = new Map(authors.map((u) => [u._id, toUserSummary(u)]));

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

    const data = pageDocs.map((post) => {
      const author = authorMap.get(post.author_id) || {
        id: post.author_id,
        username: 'unknown',
        display_name: 'Unknown User',
        avatar_url: '/avatars/alex-dev.svg',
        is_verified: false,
      };
      return toPostCard(post, author, voteMap.get(post._id) ?? 0, saveSet.has(post._id));
    });

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

  public async getCommunities(currentUserId?: string): Promise<Community[]> {
    const redis = getRedisClient();
    const cacheKey = `cache:communities:${currentUserId || 'anon'}`;
    if (redis) {
      try {
        const hit = await redis.get(cacheKey);
        if (hit) return JSON.parse(hit) as Community[];
      } catch {}
    }

    const commsCol = this.db.collection<CommunityDoc>(COLLECTIONS.COMMUNITIES);
    const membershipsCol = this.db.collection<CommunityMembershipDoc>(
      COLLECTIONS.COMMUNITY_MEMBERSHIPS
    );
    const comms = await commsCol.find({}).toArray();
    if (comms.length === 0) {
      return [];
    }

    const counts = await membershipsCol.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$community_id', count: { $sum: 1 } } },
    ]).toArray();
    const countByCommunityId = new Map(counts.map((item) => [item._id, item.count]));
    const communitiesWithCounts = comms.map((comm) => ({
      ...comm,
      members_count: countByCommunityId.get(comm._id) ?? 0,
    })).sort((a, b) => b.members_count - a.members_count || a.name.localeCompare(b.name));

    let memberCommIds = new Set<string>();
    if (currentUserId) {
      const commIds = communitiesWithCounts.map((c) => c._id);
      const memberships = await membershipsCol
        .find({ user_id: currentUserId, community_id: { $in: commIds } })
        .toArray();
      memberCommIds = new Set(memberships.map((m) => m.community_id));
    }

    const result = communitiesWithCounts.map((comm) => toCommunity(comm, memberCommIds.has(comm._id)));
    if (redis) {
      await redis.set(cacheKey, JSON.stringify(result), 'EX', 30).catch(() => {});
    }
    return result;
  }

  /**
   * Set the desired membership state idempotently. The membership collection
   * is authoritative; members_count is reconciled from its rows in the same
   * transaction so repeated requests cannot drift the counter.
   */
  public async setMembership(
    communitySlug: string,
    userId: string,
    isMember: boolean
  ): Promise<{ community_id: string; is_member: boolean; members_count: number }> {
    const commsCol = this.db.collection<CommunityDoc>(COLLECTIONS.COMMUNITIES);
    const membershipsCol = this.db.collection<CommunityMembershipDoc>(
      COLLECTIONS.COMMUNITY_MEMBERSHIPS
    );
    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);

    const res = await runInTransaction(async (session) => {
      const comm = await commsCol.findOne({ slug: communitySlug }, { session });
      if (!comm) throw AppError.notFound(`Community with slug '${communitySlug}' not found`);
      const user = await usersCol.findOne({ _id: userId }, { session });
      if (!user) throw AppError.notFound(`User ${userId} not found`);

      const filter = { user_id: userId, community_id: comm._id };
      const existing = await membershipsCol.findOne(filter, { session });
      if (isMember && !existing) {
        await membershipsCol.insertOne({
          _id: new ObjectId().toHexString(),
          ...filter,
          created_at: new Date(),
        }, { session });
      } else if (!isMember && existing) {
        await membershipsCol.deleteOne({ ...filter, _id: existing._id }, { session });
      }

      const membersCount = await membershipsCol.countDocuments({ community_id: comm._id }, { session });
      await commsCol.updateOne(
        { _id: comm._id },
        { $set: { members_count: membersCount } },
        { session }
      );
      return { community_id: comm._id, is_member: isMember, members_count: membersCount };
    });

    // Invalidate community cache across users
    const redis = getRedisClient();
    if (redis) {
      try {
        const keys = await redis.keys('cache:communities:*');
        if (keys.length > 0) await redis.del(...keys);
      } catch {}
    }

    return res;
  }
}
