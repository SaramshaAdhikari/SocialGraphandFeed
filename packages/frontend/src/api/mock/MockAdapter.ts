import type {
  HealthStatus,
  PostCard,
  VisualPinCard,
  DiscussionPostCard,
  FeedQuery,
  FeedResponse,
  DiscoveryQuery,
  DiscoveryResponse,
  CommentNode,
  CreateCommentInput,
  UserProfile,
  FollowToggleResponse,
  Community,
  ApiErrorResponse,
} from '@socialgraph/shared';
import type { ISocialGraphApi, VoteResult, DataSourceType } from '../types';
import { ApiClientError } from '../client';
import {
  mockUsers,
  mockCommunities,
  mockDiscussionPosts,
  mockVisualPins,
  mockCommentsByPostId,
  toUserSummary,
} from './fixtures';

export interface MockAdapterOptions {
  simulatedLatencyMs?: number;
}

export class MockAdapter implements ISocialGraphApi {
  public readonly dataSource: DataSourceType = 'mock';

  private users: Record<string, UserProfile>;
  private communities: Record<string, Community>;
  private posts: (DiscussionPostCard | VisualPinCard)[];
  private comments: Record<string, CommentNode[]>;
  private latencyMs: number;
  private failureMap: Map<string, ApiErrorResponse> = new Map();

  constructor(options: MockAdapterOptions = {}) {
    this.latencyMs = options.simulatedLatencyMs ?? 20;
    this.users = JSON.parse(JSON.stringify(mockUsers));
    this.communities = JSON.parse(JSON.stringify(mockCommunities));
    this.posts = JSON.parse(
      JSON.stringify([...mockDiscussionPosts, ...mockVisualPins])
    );
    this.comments = JSON.parse(JSON.stringify(mockCommentsByPostId));
  }

  public resetFixtures(): void {
    this.users = JSON.parse(JSON.stringify(mockUsers));
    this.communities = JSON.parse(JSON.stringify(mockCommunities));
    this.posts = JSON.parse(
      JSON.stringify([...mockDiscussionPosts, ...mockVisualPins])
    );
    this.comments = JSON.parse(JSON.stringify(mockCommentsByPostId));
    this.failureMap.clear();
  }

  public simulateFailure(endpoint: string, problem: ApiErrorResponse): void {
    this.failureMap.set(endpoint, problem);
  }

  public clearSimulatedFailures(): void {
    this.failureMap.clear();
  }

  private async delay(endpoint?: string): Promise<void> {
    if (endpoint && this.failureMap.has(endpoint)) {
      const problem = this.failureMap.get(endpoint)!;
      throw new ApiClientError(problem);
    }
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }

  public async getHealth(): Promise<HealthStatus> {
    await this.delay('/api/v1/health');
    return {
      status: 'ok',
      version: '0.1.0-mock',
      uptime_seconds: 120,
      timestamp: new Date().toISOString(),
      services: {
        mongodb: { status: 'connected', latency_ms: 1.2 },
        redis: { status: 'connected', latency_ms: 0.4 },
      },
    };
  }

  public async getMetrics(): Promise<{ uptime_seconds: number; node_version: string }> {
    await this.delay('/api/v1/metrics');
    return {
      uptime_seconds: 120,
      node_version: 'v24.13.0-mock',
    };
  }

  public async getFeed(query: FeedQuery = {}): Promise<FeedResponse> {
    await this.delay('/api/v1/feed');
    const { sort = 'hot', limit = 10, cursor, scope = 'all' } = query;

    let items = [...this.posts];

    // Scope filtering
    if (scope === 'following') {
      items = items.filter((p) => this.users[p.author.id]?.is_following === true);
    } else if (scope === 'communities') {
      items = items.filter((p) => Boolean(p.community_id));
    }

    // Sorting implementation
    if (sort === 'hot') {
      items.sort((a, b) => b.score - a.score);
    } else if (sort === 'new') {
      items.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sort === 'top') {
      items.sort((a, b) => b.score - a.score);
    }

    // Cursor pagination (cursor matches post ID)
    let startIndex = 0;
    if (cursor) {
      const foundIdx = items.findIndex((p) => p.id === cursor);
      if (foundIdx >= 0) {
        startIndex = foundIdx + 1;
      }
    }

    const page = items.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < items.length;
    const nextCursor = hasMore && page.length > 0 ? page[page.length - 1].id : null;

    return {
      success: true,
      data: page,
      next_cursor: nextCursor,
      has_more: hasMore,
      meta: {
        count: page.length,
        server_execution_time_ms: 3.5,
      },
    };
  }

