import type { Db, Filter, Sort, ClientSession } from 'mongodb';
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
  FollowDoc,
  FeedInboxDoc,
} from '../db/types.js';
import { toUserSummary, toPostCard, buildCommentTree } from '../db/serialization.js';
import { calculateHotScore } from '../utils/pagination.js';
import { getCached, setCachedWithTag, invalidateCachePattern } from '../cache/redis.js';
import { NotificationService } from './NotificationService.js';
import { config } from '../config/env.js';
import { UserService } from './UserService.js';

export interface VoteResult {
  post_id: string;
  score: number;
  new_score: number;
  user_vote: 1 | -1 | 0;
}

export class PostService {
  private foowThreshold: number;

  constructor(foowThreshold?: number) {
    this.foowThreshold = foowThreshold ?? config.FOOW_MAX_FOLLOWERS_THRESHOLD ?? 500;
  }
  private notificationService = new NotificationService();
  private userService = new UserService();
  private get db(): Db {
    return getDb();
  }

  public async invalidatePostCache(postId: string): Promise<void> {
    await invalidateCachePattern(`cache:post:${postId}:_keys`, `cache:post:${postId}:*`);
  }

  public async invalidateAuthorCache(username: string): Promise<void> {
    await this.userService.invalidateUserProfileCache(username);
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

      // Normalize and sanitize tags: lowercase, strip leading #, deduplicate, filter valid slug pattern
      const normalizedTags = input.tags
        ? Array.from(
            new Set(
              input.tags
                .map((t) => t.trim().replace(/^#+/, '').toLowerCase())
                .filter((t) => t.length > 0 && /^[a-z0-9_-]+$/.test(t))
            )
          )
        : undefined;
      const finalTags = normalizedTags && normalizedTags.length > 0 ? normalizedTags : undefined;

      // Normalize flair: strip leading # and whitespace
      const finalFlair = input.flair
        ? input.flair.trim().replace(/^#+/, '')
        : finalTags && finalTags.length > 0
        ? finalTags[0]
        : undefined;

      if (input.media && input.media.length > 10) {
        throw AppError.badRequest('A post cannot contain more than 10 images.');
      }

      const hasText = Boolean(input.title?.trim() || input.content?.trim() || input.caption?.trim());
      const hasMedia = Boolean(input.media && input.media.length > 0);
      if (!hasText && !hasMedia) {
        throw AppError.badRequest('Post must contain either text content or media attachments.');
      }

      let postType: 'visual' | 'discussion';
      if (input.post_type) {
        postType = input.post_type;
      } else if (hasMedia) {
        postType = 'visual';
      } else {
        postType = 'discussion';
      }

      let finalTitle = input.title?.trim();
      if (!finalTitle) {
        const text = input.content?.trim() || input.caption?.trim();
        if (text) {
          finalTitle = text.slice(0, 80).split('\n')[0].trim();
        } else if (hasMedia) {
          finalTitle = 'Photo';
        } else {
          finalTitle = 'Untitled Post';
        }
      }

      const postDoc: PostDoc = {
        _id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        post_type: postType,
        author_id: authorId,
        title: finalTitle || (hasMedia ? 'Photo' : 'Untitled Post'),
        content: input.content,
        caption: input.caption || input.content || undefined,
        community_id: input.community_id,
        community_slug: communitySlug,
        collection_id: input.collection_id,
        media: input.media,
        flair: finalFlair,
        tags: finalTags,
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

      // Fan-Out-on-Write timeline delivery (Section 7.3 & Section 3.2 of experiment proposal)
      const followsCol = this.db.collection<FollowDoc>(COLLECTIONS.FOLLOWS);
      const followers = await followsCol
        .find({ target_user_id: authorId }, { projection: { follower_id: 1 }, session })
        .toArray();

      // Configurable hybrid threshold (Section 4.2): standard creators <= 500 followers fan out on write
      if (followers.length > 0 && followers.length <= this.foowThreshold) {
        const inboxesCol = this.db.collection<FeedInboxDoc>(COLLECTIONS.FEED_INBOXES);
        const inboxDocs: FeedInboxDoc[] = followers.map((f) => ({
          _id: `inbox_${f.follower_id}_${postDoc._id}`,
          user_id: f.follower_id,
          post_id: postDoc._id,
          author_id: authorId,
          post_type: postDoc.post_type,
          created_at: postDoc.created_at,
          score: postDoc.score,
          hot_score: postDoc.hot_score,
        }));
        await inboxesCol.insertMany(inboxDocs, { ordered: false, session });
      }
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
        const hotScore = calculateHotScore(score, post.created_at);
        await postsCol.updateOne(
          { _id: postId },
          { $set: { score, hot_score: hotScore, updated_at: now } },
          { session }
        );
        const inboxesCol = this.db.collection<FeedInboxDoc>(COLLECTIONS.FEED_INBOXES);
        await inboxesCol.updateMany(
          { post_id: postId },
          { $set: { score, hot_score: hotScore } },
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

  public async deletePost(
    postId: string,
    requestingUserId: string,
    isAdmin = false,
    externalSession?: ClientSession
  ): Promise<{ success: boolean; post_id: string; author_username?: string }> {
    const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);
    const commentsCol = this.db.collection<CommentDoc>(COLLECTIONS.COMMENTS);
    const votesCol = this.db.collection<PostVoteDoc>(COLLECTIONS.POST_VOTES);
    const savesCol = this.db.collection<PostSaveDoc>(COLLECTIONS.POST_SAVES);
    const notifsCol = this.db.collection(COLLECTIONS.NOTIFICATIONS);
    const reportsCol = this.db.collection(COLLECTIONS.REPORTS);

    const post = await postsCol.findOne({ _id: postId }, externalSession ? { session: externalSession } : undefined);
    if (!post) {
      throw AppError.notFound(`Post with ID ${postId} was not found`);
    }

    if (post.author_id !== requestingUserId && !isAdmin) {
      throw AppError.forbidden('You do not have permission to delete this post');
    }

    const author = await usersCol.findOne({ _id: post.author_id }, externalSession ? { session: externalSession } : undefined);

    const executeWork = async (session: ClientSession) => {
      // 1. Delete the post (atomic concurrency guard: abort if already deleted)
      const deleteRes = await postsCol.deleteOne({ _id: postId }, { session });
      if (deleteRes.deletedCount === 0) {
        throw AppError.notFound(`Post with ID ${postId} was not found`);
      }

      // Collect all comment IDs belonging to this post so their reports can also be resolved
      const postComments = await commentsCol.find({ post_id: postId }, { projection: { _id: 1 }, session }).toArray();
      const commentIds = postComments.map((c) => c._id);

      // 2. Decrement author's posts_count
      await usersCol.updateOne(
        { _id: post.author_id },
        { $inc: { posts_count: -1 } },
        { session }
      );

      // 3. Cascade delete comments, votes, saves, notifications, and timeline deliveries
      const inboxesCol = this.db.collection(COLLECTIONS.FEED_INBOXES);
      await commentsCol.deleteMany({ post_id: postId }, { session });
      await votesCol.deleteMany({ post_id: postId }, { session });
      await savesCol.deleteMany({ post_id: postId }, { session });
      await notifsCol.deleteMany({ post_id: postId }, { session });
      await inboxesCol.deleteMany({ post_id: postId }, { session });

      // 4. Resolve any pending reports for this post AND its associated comments
      const reportTargetFilters: any[] = [{ target_type: 'post', target_id: postId, status: 'pending' }];
      if (commentIds.length > 0) {
        reportTargetFilters.push({ target_type: 'comment', target_id: { $in: commentIds }, status: 'pending' });
      }
      await reportsCol.updateMany(
        { $or: reportTargetFilters },
        {
          $set: {
            status: 'resolved',
            action_taken: 'removed',
            resolved_by: requestingUserId,
            resolved_at: new Date(),
            updated_at: new Date(),
          },
        },
        { session }
      );
    };

    if (externalSession) {
      await executeWork(externalSession);
    } else {
      await runInTransaction(executeWork);
      // Post-commit cache invalidation
      await this.invalidatePostCache(postId);
      if (author) {
        await this.userService.invalidateUserProfileCache(author.username);
      }
    }

    return { success: true, post_id: postId, author_username: author?.username };
  }

  public async deleteComment(
    postId: string,
    commentId: string,
    requestingUserId: string,
    isAdmin = false,
    externalSession?: ClientSession
  ): Promise<{ success: boolean; comment_id: string }> {
    const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
    const commentsCol = this.db.collection<CommentDoc>(COLLECTIONS.COMMENTS);
    const notifsCol = this.db.collection(COLLECTIONS.NOTIFICATIONS);
    const reportsCol = this.db.collection(COLLECTIONS.REPORTS);

    const post = await postsCol.findOne({ _id: postId }, externalSession ? { session: externalSession } : undefined);
    if (!post) {
      throw AppError.notFound(`Post with ID ${postId} was not found`);
    }

    const comment = await commentsCol.findOne({ _id: commentId }, externalSession ? { session: externalSession } : undefined);
    if (!comment || comment.post_id !== postId) {
      throw AppError.notFound(`Comment with ID ${commentId} was not found on this post`);
    }

    if (comment.author_id !== requestingUserId && !isAdmin) {
      throw AppError.forbidden('You do not have permission to delete this comment');
    }

    const executeWork = async (session: ClientSession) => {
      // 1. Re-verify comment exists within session under snapshot isolation
      const commentInTx = await commentsCol.findOne({ _id: commentId, post_id: postId }, { session });
      if (!commentInTx) {
        throw AppError.notFound(`Comment with ID ${commentId} was not found on this post`);
      }

      // Identify all descendant comments within session snapshot to cascade delete the thread tree
      const allPostComments = await commentsCol.find({ post_id: postId }, { session }).toArray();
      const toDeleteIds = new Set<string>([commentId]);

      let added = true;
      while (added) {
        added = false;
        for (const c of allPostComments) {
          if (c.parent_id && toDeleteIds.has(c.parent_id) && !toDeleteIds.has(c._id)) {
            toDeleteIds.add(c._id);
            added = true;
          }
        }
      }

      const deleteIdArray = Array.from(toDeleteIds);

      // 2. Delete comments (atomic concurrency guard: abort if already deleted)
      const deleteRes = await commentsCol.deleteMany({ _id: { $in: deleteIdArray } }, { session });
      if (deleteRes.deletedCount === 0) {
        throw AppError.notFound(`Comment with ID ${commentId} was not found on this post`);
      }

      // 3. Decrement post's comments_count by exactly the number of documents deleted
      await postsCol.updateOne(
        { _id: postId },
        { $inc: { comments_count: -deleteRes.deletedCount } },
        { session }
      );

      // 4. Cascade delete notifications for these comments
      await notifsCol.deleteMany({ comment_id: { $in: deleteIdArray } }, { session });

      // 5. Resolve any pending reports for these comments
      await reportsCol.updateMany(
        { target_type: 'comment', target_id: { $in: deleteIdArray }, status: 'pending' },
        {
          $set: {
            status: 'resolved',
            action_taken: 'removed',
            resolved_by: requestingUserId,
            resolved_at: new Date(),
            updated_at: new Date(),
          },
        },
        { session }
      );
    };

    if (externalSession) {
      await executeWork(externalSession);
    } else {
      await runInTransaction(executeWork);
      // Post-commit cache invalidation
      await this.invalidatePostCache(postId);
    }

    return { success: true, comment_id: commentId };
  }
}
