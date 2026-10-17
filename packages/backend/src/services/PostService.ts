import type { Db } from 'mongodb';
import {
  AppError,
  type CreatePostInput,
  type PostCard,
  type CommentNode,
  type CreateCommentInput,
} from '@socialgraph/shared';
import { getDb } from '../db/mongo.js';
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

    const author = await usersCol.findOne({ _id: authorId });
    if (!author) {
      throw AppError.notFound(`Author user ${authorId} not found`);
    }

    let communitySlug: string | undefined;
    if (input.community_id) {
      const comm = await commsCol.findOne({ _id: input.community_id });
      if (comm) communitySlug = comm.slug;
    }

    const now = new Date();
    const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const initialHotScore = calculateHotScore(0, now);

    const postDoc: PostDoc = {
      _id: postId,
      post_type: input.post_type,
      author_id: authorId,
      title: input.title,
      content: input.content,
      community_id: input.community_id,
      community_slug: communitySlug,
      collection_id: input.collection_id,
      media: input.media,
      score: 0,
      hot_score: initialHotScore,
      comments_count: 0,
      created_at: now,
      updated_at: now,
    };

    await postsCol.insertOne(postDoc);
    await usersCol.updateOne({ _id: authorId }, { $inc: { posts_count: 1 } });

    return toPostCard(postDoc, toUserSummary(author), 0, false);
  }

  public async votePost(postId: string, userId: string, direction: 1 | -1 | 0): Promise<VoteResult> {
    const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
    const votesCol = this.db.collection<PostVoteDoc>(COLLECTIONS.POST_VOTES);

    const post = await postsCol.findOne({ _id: postId });
    if (!post) {
      throw AppError.notFound(`Cannot vote: post ${postId} not found`);
    }

    const existingVote = await votesCol.findOne({ post_id: postId, user_id: userId });
    const prevDirection: 1 | -1 | 0 = existingVote ? existingVote.direction : 0;

    if (prevDirection === direction) {
      return {
        post_id: postId,
        score: post.score,
        new_score: post.score,
        user_vote: direction,
      };
    }

    const delta = direction - prevDirection;
    const now = new Date();

    if (direction === 0) {
      await votesCol.deleteOne({ post_id: postId, user_id: userId });
    } else {
      await votesCol.updateOne(
        { post_id: postId, user_id: userId },
        {
          $set: {
            direction,
            updated_at: now,
          },
          $setOnInsert: {
            _id: `vote_${postId}_${userId}`,
            created_at: now,
          },
        },
        { upsert: true }
      );
    }

    const newScore = (post.score || 0) + delta;
    const newHotScore = calculateHotScore(newScore, post.created_at);

    await postsCol.updateOne(
      { _id: postId },
      {
        $inc: { score: delta },
        $set: { hot_score: newHotScore, updated_at: now },
      }
    );

    return {
      post_id: postId,
      score: newScore,
      new_score: newScore,
      user_vote: direction,
    };
  }

  public async toggleSavePost(postId: string, userId: string): Promise<{ post_id: string; is_saved: boolean }> {
    const postsCol = this.db.collection<PostDoc>(COLLECTIONS.POSTS);
    const savesCol = this.db.collection<PostSaveDoc>(COLLECTIONS.POST_SAVES);

    const post = await postsCol.findOne({ _id: postId });
    if (!post) {
      throw AppError.notFound(`Cannot bookmark: post ${postId} not found`);
    }

    const existing = await savesCol.findOne({ post_id: postId, user_id: userId });
    if (existing) {
      await savesCol.deleteOne({ post_id: postId, user_id: userId });
      return { post_id: postId, is_saved: false };
    }

    await savesCol.insertOne({
      _id: `save_${postId}_${userId}`,
      post_id: postId,
      user_id: userId,
      created_at: new Date(),
    });

    return { post_id: postId, is_saved: true };
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

    const post = await postsCol.findOne({ _id: postId });
    if (!post) {
      throw AppError.notFound(`Cannot comment: post ${postId} not found`);
    }

    const author = await usersCol.findOne({ _id: userId });
    if (!author) {
      throw AppError.notFound(`Commenter user ${userId} not found`);
    }

    let depth = 0;
    if (input.parent_id) {
      const parent = await commentsCol.findOne({ _id: input.parent_id, post_id: postId });
      if (!parent) {
        throw AppError.badRequest(`Parent comment ${input.parent_id} not found on this post`);
      }
      depth = Math.min((parent.depth || 0) + 1, 10);
    }

    const now = new Date();
    const commentId = `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const commentDoc: CommentDoc = {
      _id: commentId,
      post_id: postId,
      parent_id: input.parent_id || null,
      author_id: userId,
      content: input.content,
      score: 0,
      depth,
      created_at: now,
      updated_at: now,
    };

    await commentsCol.insertOne(commentDoc);
    await postsCol.updateOne({ _id: postId }, { $inc: { comments_count: 1 }, $set: { updated_at: now } });

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
  }
}
