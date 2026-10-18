import type {
  HealthStatus,
  PostCard,
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
} from '@socialgraph/shared';
import type {
  ISocialGraphApi,
  VoteResult,
  DataSourceType,
  SearchQuery,
  UniversalSearchResults,
} from './types';
import { ApiClientError } from './client';

export class LiveClient implements ISocialGraphApi {
  public readonly dataSource: DataSourceType = 'live';
  private readonly baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
      let problem: ApiErrorResponse;
      try {
        problem = await res.json();
      } catch {
        problem = {
          type: 'https://socialgraph.dev/errors/http',
          title: 'HTTP Request Error',
          status: res.status,
          detail: res.statusText || 'An unexpected error occurred contacting the server.',
          code: 'HTTP_ERROR',
          timestamp: new Date().toISOString(),
        };
      }
      throw new ApiClientError(problem);
    }

    return res.json() as Promise<T>;
  }

  public async getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/api/v1/health');
  }

  public async getMetrics(): Promise<{ uptime_seconds: number; node_version: string }> {
    return this.request('/api/v1/metrics');
  }

  public async getFeed(query: FeedQuery = {}): Promise<FeedResponse> {
    const params = new URLSearchParams();
    if (query.cursor) params.set('cursor', query.cursor);
    if (query.limit) params.set('limit', String(query.limit));
    if (query.sort) params.set('sort', query.sort);
    if (query.scope) params.set('scope', query.scope);
    if (query.strategy) params.set('strategy', query.strategy);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<FeedResponse>(`/api/v1/feed${qs}`);
  }

  public async getDiscovery(query: DiscoveryQuery = {}): Promise<DiscoveryResponse> {
    const params = new URLSearchParams();
    if (query.cursor) params.set('cursor', query.cursor);
    if (query.limit) params.set('limit', String(query.limit));
    if (query.category) params.set('category', query.category);
    if (query.tag) params.set('tag', query.tag);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<DiscoveryResponse>(`/api/v1/discovery${qs}`);
  }

  public async getPost(postId: string): Promise<PostCard> {
    return this.request<PostCard>(`/api/v1/posts/${postId}`);
  }

  public async getComments(postId: string): Promise<CommentNode[]> {
    return this.request<CommentNode[]>(`/api/v1/posts/${postId}/comments`);
  }

  public async votePost(postId: string, direction: 1 | -1 | 0): Promise<VoteResult> {
    return this.request<VoteResult>(`/api/v1/posts/${postId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ direction }),
    });
  }

  public async toggleSavePost(postId: string): Promise<{ post_id: string; is_saved: boolean }> {
    return this.request<{ post_id: string; is_saved: boolean }>(`/api/v1/posts/${postId}/save`, {
      method: 'POST',
    });
  }

  public async createComment(postId: string, input: CreateCommentInput): Promise<CommentNode> {
    return this.request<CommentNode>(`/api/v1/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  public async createPost(input: CreatePostInput): Promise<PostCard> {
    return this.request<PostCard>('/api/v1/posts', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  public async getUserProfile(username: string): Promise<UserProfile> {
    return this.request<UserProfile>(`/api/v1/users/${username}`);
  }

  public async getUserPosts(username: string, query: FeedQuery = {}): Promise<FeedResponse> {
    const params = new URLSearchParams();
    if (query.cursor) params.set('cursor', query.cursor);
    if (query.limit) params.set('limit', String(query.limit));
    if (query.sort) params.set('sort', query.sort);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<FeedResponse>(`/api/v1/users/${username}/posts${qs}`);
  }

  public async toggleFollow(targetUserId: string): Promise<FollowToggleResponse> {
    return this.request<FollowToggleResponse>(`/api/v1/users/${targetUserId}/follow`, {
      method: 'POST',
    });
  }

  public async getCommunity(communitySlug: string): Promise<Community> {
    return this.request<Community>(`/api/v1/communities/${communitySlug}`);
  }

  public async getCommunities(): Promise<Community[]> {
    return this.request<Community[]>('/api/v1/communities');
  }

  public async getCommunityFeed(
    communitySlug: string,
    query: FeedQuery = {}
  ): Promise<FeedResponse> {
    const params = new URLSearchParams();
    if (query.cursor) params.set('cursor', query.cursor);
    if (query.limit) params.set('limit', String(query.limit));
    if (query.sort) params.set('sort', query.sort);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<FeedResponse>(`/api/v1/communities/${communitySlug}/feed${qs}`);
  }

  public async search(query: SearchQuery): Promise<UniversalSearchResults> {
    const params = new URLSearchParams();
    if (query.q) params.set('q', query.q);
    if (query.category) params.set('category', query.category);
    if (query.sort) params.set('sort', query.sort);
    if (query.limit) params.set('limit', String(query.limit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<UniversalSearchResults>(`/api/v1/search${qs}`);
  }
}
