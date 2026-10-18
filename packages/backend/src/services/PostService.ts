import type { Db } from 'mongodb';
import {
  AppError,
  type CreatePostInput,
  type PostCard,
  type CommentNode,
  type CreateCommentInput,
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

export interface VoteResult {
  post_id: string;
  score: number;
  new_score: number;
  user_vote: 1 | -1 | 0;
}

export class PostService {
  private get db(): Db {
    return getDb();
  }

  public async getPost(postId: string, currentUserId?: string): Promise<PostCard> {
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

    return toPostCard(post, author, userVote, isSaved);
  }

  public async createPost(input: CreatePostInput, authorId: string): Promise<PostCard> {
    const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);
    const commsCol = this.db.collection<CommunityDoc>(COLLECTIONS.COMMUNITIES);

    return runInTransaction(async (session) => {
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
        created_at: now,
        updated_at: now,
      };

      await postsCol.insertOne(postDoc, { session });
      await usersCol.updateOne({ _id: authorId }, { $inc: { posts_count: 1 } }, { session });
      return toPostCard(postDoc, toUserSummary(author), 0, false);
    });
  }

  public async votePost(postId: string, userId: string, direction: 1 | -1 | 0): Promise<VoteResult> {
    const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
    const votesCol = this.db.collection<PostVoteDoc>(COLLECTIONS.POST_VOTES);

    return runInTransaction(async (session) => {
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
  }

  public async toggleSavePost(postId: string, userId: string): Promise<{ post_id: string; is_saved: boolean }> {
    const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
    const savesCol = this.db.collection<PostSaveDoc>(COLLECTIONS.POST_SAVES);

    return runInTransaction(async (session) => {
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

  public async createComment(postId: string, userId: string, input: CreateCommentInput): Promise<CommentNode> {
    const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
    const commentsCol = this.db.collection<CommentDoc>(COLLECTIONS.COMMENTS);
    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);

    return runInTransaction(async (session) => {
      const post = await postsCol.findOne({ _id: postId }, { session });
      if (!post) throw AppError.notFound(`Cannot comment: post ${postId} not found`);
      const author = await usersCol.findOne({ _id: userId }, { session });
      if (!author) throw AppError.notFound(`Commenter user ${userId} not found`);

      let depth = 0;
      if (input.parent_id) {
        const parent = await commentsCol.findOne({ _id: input.parent_id, post_id: postId }, { session });
        if (!parent) throw AppError.badRequest(`Parent comment ${input.parent_id} not found on this post`);
        depth = Math.min((parent.depth || 0) + 1, 10);
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
        created_at: now,
        updated_at: now,
      };
      await commentsCol.insertOne(commentDoc, { session });
      await postsCol.updateOne({ _id: postId }, { $inc: { comments_count: 1 }, $set: { updated_at: now } }, { session });
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
  }
}
