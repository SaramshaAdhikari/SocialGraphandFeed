import type { Db, Filter, Sort } from 'mongodb';
import {
  AppError,
  type CreatePostInput,
  type PostCard,
  type CommentNode,
  type CreateCommentInput,
  type SavedPostsQuery,
  type FeedResponse,
} from '@socialgraph/shared';
import { getDb } from '../db/mongo.js';
import { runInTransaction } from '../db/transaction.js';
import { COLLECTIONS } from '../db/collections.js';
import type {
  PostDoc,
  UserDoc,
  CommentDoc,
  PostVoteDoc,
  PostSaveDoc,
  CommunityDoc,
} from '../db/types.js';
import { toUserSummary, toPostCard, buildCommentTree } from '../db/serialization.js';
import { calculateHotScore } from '../utils/pagination.js';
import { getCached, setCachedWithTag, invalidateCachePattern } from '../cache/redis.js';
import { NotificationService } from './NotificationService.js';
import { UserService } from './UserService.js';

export interface VoteResult {
  post_id: string;
  score: number;
  new_score: number;
  user_vote: 1 | -1 | 0;
}

export class PostService {
  private notificationService = new NotificationService();
  private userService = new UserService();
  private get db(): Db {
    return getDb();
  }

  public async invalidatePostCache(postId: string): Promise<void> {
    await invalidateCachePattern(`cache:post:${postId}:_keys`, `cache:post:${postId}:*`);
  }

  public async getPost(postId: string, currentUserId?: string): Promise<PostCard> {
    const cacheKey = currentUserId ? `cache:post:${postId}:u:${currentUserId}` : `cache:post:${postId}:anon`;
    const cached = await getCached<PostCard>(cacheKey);
    if (cached) return cached;

    const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);
    const votesCol = this.db.collection<PostVoteDoc>(COLLECTIONS.POST_VOTES);
    const savesCol = this.db.collection<PostSaveDoc>(COLLECTIONS.POST_SAVES);

    const post = await postsCol.findOne({ _id: postId });
    if (!post) {
      throw AppError.notFound(`Post with ID ${postId} was not found`);
    }

    const authorDoc = await usersCol.findOne({ _id: post.author_id });
    const author = authorDoc ? toUserSummary(authorDoc) : {
      id: post.author_id,
      username: 'unknown',
      display_name: 'Unknown User',
      avatar_url: '/avatars/alex-dev.svg',
      is_verified: false,
    };

    let userVote: 1 | -1 | 0 = 0;
    let isSaved = false;

    if (currentUserId) {
      const [vote, save] = await Promise.all([
        votesCol.findOne({ post_id: postId, user_id: currentUserId }),
        savesCol.findOne({ post_id: postId, user_id: currentUserId }),
      ]);
      if (vote) userVote = vote.direction;
      if (save) isSaved = true;
    }

