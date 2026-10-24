import type { Db, Filter, Sort } from 'mongodb';
import type { FeedQuery, FeedResponse, DiscoveryQuery, DiscoveryResponse, VisualPinCard } from '@socialgraph/shared';
import { getDb } from '../db/mongo.js';
import { COLLECTIONS } from '../db/collections.js';
import { config } from '../config/env.js';
import type { PostDoc, UserDoc, FollowDoc, PostVoteDoc, PostSaveDoc, FeedInboxDoc, CommunityMembershipDoc } from '../db/types.js';
import { toUserSummary, toPostCard } from '../db/serialization.js';
import {
  buildCursorFilter,
  encodePostCursor,
  decodeCursor,
  encodeCursor,
} from '../utils/pagination.js';

export class FeedService {
  private foowThreshold: number;

  constructor(foowThreshold?: number) {
    this.foowThreshold = foowThreshold ?? config.FOOW_MAX_FOLLOWERS_THRESHOLD ?? 500;
  }

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

    // 1. Check for Fan-Out-on-Write timeline strategy (Section 3.3 and 7.4 of experiment proposal)
    if (query.strategy === 'fanout_write' && scope === 'following') {
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

      // Section 4.2: High-Fanout / Celebrity Creators (> threshold followers) do not fan out on write.
      // Their posts are resolved dynamically on read and merged with the inbox items.
      const celebrityFollows = await followsCol.aggregate([
        { $match: { target_user_id: { $in: targetUserIds } } },
        { $group: { _id: '$target_user_id', count: { $sum: 1 } } },
        { $match: { count: { $gt: this.foowThreshold } } },
      ]).toArray();
      const celebrityAuthorIds = celebrityFollows.map((c) => c._id as string);
      const nonCelebrityTargetIds = celebrityAuthorIds.length > 0
        ? targetUserIds.filter((id) => !celebrityAuthorIds.includes(id))
        : targetUserIds;

      const inboxesCol = this.db.collection<FeedInboxDoc>(COLLECTIONS.FEED_INBOXES);
      const inboxFilter: Filter<FeedInboxDoc> = {
        user_id: currentUserId,
        author_id: { $in: nonCelebrityTargetIds },
      };

      if (query.cursor) {
        const decoded = decodeCursor(query.cursor, sort);
        if (sort === 'new' && decoded.t === 'new') {
          const cursorDate = new Date(decoded.createdAt);
          inboxFilter.$or = [
            { created_at: { $lt: cursorDate } },
            { created_at: cursorDate, post_id: { $lt: decoded.id } },
          ];
        } else if (sort === 'top' && decoded.t === 'top') {
          const cursorDate = new Date(decoded.createdAt);
          inboxFilter.$or = [
            { score: { $lt: decoded.score } },
            { score: decoded.score, created_at: { $lt: cursorDate } },
            { score: decoded.score, created_at: cursorDate, post_id: { $lt: decoded.id } },
          ];
        } else if (sort === 'hot' && decoded.t === 'hot') {
          const cursorDate = new Date(decoded.createdAt);
          inboxFilter.$or = [
            { hot_score: { $lt: decoded.hotScore } },
            { hot_score: decoded.hotScore, created_at: { $lt: cursorDate } },
            { hot_score: decoded.hotScore, created_at: cursorDate, post_id: { $lt: decoded.id } },
          ];
        }
      }

      let inboxSortSpec: Sort = { hot_score: -1, created_at: -1, post_id: -1 };
      if (sort === 'new') {
        inboxSortSpec = { created_at: -1, post_id: -1 };
      } else if (sort === 'top') {
        inboxSortSpec = { score: -1, created_at: -1, post_id: -1 };
      }

      const inboxItems = await inboxesCol.find(inboxFilter).sort(inboxSortSpec).limit(limit + 1).toArray();
      const inboxPostIds = inboxItems.map((i) => i.post_id);
      const inboxPostDocs = inboxPostIds.length > 0
        ? await postsCol.find({ _id: { $in: inboxPostIds } }).toArray()
        : [];
      const postMap = new Map(inboxPostDocs.map((p) => [p._id, p]));
      const inboxOrderedPosts = inboxItems.map((i) => postMap.get(i.post_id)).filter(Boolean) as PostDoc[];

      let mergedPosts = inboxOrderedPosts;
      if (celebrityAuthorIds.length > 0) {
        const celebrityBaseFilter: Filter<PostDoc> = { author_id: { $in: celebrityAuthorIds } };
        const cursorFilter = buildCursorFilter(sort, query.cursor);
        const celebrityFilter: Filter<PostDoc> = cursorFilter
          ? { $and: [celebrityBaseFilter, cursorFilter] }
          : celebrityBaseFilter;

        let celebSort: Sort = { hot_score: -1, created_at: -1, _id: -1 };
        if (sort === 'new') celebSort = { created_at: -1, _id: -1 };
        else if (sort === 'top') celebSort = { score: -1, created_at: -1, _id: -1 };

        const celebrityPosts = await postsCol.find(celebrityFilter).sort(celebSort).limit(limit + 1).toArray();

        const comparePosts = (a: PostDoc, b: PostDoc): number => {
          if (sort === 'new') {
            const timeDiff = b.created_at.getTime() - a.created_at.getTime();
            if (timeDiff !== 0) return timeDiff;
            return b._id.localeCompare(a._id);
          } else if (sort === 'top') {
            const scoreDiff = b.score - a.score;
            if (scoreDiff !== 0) return scoreDiff;
            const timeDiff = b.created_at.getTime() - a.created_at.getTime();
            if (timeDiff !== 0) return timeDiff;
            return b._id.localeCompare(a._id);
          } else {
            const hotDiff = (b.hot_score ?? 0) - (a.hot_score ?? 0);
            if (hotDiff !== 0) return hotDiff;
            const timeDiff = b.created_at.getTime() - a.created_at.getTime();
            if (timeDiff !== 0) return timeDiff;
            return b._id.localeCompare(a._id);
          }
        };

        const postMapAll = new Map<string, PostDoc>();
        for (const p of inboxOrderedPosts) postMapAll.set(p._id, p);
        for (const p of celebrityPosts) postMapAll.set(p._id, p);
        mergedPosts = Array.from(postMapAll.values()).sort(comparePosts);
      }

      const hasMore = mergedPosts.length > limit;
      const orderedPosts = hasMore ? mergedPosts.slice(0, limit) : mergedPosts;

      if (orderedPosts.length === 0) {
        return {
          success: true,
          data: [],
          next_cursor: null,
          has_more: false,
          meta: { count: 0, server_execution_time_ms: Number((performance.now() - start).toFixed(2)) },
        };
      }

      const authorIds = [...new Set(orderedPosts.map((p) => p.author_id))];
      const authors = await usersCol.find({ _id: { $in: authorIds } }).toArray();
      const authorMap = new Map(authors.map((u) => [u._id, toUserSummary(u)]));

      let voteMap = new Map<string, 1 | -1 | 0>();
      let saveSet = new Set<string>();
      if (currentUserId && orderedPosts.length > 0) {
        const pIds = orderedPosts.map((p) => p._id);
        const [votes, saves] = await Promise.all([
          votesCol.find({ user_id: currentUserId, post_id: { $in: pIds } }).toArray(),
          savesCol.find({ user_id: currentUserId, post_id: { $in: pIds } }).toArray(),
        ]);
        voteMap = new Map(votes.map((v) => [v.post_id, v.direction]));
        saveSet = new Set(saves.map((s) => s.post_id));
      }

      const data = orderedPosts.map((post) => {
        const author = authorMap.get(post.author_id) || {
          id: post.author_id,
          username: 'unknown',
          display_name: 'Unknown User',
          avatar_url: '/avatars/alex-dev.svg',
          is_verified: false,
        };
        const userVote = voteMap.get(post._id) ?? 0;
        const isSaved = saveSet.has(post._id);
        return toPostCard(post, author, userVote, isSaved);
      });

      const nextCursor =
        hasMore && orderedPosts.length > 0
          ? encodePostCursor(orderedPosts[orderedPosts.length - 1], sort)
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

    // 2. Build scope filter (Fan-Out-on-Read fallback / baseline)
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
      if (currentUserId) {
        const mbrsCol = this.db.collection<CommunityMembershipDoc>(COLLECTIONS.COMMUNITY_MEMBERSHIPS);
        const memberships = await mbrsCol.find({ user_id: currentUserId }).toArray();
        const joinedCommIds = memberships.map((m) => m.community_id);
        if (joinedCommIds.length === 0) {
          return {
            success: true,
            data: [],
            next_cursor: null,
            has_more: false,
            meta: { count: 0, server_execution_time_ms: Number((performance.now() - start).toFixed(2)) },
          };
        }
        scopeFilter = { community_id: { $in: joinedCommIds } };
      } else {
        scopeFilter = { community_id: { $exists: true, $ne: null as any } };
      }
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

  /**
   * Helper utility to backfill timeline inbox documents for pre-existing posts and follow edges.
   *
   * Idempotency & Restartability:
   * Uses deterministic IDs ('inbox_${follower_id}_${post_id}') and the unique compound index
   * ('uniq_feed_inbox_user_post'). Duplicate key errors (E11000) are caught and ignored with
   * ordered: false, ensuring the operation can be interrupted and safely restarted.
   *
   * Limitation:
   * This is a development/testing fixture setup utility and offline reconciliation helper. It is
   * NOT designed as a high-scale production migration framework: it loads matching follow edges into
   * memory without distributed locking or cursor streaming across database shards.
   */
  public async backfillInboxes(options?: { followerId?: string; authorId?: string }): Promise<number> {
    const inboxesCol = this.db.collection<FeedInboxDoc>(COLLECTIONS.FEED_INBOXES);
    const followsCol = this.db.collection<FollowDoc>(COLLECTIONS.FOLLOWS);
    const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);

    const matchFilter: any = {};
    if (options?.followerId) matchFilter.follower_id = options.followerId;
    if (options?.authorId) matchFilter.target_user_id = options.authorId;

    const follows = await followsCol.find(matchFilter).toArray();
    let totalInserted = 0;

    for (const f of follows) {
      const followerCount = await followsCol.countDocuments({ target_user_id: f.target_user_id });
      if (followerCount <= this.foowThreshold) {
        const posts = await postsCol.find({ author_id: f.target_user_id }).toArray();
        if (posts.length > 0) {
          const inboxDocs: FeedInboxDoc[] = posts.map((p) => ({
            _id: `inbox_${f.follower_id}_${p._id}`,
            user_id: f.follower_id,
            post_id: p._id,
            author_id: f.target_user_id,
            post_type: p.post_type,
            created_at: p.created_at,
            score: p.score,
            hot_score: p.hot_score,
          }));
          try {
            const res = await inboxesCol.insertMany(inboxDocs, { ordered: false });
            totalInserted += res.insertedCount;
          } catch (err: any) {
            if (err?.code !== 11000) throw err;
            if (err?.result?.nInserted) totalInserted += err.result.nInserted;
          }
        }
      }
    }
    return totalInserted;
  }
}
