import type { Db, Filter, Sort } from 'mongodb';
import { AppError, type Community, type FeedQuery, type FeedResponse } from '@socialgraph/shared';
import { getDb } from '../db/mongo.js';
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

    return toCommunity(comm, isMember);
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

  public async toggleMembership(
    communitySlug: string,
    userId: string
  ): Promise<{ community_id: string; is_member: boolean; members_count: number }> {
    const commsCol = this.db.collection<CommunityDoc>(COLLECTIONS.COMMUNITIES);
    const membershipsCol = this.db.collection<CommunityMembershipDoc>(
      COLLECTIONS.COMMUNITY_MEMBERSHIPS
    );

    const comm = await commsCol.findOne({ slug: communitySlug });
    if (!comm) {
      throw AppError.notFound(`Community with slug '${communitySlug}' not found`);
    }

    const existing = await membershipsCol.findOne({
      user_id: userId,
      community_id: comm._id,
    });

    if (existing) {
      await membershipsCol.deleteOne({
        user_id: userId,
        community_id: comm._id,
      });
      const updated = await commsCol.findOneAndUpdate(
        { _id: comm._id },
        { $inc: { members_count: -1 } },
        { returnDocument: 'after' }
      );
      return {
        community_id: comm._id,
        is_member: false,
        members_count: Math.max(updated?.members_count ?? 0, 0),
      };
    }

    await membershipsCol.insertOne({
      _id: `mbr_${userId}_${comm._id}`,
      user_id: userId,
      community_id: comm._id,
      created_at: new Date(),
    });

    const updated = await commsCol.findOneAndUpdate(
      { _id: comm._id },
      { $inc: { members_count: 1 } },
      { returnDocument: 'after' }
    );

    return {
      community_id: comm._id,
      is_member: true,
      members_count: updated?.members_count ?? (comm.members_count + 1),
    };
  }
}