    const result = toPostCard(post, author, userVote, isSaved);
    await setCachedWithTag(cacheKey, `cache:post:${postId}:_keys`, result, 30);
    return result;
  }

  public async createPost(input: CreatePostInput, authorId: string, idempotencyKey?: string): Promise<PostCard> {
    const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);
    const commsCol = this.db.collection<CommunityDoc>(COLLECTIONS.COMMUNITIES);

    // Durable DB-level idempotency recovery
    if (idempotencyKey) {
      const existing = await postsCol.findOne({ author_id: authorId, idempotency_key: idempotencyKey });
      if (existing) {
        return this.getPost(existing._id, authorId);
      }
    }

    const { card, authorUsername } = await runInTransaction(async (session) => {
      const author = await usersCol.findOne({ _id: authorId }, { session });
      if (!author) throw AppError.notFound(`Author user ${authorId} not found`);

      let communitySlug: string | undefined;
      if (input.community_id) {
        const comm = await commsCol.findOne({ _id: input.community_id }, { session });
        if (!comm) throw AppError.notFound(`Community ${input.community_id} not found`);
        communitySlug = comm.slug;
      }

      const now = new Date();
      const postDoc: PostDoc = {
        _id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        post_type: input.post_type,
        author_id: authorId,
        title: input.title,
        content: input.content,
        caption: input.caption || (input.post_type === 'visual' ? input.content : undefined),
        community_id: input.community_id,
        community_slug: communitySlug,
        collection_id: input.collection_id,
        media: input.media,
        flair: input.flair,
        tags: input.tags,
        destination_url: input.destination_url,
        score: 0,
        hot_score: calculateHotScore(0, now),
        comments_count: 0,
        idempotency_key: idempotencyKey || undefined,
        created_at: now,
        updated_at: now,
      };

      try {
        await postsCol.insertOne(postDoc, { session });
      } catch (err: any) {
        if (err?.code === 11000 && idempotencyKey) {
          const dup = await postsCol.findOne({ author_id: authorId, idempotency_key: idempotencyKey }, { session });
          if (dup) {
            return {
              card: toPostCard(dup, toUserSummary(author), 0, false),
              authorUsername: null,
            };
          }
        }
        throw err;
      }

      await usersCol.updateOne({ _id: authorId }, { $inc: { posts_count: 1 } }, { session });
      return {
        card: toPostCard(postDoc, toUserSummary(author), 0, false),
        authorUsername: author.username,
      };
    });

    if (authorUsername) {
      await this.userService.invalidateUserProfileCache(authorUsername);
    }

    return card;
  }

  public async votePost(postId: string, userId: string, direction: 1 | -1 | 0): Promise<VoteResult> {
    const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
    const votesCol = this.db.collection<PostVoteDoc>(COLLECTIONS.POST_VOTES);

    const res = await runInTransaction(async (session) => {
      const post = await postsCol.findOne({ _id: postId }, { session });
      if (!post) throw AppError.notFound(`Cannot vote: post ${postId} not found`);

      const filter = { post_id: postId, user_id: userId };
      const existing = await votesCol.findOne(filter, { session });
      const prevDirection = existing?.direction ?? 0;
      const now = new Date();

      if (direction === 0) {
        if (existing) await votesCol.deleteOne({ ...filter, _id: existing._id }, { session });
      } else if (existing) {
        await votesCol.updateOne({ ...filter, _id: existing._id }, { $set: { direction, updated_at: now } }, { session });
      } else {
        await votesCol.insertOne({
          _id: `vote_${postId}_${userId}`,
          post_id: postId,
          user_id: userId,
          direction,
          created_at: now,
          updated_at: now,
        }, { session });
      }

      const score = post.score + direction - prevDirection;
      if (score !== post.score) {
        await postsCol.updateOne(
          { _id: postId },
          { $set: { score, hot_score: calculateHotScore(score, post.created_at), updated_at: now } },
          { session }
        );
      }
      return { post_id: postId, score, new_score: score, user_vote: direction };
    });

    await this.invalidatePostCache(postId);
    return res;
  }

  public async toggleSavePost(postId: string, userId: string): Promise<{ post_id: string; is_saved: boolean }> {
    const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
    const savesCol = this.db.collection<PostSaveDoc>(COLLECTIONS.POST_SAVES);

    const res = await runInTransaction(async (session) => {
      const post = await postsCol.findOne({ _id: postId }, { session });
      if (!post) throw AppError.notFound(`Cannot bookmark: post ${postId} not found`);
      const filter = { post_id: postId, user_id: userId };
      const existing = await savesCol.findOne(filter, { session });
      if (existing) {
        await savesCol.deleteOne({ ...filter, _id: existing._id }, { session });
        return { post_id: postId, is_saved: false };
      }
      await savesCol.insertOne({
        _id: `save_${postId}_${userId}`,
        post_id: postId,
        user_id: userId,
        created_at: new Date(),
      }, { session });
      return { post_id: postId, is_saved: true };
    });

    await this.invalidatePostCache(postId);
    return res;
  }

  public async getComments(postId: string, currentUserId?: string): Promise<CommentNode[]> {
    const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
    const commentsCol = this.db.collection<CommentDoc>(COLLECTIONS.COMMENTS);
    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);

    const post = await postsCol.findOne({ _id: postId });
    if (!post) {
      throw AppError.notFound(`Post with ID ${postId} not found`);
    }

    const commentDocs = await commentsCol.find({ post_id: postId }).sort({ created_at: 1 }).toArray();
    if (commentDocs.length === 0) {
      return [];
    }

    const authorIds = [...new Set(commentDocs.map((c) => c.author_id))];
    const authors = await usersCol.find({ _id: { $in: authorIds } }).toArray();
    const authorMap = new Map(authors.map((u) => [u._id, toUserSummary(u)]));

    return buildCommentTree(commentDocs, authorMap);
  }

  public async createComment(
    postId: string,
    userId: string,
    input: CreateCommentInput,
    idempotencyKey?: string
  ): Promise<CommentNode> {
    const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
    const commentsCol = this.db.collection<CommentDoc>(COLLECTIONS.COMMENTS);
    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);

    // Durable DB-level idempotency recovery
    if (idempotencyKey) {
      const existing = await commentsCol.findOne({ author_id: userId, idempotency_key: idempotencyKey });
      if (existing) {
        const author = await usersCol.findOne({ _id: userId });
        return {
          id: existing._id,
          post_id: postId,
          parent_id: existing.parent_id,
          author: author ? toUserSummary(author) : { id: userId, username: 'unknown', display_name: 'Unknown User', avatar_url: '/avatars/alex-dev.svg', is_verified: false },
          content: existing.content,
          created_at: existing.created_at.toISOString(),
          updated_at: existing.updated_at.toISOString(),
          score: existing.score,
          user_vote: 0,
          depth: existing.depth,
          replies: [],
        };
      }
    }

    const res = await runInTransaction<CommentNode>(async (session): Promise<CommentNode> => {
      const post = await postsCol.findOne({ _id: postId }, { session });
      if (!post) throw AppError.notFound(`Cannot comment: post ${postId} not found`);
      const author = await usersCol.findOne({ _id: userId }, { session });
      if (!author) throw AppError.notFound(`Commenter user ${userId} not found`);

      let depth = 0;
      let parentAuthorId: string | null = null;
      if (input.parent_id) {
        const parent = await commentsCol.findOne({ _id: input.parent_id, post_id: postId }, { session });
        if (!parent) throw AppError.badRequest(`Parent comment ${input.parent_id} not found on this post`);
        depth = Math.min((parent.depth || 0) + 1, 10);
        parentAuthorId = parent.author_id;
      }
      const now = new Date();
      const commentDoc: CommentDoc = {
        _id: `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        post_id: postId,
        parent_id: input.parent_id || null,
        author_id: userId,
        content: input.content,
        score: 0,
        depth,
        idempotency_key: idempotencyKey || undefined,
        created_at: now,
        updated_at: now,
      };

      try {
        await commentsCol.insertOne(commentDoc, { session });
      } catch (err: any) {
        if (err?.code === 11000 && idempotencyKey) {
          const dup = await commentsCol.findOne({ author_id: userId, idempotency_key: idempotencyKey }, { session });
          if (dup) {
            return {
              id: dup._id,
              post_id: postId,
              parent_id: dup.parent_id,
              author: toUserSummary(author),
              content: dup.content,
              created_at: dup.created_at.toISOString(),
              updated_at: dup.updated_at.toISOString(),
              score: dup.score,
              user_vote: 0,
              depth: dup.depth,
              replies: [],
            };
          }
        }
        throw err;
      }

      await postsCol.updateOne({ _id: postId }, { $inc: { comments_count: 1 }, $set: { updated_at: now } }, { session });

      if (parentAuthorId) {
        await this.notificationService.createNotification({
          recipient_id: parentAuthorId,
          actor_id: userId,
          type: 'reply',
          post_id: postId,
          comment_id: commentDoc._id,
          session,
        });
      } else {
        await this.notificationService.createNotification({
          recipient_id: post.author_id,
          actor_id: userId,
          type: 'comment',
          post_id: postId,
          comment_id: commentDoc._id,
          session,
        });
      }
      return {
        id: commentDoc._id,
        post_id: postId,
        parent_id: commentDoc.parent_id,
        author: toUserSummary(author),
        content: commentDoc.content,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        score: 0,
        user_vote: 0,
        depth,
        replies: [],
      };
    });

    await this.invalidatePostCache(postId);
    return res;
  }

  public async getSavedPosts(userId: string, query: SavedPostsQuery = {}): Promise<FeedResponse> {
    const start = performance.now();
    const {
      type = 'all',
      communitySlug,
      community,
      topic,
      query: searchQuery,
      q,
      sort = 'new',
      cursor,
      limit = 20,
    } = query;

    const actualLimit = Math.min(Math.max(limit ?? 20, 1), 100);
    const targetCommunity = community || communitySlug;
    const searchPattern = (q || searchQuery || '').trim().toLowerCase();

    const savesCol = this.db.collection<PostSaveDoc>(COLLECTIONS.POST_SAVES);
    const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);
    const votesCol = this.db.collection<PostVoteDoc>(COLLECTIONS.POST_VOTES);

    const saves = await savesCol.find({ user_id: userId }).sort({ created_at: -1 }).toArray();
    if (saves.length === 0) {
      return {
        success: true,
        data: [],
        next_cursor: null,
        has_more: false,
        meta: { count: 0, server_execution_time_ms: Number((performance.now() - start).toFixed(2)) },
      };
    }

    const savedPostIds = saves.map((item) => item.post_id);
    const filter: Filter<PostDoc> = { _id: { $in: savedPostIds } };

    if (type === 'discussions') {
      filter.post_type = 'discussion';
    } else if (type === 'visual') {
      filter.post_type = 'visual';
    }

    if (targetCommunity && targetCommunity !== 'all') {
      const cleanSlug = targetCommunity.replace(/^c\//, '').toLowerCase();
      filter.$or = [
        { community_slug: cleanSlug },
        { community_id: cleanSlug },
      ];
    }

    if (topic && topic !== 'all') {
      const cleanTopic = topic.replace(/^#/, '').toLowerCase();
      const topicFilter = [
        { community_slug: cleanTopic },
        { tags: cleanTopic },
        { flair: cleanTopic },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: topicFilter }];
        delete filter.$or;
      } else {
        filter.$or = topicFilter;
      }
    }

    let sortSpec: Sort = { created_at: -1, _id: -1 };
    if (sort === 'top') {
      sortSpec = { score: -1, created_at: -1, _id: -1 };
    } else if (sort === 'comments') {
      sortSpec = { comments_count: -1, created_at: -1, _id: -1 };
    }

    const matchingPosts = await postsCol.find(filter).sort(sortSpec).toArray();

    let filteredPosts = matchingPosts;
    if (searchPattern) {
      const terms = searchPattern.split(/\s+/).filter(Boolean);
      filteredPosts = matchingPosts.filter((post) => {
        const text = [
          post.title,
          post.content,
          post.caption,
          post.flair,
          post.community_slug,
          ...(post.tags || []),
        ].filter(Boolean).join(' ').toLowerCase();
        return terms.every((t) => text.includes(t));
      });
    }

    let startIndex = 0;
    if (cursor) {
      const foundIdx = filteredPosts.findIndex((p) => p._id === cursor);
      if (foundIdx >= 0) {
        startIndex = foundIdx + 1;
      } else {
        // Unknown or deleted cursor boundary: fail-safe return empty to avoid infinite pagination loops
        return {
          success: true,
          data: [],
          next_cursor: null,
          has_more: false,
          meta: { count: 0, server_execution_time_ms: Number((performance.now() - start).toFixed(2)) },
        };
      }
    }

    const pageDocs = filteredPosts.slice(startIndex, startIndex + actualLimit);
    const hasMore = startIndex + actualLimit < filteredPosts.length;
    const nextCursor = hasMore && pageDocs.length > 0 ? pageDocs[pageDocs.length - 1]._id : null;

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
    const votes = await votesCol.find({ user_id: userId, post_id: { $in: postIds } }).toArray();
    const voteMap = new Map(votes.map((v) => [v.post_id, v.direction]));

    const data = pageDocs.map((p) => {
      const author = authorMap.get(p.author_id) || {
        id: p.author_id,
        username: 'unknown',
        display_name: 'Unknown User',
        avatar_url: '/avatars/alex-dev.svg',
        is_verified: false,
      };
      return toPostCard(p, author, voteMap.get(p._id) ?? 0, true);
    });

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
