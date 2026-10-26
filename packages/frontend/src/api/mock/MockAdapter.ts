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
  CreatePostInput,
  MediaAttachment,
} from '@socialgraph/shared';
import type {
  ISocialGraphApi,
  VoteResult,
  DataSourceType,
  SearchQuery,
  UniversalSearchResults,
  SavedPostsQuery,
} from '../types';
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

  public async getSavedPosts(query: SavedPostsQuery = {}): Promise<FeedResponse> {
    await this.delay('/api/v1/posts/saved');
    const {
      type = 'all',
      communitySlug,
      topic,
      query: searchQuery,
      sort = 'new',
      cursor,
      limit = 12,
    } = query;

    // 1. Filter to posts bookmarked by current user (is_saved === true)
    let items = this.posts.filter((p) => p.is_saved === true);

    // 2. Type filtering
    if (type === 'discussions') {
      items = items.filter((p) => p.post_type === 'discussion');
    } else if (type === 'visual') {
      items = items.filter((p) => p.post_type === 'visual');
    }

    // 3. Community / Topic filtering
    if (communitySlug && communitySlug !== 'all') {
      const targetSlug = communitySlug.replace(/^c\//, '').toLowerCase();
      items = items.filter(
        (p) =>
          p.community_slug?.toLowerCase() === targetSlug ||
          p.community_id?.toLowerCase() === targetSlug ||
          (targetSlug === 'c_systems' && (p.community_id === 'comm_systems' || p.community_slug === 'systems')) ||
          (targetSlug === 'comm_systems' && (p.community_id === 'comm_systems' || p.community_slug === 'systems'))
      );
    }
    if (topic && topic !== 'all') {
      const lowerTopic = topic.replace(/^#/, '').toLowerCase();
      items = items.filter((p) => {
        const matchesCommunity = p.community_slug?.toLowerCase() === lowerTopic;
        const matchesTags = p.tags?.some((t) => t.toLowerCase() === lowerTopic);
        const matchesFlair = p.post_type === 'discussion' && p.flair?.toLowerCase() === lowerTopic;
        return Boolean(matchesCommunity || matchesTags || matchesFlair);
      });
    }

    // 4. Search query filtering
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter((p) => {
        const titleMatch = p.title?.toLowerCase().includes(q) ?? false;
        const contentMatch =
          p.post_type === 'discussion'
            ? p.content?.toLowerCase().includes(q) ?? false
            : p.caption?.toLowerCase().includes(q) ?? false;
        const tagMatch = p.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        const authorMatch =
          p.author.username.toLowerCase().includes(q) ||
          p.author.display_name.toLowerCase().includes(q);
        const communityMatch = p.community_slug?.toLowerCase().includes(q) ?? false;
        return titleMatch || contentMatch || tagMatch || authorMatch || communityMatch;
      });
    }

    // 5. Sorting
    if (sort === 'new') {
      items.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sort === 'top') {
      items.sort((a, b) => b.score - a.score);
    } else if (sort === 'comments') {
      items.sort((a, b) => b.comments_count - a.comments_count);
    }

    // 6. Pagination
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
        server_execution_time_ms: 2.2,
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

  public async uploadMedia(files: File[]): Promise<MediaAttachment[]> {
    await this.delay('/api/v1/media/upload');
    if (!files || files.length === 0) return [];
    if (files.length > 10) {
      throw new ApiClientError({
        type: 'https://socialgraph.dev/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: 'Cannot upload more than 10 images per post.',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
    return files.map((file, idx) => ({
      id: `mock_med_${Date.now()}_${idx}`,
      url: `/uploads/med_${Date.now()}_${idx}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
      aspect_ratio: 1.33,
      alt_text: file.name.replace(/\.[^/.]+$/, ''),
    }));
  }

  public async createPost(input: CreatePostInput, _idempotencyKey?: string): Promise<PostCard> {
    await this.delay('/api/v1/posts');

    const hasMedia = Boolean(input.media && input.media.length > 0 && input.media.some((m) => m.url?.trim()));
    const hasText = Boolean(input.title?.trim() || input.content?.trim() || input.caption?.trim());
    if (!hasText && !hasMedia) {
      throw new ApiClientError({
        type: 'https://socialgraph.dev/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: 'Post must contain either text content or media attachments.',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
      });
    }

    if (input.media && input.media.length > 10) {
      throw new ApiClientError({
        type: 'https://socialgraph.dev/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: 'A post cannot contain more than 10 images.',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
      });
    }

    let postType: 'visual' | 'discussion';
    if (input.post_type) {
      postType = input.post_type;
    } else if (hasMedia) {
      postType = 'visual';
    } else {
      postType = 'discussion';
    }

    if (postType === 'discussion') {
      if (input.post_type === 'discussion' && (!input.title || input.title.trim().length === 0)) {
        throw new ApiClientError({
          type: 'https://socialgraph.dev/errors/validation',
          title: 'Validation Error',
          status: 400,
          detail: 'Post title is required and cannot be empty.',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString(),
        });
      }
      if (input.title && input.title.trim().length < 3) {
        throw new ApiClientError({
          type: 'https://socialgraph.dev/errors/validation',
          title: 'Validation Error',
          status: 400,
          detail: 'Discussion title must be at least 3 characters.',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString(),
        });
      }
      if (!hasMedia && (!input.content || input.content.trim().length === 0)) {
        throw new ApiClientError({
          type: 'https://socialgraph.dev/errors/validation',
          title: 'Validation Error',
          status: 400,
          detail: 'Discussion body content is required.',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (postType === 'visual') {
      const mediaItem = input.media?.[0];
      if (!mediaItem || !mediaItem.url || mediaItem.url.trim().length === 0) {
        throw new ApiClientError({
          type: 'https://socialgraph.dev/errors/validation',
          title: 'Validation Error',
          status: 400,
          detail: 'Visual pin requires a media URL.',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString(),
        });
      }
    }

    const authorUser = this.users['usr_0'] || mockUsers.usr_0;
    const author = toUserSummary(authorUser);

    let comm: Community | undefined;
    if (input.community_id) {
      comm =
        this.communities[input.community_id] ||
        Object.values(this.communities).find(
          (c) => c.id === input.community_id || c.slug === input.community_id
        );
    }

    const now = new Date().toISOString();
    let createdPost: DiscussionPostCard | VisualPinCard;

    if (postType === 'discussion') {
      const postId = `post_disc_${Date.now()}`;
      createdPost = {
        id: postId,
        post_type: 'discussion',
        author,
        community_id: comm?.id,
        community_slug: comm?.slug,
        created_at: now,
        updated_at: now,
        score: 1,
        user_vote: 1,
        comments_count: 0,
        is_saved: false,
        title: input.title?.trim() || (input.content?.slice(0, 60) || 'Untitled Post'),
        content: input.content?.trim() || '',
        flair: input.flair?.trim().replace(/^#+/, '') || (input.tags && input.tags.length > 0 ? input.tags[0].trim().replace(/^#+/, '').toLowerCase() : undefined),
        tags: input.tags && input.tags.length > 0
          ? Array.from(new Set(input.tags.map((t) => t.trim().replace(/^#+/, '').toLowerCase()).filter((t) => t.length > 0)))
          : undefined,
        media: input.media,
      };
    } else {
      const pinId = `pin_vis_${Date.now()}`;
      const mediaList = input.media || [];
      const mediaItem = mediaList[0];
      const visualTitle = input.title?.trim() || (input.caption?.slice(0, 50) || input.content?.slice(0, 50) || 'Photo');
      createdPost = {
        id: pinId,
        post_type: 'visual',
        author,
        community_id: comm?.id,
        community_slug: comm?.slug,
        created_at: now,
        updated_at: now,
        score: 1,
        user_vote: 1,
        comments_count: 0,
        is_saved: false,
        title: visualTitle,
        caption: input.caption?.trim() || input.content?.trim() || '',
        destination_url: input.destination_url?.trim() || undefined,
        tags: input.tags && input.tags.length > 0 ? input.tags : undefined,
        media: {
          id: mediaItem.id || `m_${Date.now()}`,
          url: mediaItem.url.trim(),
          aspect_ratio: mediaItem.aspect_ratio || 1.0,
          alt_text: mediaItem.alt_text || visualTitle,
          width: mediaItem.width,
          height: mediaItem.height,
        },
        media_list: mediaList.length > 1 ? mediaList : undefined,
        dominant_color: '#3B82F6',
      };
    }

    this.posts.unshift(createdPost);
    this.comments[createdPost.id] = [];
    if (authorUser) {
      authorUser.posts_count = (authorUser.posts_count || 0) + 1;
    }

    return createdPost;
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

  public async toggleFollow(targetUserId: string, desiredState?: boolean): Promise<FollowToggleResponse> {
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

    user.is_following = desiredState ?? !user.is_following;
    user.followers_count += user.is_following ? 1 : -1;

    return {
      target_user_id: targetUserId,
      is_following: user.is_following,
      followers_count: user.followers_count,
    };
  }

  public async getFollowers(username: string, cursor?: string | null, limit = 20): Promise<import('@socialgraph/shared').FollowListResponse> { return this.mockFollowList(username, true, cursor, limit); }
  public async getFollowing(username: string, cursor?: string | null, limit = 20): Promise<import('@socialgraph/shared').FollowListResponse> { return this.mockFollowList(username, false, cursor, limit); }
  private async mockFollowList(username: string, followers: boolean, cursor?: string | null, limit = 20): Promise<import('@socialgraph/shared').FollowListResponse> {
    await this.delay(`/api/v1/users/${username}/${followers ? 'followers' : 'following'}`);
    const target = Object.values(this.users).find((u) => u.username === username);
    if (!target) throw new Error('User not found');
    const candidates = Object.values(this.users).filter((u) => followers ? u.is_following : target.is_following && u.id === 'usr_0');
    const start = cursor ? Math.max(0, candidates.findIndex((u) => u.id === cursor) + 1) : 0;
    const page = candidates.slice(start, start + limit);
    const hasMore = start + limit < candidates.length;
    return { data: page.map((u) => ({ id: u.id, username: u.username, display_name: u.display_name, avatar_url: u.avatar_url, is_verified: u.is_verified, is_following: u.is_following })), total_count: candidates.length, has_more: hasMore, next_cursor: hasMore ? page[page.length - 1].id : null };
  }

  public async getCommunity(communitySlug: string): Promise<Community> {
    await this.delay(`/api/v1/communities/${communitySlug}`);
    const normalized = communitySlug.toLowerCase();
    const aliasMap: Record<string, string> = {
      c_systems: 'comm_systems',
      c_architecture: 'comm_architecture',
      c_frontend: 'comm_frontend',
      c_photography: 'comm_photography',
      c_design: 'comm_design',
    };
    const resolvedId = aliasMap[normalized] || normalized;
    const comm =
      this.communities[communitySlug] ||
      this.communities[normalized] ||
      this.communities[resolvedId] ||
      Object.values(this.communities).find(
        (c) =>
          c.slug.toLowerCase() === normalized ||
          c.id.toLowerCase() === normalized ||
          c.id.toLowerCase() === resolvedId
      );

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
    const { sort = 'hot', limit = 10, cursor } = query;

    const scoped = this.posts.filter(
      (p) =>
        p.community_id === community.id ||
        (community.id === 'comm_systems' && p.community_id === 'c_systems') ||
        p.community_slug === community.slug
    );

    // Sorting implementation
    if (sort === 'hot' || sort === 'top') {
      scoped.sort((a, b) => b.score - a.score);
    } else if (sort === 'new') {
      scoped.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

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

  public async getCommunities(): Promise<Community[]> {
    await this.delay('/api/v1/communities');
    return Object.values(this.communities);
  }

  public async setCommunityMembership(
    communitySlug: string,
    isMember: boolean
  ): Promise<{ community_id: string; is_member: boolean; members_count: number }> {
    const endpoint = `/api/v1/communities/${communitySlug}/join`;
    await this.delay(endpoint);
    const community = Object.values(this.communities).find((item) => item.slug === communitySlug);
    if (!community) {
      throw new ApiClientError({
        type: 'https://socialgraph.dev/errors/not-found',
        title: 'Community Not Found',
        status: 404,
        detail: `Community with slug ${communitySlug} not found`,
        code: 'COMMUNITY_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    if (community.is_member !== isMember) {
      community.is_member = isMember;
      community.members_count = Math.max(0, community.members_count + (isMember ? 1 : -1));
    }
    return {
      community_id: community.id,
      is_member: community.is_member,
      members_count: community.members_count,
    };
  }

  public async search(query: SearchQuery): Promise<UniversalSearchResults> {
    const rawQ = query.q || '';
    await this.delay(`/api/v1/search?q=${encodeURIComponent(rawQ)}`);

    const q = rawQ.trim().toLowerCase();
    const sort = query.sort || 'relevance';
    const category = query.category || 'all';

    if (!q) {
      return {
        query: rawQ,
        discussions: [],
        visuals: [],
        communities: [],
        users: [],
        total_count: 0,
      };
    }

    const terms = q.split(/\s+/).filter(Boolean);

    const matchesTerm = (text?: string): boolean => {
      if (!text) return false;
      const lower = text.toLowerCase();
      return terms.some((t) => lower.includes(t));
    };

    const calculateRelevance = (primaryText?: string, secondaryText?: string): number => {
      let score = 0;
      const lowerPrimary = primaryText ? primaryText.toLowerCase() : '';
      const lowerSecondary = secondaryText ? secondaryText.toLowerCase() : '';

      // Exact phrase match in primary
      if (lowerPrimary && lowerPrimary === q) score += 100;
      else if (lowerPrimary && lowerPrimary.startsWith(q)) score += 50;
      else if (lowerPrimary && lowerPrimary.includes(q)) score += 30;

      // Token matches
      for (const t of terms) {
        if (lowerPrimary && lowerPrimary.includes(t)) score += 15;
        if (lowerSecondary && lowerSecondary.includes(t)) score += 5;
      }
      return score;
    };

    // Filter discussions
    let matchingDiscussions: DiscussionPostCard[] = [];
    if (category === 'all' || category === 'discussions') {
      matchingDiscussions = (
        this.posts.filter((p) => p.post_type === 'discussion') as DiscussionPostCard[]
      ).filter((post) => {
        return (
          matchesTerm(post.title) ||
          matchesTerm(post.content) ||
          matchesTerm(post.flair) ||
          matchesTerm(post.community_slug) ||
          matchesTerm(post.author.username) ||
          matchesTerm(post.author.display_name)
        );
      });

      if (sort === 'relevance') {
        matchingDiscussions.sort((a, b) => {
          const relA = calculateRelevance(a.title, `${a.content} ${a.flair || ''} ${a.community_slug || ''}`);
          const relB = calculateRelevance(b.title, `${b.content} ${b.flair || ''} ${b.community_slug || ''}`);
          return relB !== relA ? relB - relA : b.score - a.score;
        });
      } else if (sort === 'top') {
        matchingDiscussions.sort((a, b) => b.score - a.score);
      } else if (sort === 'new') {
        matchingDiscussions.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
    }

    // Filter visuals
    let matchingVisuals: VisualPinCard[] = [];
    if (category === 'all' || category === 'visual') {
      matchingVisuals = (
        this.posts.filter((p) => p.post_type === 'visual') as VisualPinCard[]
      ).filter((pin) => {
        return (
          matchesTerm(pin.title) ||
          matchesTerm(pin.caption) ||
          matchesTerm(pin.community_slug) ||
          matchesTerm(pin.media.alt_text) ||
          matchesTerm(pin.author.username) ||
          matchesTerm(pin.author.display_name)
        );
      });

      if (sort === 'relevance') {
        matchingVisuals.sort((a, b) => {
          const relA = calculateRelevance(a.title, `${a.caption || ''} ${a.media.alt_text || ''} ${a.community_slug || ''}`);
          const relB = calculateRelevance(b.title, `${b.caption || ''} ${b.media.alt_text || ''} ${b.community_slug || ''}`);
          return relB !== relA ? relB - relA : b.score - a.score;
        });
      } else if (sort === 'top') {
        matchingVisuals.sort((a, b) => b.score - a.score);
      } else if (sort === 'new') {
        matchingVisuals.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
    }

    // Filter communities
    let matchingCommunities: Community[] = [];
    if (category === 'all' || category === 'communities') {
      matchingCommunities = Object.values(this.communities).filter((comm) => {
        return (
          matchesTerm(comm.name) ||
          matchesTerm(comm.slug) ||
          matchesTerm(comm.description)
        );
      });

      if (sort === 'relevance') {
        matchingCommunities.sort((a, b) => {
          const relA = calculateRelevance(a.name, `${a.slug} ${a.description}`);
          const relB = calculateRelevance(b.name, `${b.slug} ${b.description}`);
          return relB !== relA ? relB - relA : b.members_count - a.members_count;
        });
      } else if (sort === 'top') {
        matchingCommunities.sort((a, b) => b.members_count - a.members_count);
      } else if (sort === 'new') {
        matchingCommunities.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
    }

    // Filter users
    let matchingUsers: UserProfile[] = [];
    if (category === 'all' || category === 'people') {
      matchingUsers = Object.values(this.users).filter((u) => {
        return (
          matchesTerm(u.username) ||
          matchesTerm(u.display_name) ||
          matchesTerm(u.bio)
        );
      });

      if (sort === 'relevance') {
        matchingUsers.sort((a, b) => {
          const relA = calculateRelevance(a.username, `${a.display_name} ${a.bio || ''}`);
          const relB = calculateRelevance(b.username, `${b.display_name} ${b.bio || ''}`);
          return relB !== relA ? relB - relA : b.followers_count - a.followers_count;
        });
      } else if (sort === 'top') {
        matchingUsers.sort((a, b) => b.followers_count - a.followers_count);
      } else if (sort === 'new') {
        matchingUsers.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
    }

    const total_count =
      matchingDiscussions.length +
      matchingVisuals.length +
      matchingCommunities.length +
      matchingUsers.length;

    return {
      query: rawQ,
      discussions: matchingDiscussions,
      visuals: matchingVisuals,
      communities: matchingCommunities,
      users: matchingUsers,
      total_count,
    };
  }
}