  public async getDiscovery(query: DiscoveryQuery = {}): Promise<DiscoveryResponse> {
    await this.delay('/api/v1/discovery');
    const { category, limit = 12, cursor } = query;

    let pins = this.posts.filter((p): p is VisualPinCard => p.post_type === 'visual');

    if (category && category !== 'all') {
      pins = pins.filter((p) =>
        p.community_slug?.toLowerCase().includes(category.toLowerCase())
      );
    }

    let startIndex = 0;
    if (cursor) {
      const foundIdx = pins.findIndex((p) => p.id === cursor);
      if (foundIdx >= 0) {
        startIndex = foundIdx + 1;
      }
    }

    const page = pins.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < pins.length;
    const nextCursor = hasMore && page.length > 0 ? page[page.length - 1].id : null;

    return {
      success: true,
      data: page,
      next_cursor: nextCursor,
      has_more: hasMore,
      meta: {
        count: page.length,
        server_execution_time_ms: 2.8,
      },
    };
  }

  public async getPost(postId: string): Promise<PostCard> {
    await this.delay(`/api/v1/posts/${postId}`);
    const post = this.posts.find((p) => p.id === postId);
    if (!post) {
      throw new ApiClientError({
        type: 'https://socialgraph.dev/errors/not-found',
        title: 'Post Not Found',
        status: 404,
        detail: `No post found with id ${postId}`,
        code: 'POST_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }
    return post;
  }

  public async getComments(postId: string): Promise<CommentNode[]> {
    await this.delay(`/api/v1/posts/${postId}/comments`);
    return this.comments[postId] || [];
  }

  public async votePost(postId: string, direction: 1 | -1 | 0): Promise<VoteResult> {
    await this.delay(`/api/v1/posts/${postId}/vote`);
    const post = this.posts.find((p) => p.id === postId);
    if (!post) {
      throw new ApiClientError({
        type: 'https://socialgraph.dev/errors/not-found',
        title: 'Post Not Found',
        status: 404,
        detail: `Cannot vote on nonexistent post ${postId}`,
        code: 'POST_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    // In-memory score update simulation
    let scoreDelta = 0;
    if (post.user_vote === 1) scoreDelta -= 1;
    if (post.user_vote === -1) scoreDelta += 1;
    if (direction === 1) scoreDelta += 1;
    if (direction === -1) scoreDelta -= 1;

    post.score += scoreDelta;
    post.user_vote = direction;

    return {
      post_id: postId,
      new_score: post.score,
      user_vote: post.user_vote,
    };
  }

  public async toggleSavePost(postId: string): Promise<{ post_id: string; is_saved: boolean }> {
    await this.delay(`/api/v1/posts/${postId}/save`);
    const post = this.posts.find((p) => p.id === postId);
    if (!post) {
      throw new ApiClientError({
        type: 'https://socialgraph.dev/errors/not-found',
        title: 'Post Not Found',
        status: 404,
        detail: `Cannot save nonexistent post ${postId}`,
        code: 'POST_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    post.is_saved = !post.is_saved;
    return {
      post_id: postId,
      is_saved: post.is_saved,
    };
  }

  public async createComment(postId: string, input: CreateCommentInput): Promise<CommentNode> {
    await this.delay(`/api/v1/posts/${postId}/comments`);
    const post = this.posts.find((p) => p.id === postId);
    if (!post) {
      throw new ApiClientError({
        type: 'https://socialgraph.dev/errors/not-found',
        title: 'Post Not Found',
        status: 404,
        detail: `Cannot comment on nonexistent post ${postId}`,
        code: 'POST_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    const newComment: CommentNode = {
      id: `cmt_${Date.now()}`,
      post_id: postId,
      parent_id: input.parent_id || null,
      author: toUserSummary(this.users.usr_1),
      content: input.content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      score: 1,
      user_vote: 1,
      depth: 0,
      replies: [],
    };

    if (!this.comments[postId]) {
      this.comments[postId] = [];
    }

    if (!input.parent_id) {
      this.comments[postId].unshift(newComment);
    } else {
      // Find parent and append reply
      const appendRecursive = (nodes: CommentNode[]): boolean => {
        for (const node of nodes) {
          if (node.id === input.parent_id) {
            newComment.depth = Math.min(node.depth + 1, 10);
            node.replies.push(newComment);
            return true;
          }
          if (node.replies.length > 0 && appendRecursive(node.replies)) {
            return true;
          }
        }
        return false;
      };

      const found = appendRecursive(this.comments[postId]);
      if (!found) {
        // Fallback to top level if parent not found
        this.comments[postId].push(newComment);
      }
    }

    post.comments_count += 1;
    return newComment;
  }

  public async getUserProfile(username: string): Promise<UserProfile> {
    await this.delay(`/api/v1/users/${username}`);
    const user = Object.values(this.users).find((u) => u.username === username);
    if (!user) {
      throw new ApiClientError({
        type: 'https://socialgraph.dev/errors/not-found',
        title: 'User Not Found',
        status: 404,
        detail: `User with username ${username} not found`,
        code: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }
    return user;
  }

  public async getUserPosts(username: string, query: FeedQuery = {}): Promise<FeedResponse> {
    await this.delay(`/api/v1/users/${username}/posts`);
    const user = Object.values(this.users).find((u) => u.username === username);
    if (!user) {
      throw new ApiClientError({
        type: 'https://socialgraph.dev/errors/not-found',
        title: 'User Not Found',
        status: 404,
        detail: `User with username ${username} not found`,
        code: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    const { limit = 10, cursor } = query;
    let items = this.posts.filter(
      (p) => p.author.username === username || p.author.id === user.id
    );

    // Profile posts: newest first
    items.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    let startIndex = 0;
    if (cursor) {
      const foundIdx = items.findIndex((p) => p.id === cursor);
      if (foundIdx >= 0) {
        startIndex = foundIdx + 1;
      }
    }

    const page = items.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < items.length;
    const nextCursor = hasMore && page.length > 0 ? page[page.length - 1].id : null;

    return {
      success: true,
      data: page,
      next_cursor: nextCursor,
      has_more: hasMore,
      meta: {
        count: page.length,
        server_execution_time_ms: 2.4,
      },
    };
  }

  public async toggleFollow(targetUserId: string): Promise<FollowToggleResponse> {
    await this.delay(`/api/v1/users/${targetUserId}/follow`);
    const user = this.users[targetUserId];
    if (!user) {
      throw new ApiClientError({
        type: 'https://socialgraph.dev/errors/not-found',
        title: 'User Not Found',
        status: 404,
        detail: `User ${targetUserId} not found`,
        code: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    user.is_following = !user.is_following;
    user.followers_count += user.is_following ? 1 : -1;

    return {
      target_user_id: targetUserId,
      is_following: user.is_following,
      followers_count: user.followers_count,
    };
  }

  public async getCommunity(communitySlug: string): Promise<Community> {
    await this.delay(`/api/v1/communities/${communitySlug}`);
    const comm = this.communities[communitySlug];
    if (!comm) {
      throw new ApiClientError({
        type: 'https://socialgraph.dev/errors/not-found',
        title: 'Community Not Found',
        status: 404,
        detail: `Community with slug ${communitySlug} not found`,
        code: 'COMMUNITY_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }
    return comm;
  }

  public async getCommunityFeed(
    communitySlug: string,
    query: FeedQuery = {}
  ): Promise<FeedResponse> {
    await this.delay(`/api/v1/communities/${communitySlug}/feed`);
    const community = await this.getCommunity(communitySlug);
    const { limit = 10, cursor } = query;

    const scoped = this.posts.filter((p) => p.community_id === community.id);
    let startIndex = 0;
    if (cursor) {
      const idx = scoped.findIndex((p) => p.id === cursor);
      if (idx >= 0) startIndex = idx + 1;
    }

    const page = scoped.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < scoped.length;
    const nextCursor = hasMore && page.length > 0 ? page[page.length - 1].id : null;

    return {
      success: true,
      data: page,
      next_cursor: nextCursor,
      has_more: hasMore,
      meta: {
        count: page.length,
        server_execution_time_ms: 2.1,
      },
    };
  }
}
