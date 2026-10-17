import type { Db, Filter, Sort } from 'mongodb';
import type { FeedQuery, FeedResponse, DiscoveryQuery, DiscoveryResponse, VisualPinCard } from '@socialgraph/shared';
import { getDb } from '../db/mongo.js';
import { COLLECTIONS } from '../db/collections.js';
import type { PostDoc, UserDoc, FollowDoc, PostVoteDoc, PostSaveDoc } from '../db/types.js';
import { toUserSummary, toPostCard } from '../db/serialization.js';
import {
  buildCursorFilter,
  encodePostCursor,
  decodeCursor,
  encodeCursor,
} from '../utils/pagination.js';

export class FeedService {
  private get db(): Db {
    return getDb();
  }

  public async getFeed(query: FeedQuery = {}, currentUserId?: string): Promise<FeedResponse> {
    const start = performance.now();
    const sort = query.sort || 'hot';
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const scope = query.scope || 'all';

    const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);
    const followsCol = this.db.collection<FollowDoc>(COLLECTIONS.FOLLOWS);
    const votesCol = this.db.collection<PostVoteDoc>(COLLECTIONS.POST_VOTES);
    const savesCol = this.db.collection<PostSaveDoc>(COLLECTIONS.POST_SAVES);

    // 1. Build scope filter
    let scopeFilter: Filter<PostDoc> = {};
    if (scope === 'following') {
      if (!currentUserId) {
        return {
          success: true,
          data: [],
          next_cursor: null,
          has_more: false,
          meta: { count: 0, server_execution_time_ms: Number((performance.now() - start).toFixed(2)) },
        };
      }
      const follows = await followsCol.find({ follower_id: currentUserId }).toArray();
      const targetUserIds = follows.map((f) => f.target_user_id);
      if (targetUserIds.length === 0) {
        return {
          success: true,
          data: [],
          next_cursor: null,
          has_more: false,
          meta: { count: 0, server_execution_time_ms: Number((performance.now() - start).toFixed(2)) },
        };
      }
      scopeFilter = { author_id: { $in: targetUserIds } };
    } else if (scope === 'communities') {
      scopeFilter = { community_id: { $exists: true, $ne: null as any } };
    }

    // 2. Build cursor filter
    const cursorFilter = buildCursorFilter(sort, query.cursor);

    // Combine filters
    let finalFilter: Filter<PostDoc> = scopeFilter;
    if (cursorFilter) {
      finalFilter = Object.keys(scopeFilter).length > 0 ? { $and: [scopeFilter, cursorFilter] } : cursorFilter;
    }

    // 3. Determine MongoDB Sort
    let sortSpec: Sort = { hot_score: -1, created_at: -1, _id: -1 };
    if (sort === 'new') {
      sortSpec = { created_at: -1, _id: -1 };
    } else if (sort === 'top') {
      sortSpec = { score: -1, created_at: -1, _id: -1 };
    }

    // 4. Query limit + 1 items
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

    // 5. Batch resolve authors
    const authorIds = [...new Set(pageDocs.map((p) => p.author_id))];
    const authors = await usersCol.find({ _id: { $in: authorIds } }).toArray();
    const authorMap = new Map(authors.map((u) => [u._id, toUserSummary(u)]));

    // 6. Batch resolve user votes and bookmarks
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

    // 7. Serialize to PostCard
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

  public async getDiscovery(query: DiscoveryQuery = {}, currentUserId?: string): Promise<DiscoveryResponse> {
    const start = performance.now();
    const limit = Math.min(Math.max(query.limit ?? 12, 1), 100);
    const { category, tag, cursor } = query;

    const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);
    const votesCol = this.db.collection<PostVoteDoc>(COLLECTIONS.POST_VOTES);
    const savesCol = this.db.collection<PostSaveDoc>(COLLECTIONS.POST_SAVES);

    let filter: Filter<PostDoc> = { post_type: 'visual' };

    if (category && category !== 'all') {
      filter.community_slug = category;
    }
    if (tag) {
      filter.tags = tag;
    }

    if (cursor) {
      const decoded = decodeCursor(cursor, 'discovery');
      const cursorDate = new Date(decoded.createdAt);
      const cursorFilter: Filter<PostDoc> = {
        $or: [
          { created_at: { $lt: cursorDate } },
          { created_at: cursorDate, _id: { $lt: decoded.id } },
        ],
      };
      filter = { $and: [filter, cursorFilter] };
    }

    const sortSpec: Sort = { created_at: -1, _id: -1 };
    const rawDocs = await postsCol.find(filter).sort(sortSpec).limit(limit + 1).toArray();
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

    let voteMap = new Map<string, 1 | -1 | 0>();
    let saveSet = new Set<string>();

    if (currentUserId) {
      const postIds = pageDocs.map((p) => p._id);
      const [votes, saves] = await Promise.all([
        votesCol.find({ user_id: currentUserId, post_id: { $in: postIds } }).toArray(),
        savesCol.find({ user_id: currentUserId, post_id: { $in: postIds } }).toArray(),
      ]);
      for (const v of votes) voteMap.set(v.post_id, v.direction);
      for (const s of saves) saveSet.add(s.post_id);
    }

    const data: VisualPinCard[] = pageDocs.map((post) => {
      const author = authorMap.get(post.author_id) || {
        id: post.author_id,
        username: 'unknown',
        display_name: 'Unknown User',
        avatar_url: '/avatars/alex-dev.svg',
        is_verified: false,
      };
      return toPostCard(post, author, voteMap.get(post._id) ?? 0, saveSet.has(post._id)) as VisualPinCard;
    });

    const nextCursor =
      hasMore && pageDocs.length > 0
        ? encodeCursor({
            t: 'discovery',
            createdAt: pageDocs[pageDocs.length - 1].created_at.toISOString(),
            id: pageDocs[pageDocs.length - 1]._id,
          })
        : null;

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
}
