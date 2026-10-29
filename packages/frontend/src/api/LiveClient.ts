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
  UpdateUserProfileInput,
  FollowToggleResponse,
  FollowListResponse,
  Community,
  ApiErrorResponse,
  CreatePostInput,
  MediaAttachment,
  ConversationSummary,
  DirectMessage,
  NotificationsQuery,
  NotificationsResponse,
  MarkReadResponse,
  MarkAllReadResponse,
} from '@socialgraph/shared';
import type {
  ISocialGraphApi,
  VoteResult,
  DataSourceType,
  SearchQuery,
  UniversalSearchResults,
  SavedPostsQuery,
  GraphNeighborhoodData,
} from './types';
import { ApiClientError } from './client';

let csrfToken: string | undefined;
export function setCsrfToken(token?: string) { csrfToken = token; }

interface CommunityMembershipResult {
  community_id: string;
  is_member: boolean;
  members_count: number;
}

export class LiveClient implements ISocialGraphApi {
  public readonly dataSource: DataSourceType = 'live';
  private readonly baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || '');
    if (mutating && !csrfToken) {
      const sessionResponse = await fetch(`${this.baseUrl}/api/v1/auth/session`, { credentials: 'include' });
      if (sessionResponse.ok) {
        csrfToken = (await sessionResponse.json()).csrf_token;
      } else {
        const csrfResponse = await fetch(`${this.baseUrl}/api/v1/auth/csrf`, { credentials: 'include' });
        if (csrfResponse.ok) csrfToken = (await csrfResponse.json()).csrf_token;
      }
    }
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(mutating && csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    const res = await fetch(url, { ...options, headers, credentials: 'include' });

    if (res.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('socialgraph:unauthorized'));
    }

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

  public async getMetrics(): Promise<{ uptime_seconds: number; node_version: string; memory?: { rss_mb: number; heap_used_mb: number; heap_total_mb: number } }> {
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

  public async getSavedPosts(query: SavedPostsQuery = {}): Promise<FeedResponse> {
    const params = new URLSearchParams();
    if (query.cursor) params.set('cursor', query.cursor);
    if (query.limit) params.set('limit', String(query.limit));
    if (query.sort) params.set('sort', query.sort);
    if (query.type) params.set('type', query.type);
    if (query.communitySlug) params.set('community', query.communitySlug);
    if (query.topic) params.set('topic', query.topic);
    if (query.query) params.set('q', query.query);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<FeedResponse>(`/api/v1/posts/saved${qs}`);
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
      body: JSON.stringify({}),
    });
  }

  public async createComment(postId: string, input: CreateCommentInput): Promise<CommentNode> {
    return this.request<CommentNode>(`/api/v1/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  public async uploadMedia(files: File[]): Promise<MediaAttachment[]> {
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

    const formData = new FormData();
    for (const f of files) {
      formData.append('file', f);
    }

    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const res = await fetch(`${this.baseUrl}/api/v1/media/upload`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData,
    });

    if (!res.ok) {
      let problem: any;
      try {
        problem = await res.json();
      } catch {
        problem = { status: res.status, title: 'Upload Failed', detail: res.statusText };
      }
      throw new ApiClientError(problem);
    }

    const data = await res.json();
    return data.media || [];
  }

  public async createPost(input: CreatePostInput, idempotencyKey?: string): Promise<PostCard> {
    if (input.media && input.media.some((m) => m.url.startsWith('blob:'))) {
      throw new ApiClientError({
        type: 'https://socialgraph.dev/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: 'Local blob URLs cannot be persisted in live mode. Please provide an externally accessible HTTP/HTTPS image URL.',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
      });
    }

    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    return this.request<PostCard>('/api/v1/posts', {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });
  }

  public async getUserProfile(username: string): Promise<UserProfile> {
    return this.request<UserProfile>(`/api/v1/users/${username}`);
  }

  public async updateProfile(input: UpdateUserProfileInput): Promise<UserProfile> {
    return this.request<UserProfile>('/api/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  public async getUserPosts(username: string, query: FeedQuery = {}): Promise<FeedResponse> {
    const params = new URLSearchParams();
    if (query.cursor) params.set('cursor', query.cursor);
    if (query.limit) params.set('limit', String(query.limit));
    if (query.sort) params.set('sort', query.sort);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<FeedResponse>(`/api/v1/users/${username}/posts${qs}`);
  }

  public async toggleFollow(targetUserId: string, isFollowing?: boolean): Promise<FollowToggleResponse> {
    if (isFollowing !== undefined) return this.request<FollowToggleResponse>(`/api/v1/users/${targetUserId}/follow`, { method: 'PUT', body: JSON.stringify({ is_following: isFollowing }) });
    return this.request<FollowToggleResponse>(`/api/v1/users/${targetUserId}/follow`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  public async getFollowers(username: string, cursor?: string | null, limit = 20): Promise<FollowListResponse> { return this.getFollowList(username, 'followers', cursor, limit); }
  public async getFollowing(username: string, cursor?: string | null, limit = 20): Promise<FollowListResponse> { return this.getFollowList(username, 'following', cursor, limit); }
  private async getFollowList(username: string, direction: 'followers' | 'following', cursor?: string | null, limit = 20): Promise<FollowListResponse> {
    const params = new URLSearchParams({ limit: String(limit) }); if (cursor) params.set('cursor', cursor);
    return this.request<FollowListResponse>(`/api/v1/users/${encodeURIComponent(username)}/${direction}?${params}`);
  }

  public async getCommunity(communitySlug: string): Promise<Community> {
    return this.request<Community>(`/api/v1/communities/${communitySlug}`);
  }

  public async getCommunities(): Promise<Community[]> {
    return this.request<Community[]>('/api/v1/communities');
  }

  public async setCommunityMembership(
    communitySlug: string,
    isMember: boolean
  ): Promise<CommunityMembershipResult> {
    const slug = encodeURIComponent(communitySlug);
    if (isMember) {
      return this.request<CommunityMembershipResult>(`/api/v1/communities/${slug}/join`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
    }
    return this.request<CommunityMembershipResult>(`/api/v1/communities/${slug}/join`, {
      method: 'DELETE',
    });
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

  public async getGraphNeighborhood(limit = 24): Promise<GraphNeighborhoodData> {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<GraphNeighborhoodData>(`/api/v1/graph/neighborhood${qs}`);
  }

  // Direct Messaging
  public async getConversations(
    cursor?: string | null,
    limit = 20
  ): Promise<{ data: ConversationSummary[]; next_cursor: string | null; has_more: boolean }> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    return this.request(`/api/v1/conversations?${params.toString()}`);
  }

  public async getOrCreateConversation(
    recipientId: string,
    initialMessage?: string
  ): Promise<ConversationSummary> {
    const res = await this.request<{ success: boolean; data: ConversationSummary }>('/api/v1/conversations', {
      method: 'POST',
      body: JSON.stringify({ recipient_id: recipientId, initial_message: initialMessage }),
    });
    return res.data;
  }

  public async getConversation(conversationId: string): Promise<ConversationSummary> {
    const res = await this.request<{ success: boolean; data: ConversationSummary }>(
      `/api/v1/conversations/${encodeURIComponent(conversationId)}`
    );
    return res.data;
  }

  public async getMessages(
    conversationId: string,
    cursor?: string | null,
    limit = 50
  ): Promise<{ data: DirectMessage[]; next_cursor: string | null; has_more: boolean }> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    return this.request(`/api/v1/conversations/${encodeURIComponent(conversationId)}/messages?${params.toString()}`);
  }

  public async sendMessage(conversationId: string, content: string): Promise<DirectMessage> {
    const res = await this.request<{ success: boolean; data: DirectMessage }>(
      `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      }
    );
    return res.data;
  }

  public async deleteMessage(conversationId: string, messageId: string): Promise<DirectMessage> {
    const res = await this.request<{ success: boolean; data: DirectMessage }>(
      `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`,
      {
        method: 'DELETE',
      }
    );
    return res.data;
  }

  public async deleteConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/api/v1/conversations/${encodeURIComponent(conversationId)}`,
      {
        method: 'DELETE',
      }
    );
  }

  public async markConversationAsRead(conversationId: string): Promise<void> {
    await this.request(`/api/v1/conversations/${encodeURIComponent(conversationId)}/read`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  public async getUnreadMessagesCount(): Promise<number> {
    const res = await this.request<{ success: boolean; unread_count: number }>('/api/v1/conversations/unread-count');
    return res.unread_count || 0;
  }
  public async editPost(
    postId: string,
    input: { title?: string; body?: string; media_urls?: string[]; community_id?: string }
  ): Promise<PostCard> {
    return this.request<PostCard>(`/api/v1/posts/${encodeURIComponent(postId)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  public async deletePost(postId: string): Promise<{ success: boolean; post_id: string }> {
    return this.request<{ success: boolean; post_id: string }>(
      `/api/v1/posts/${encodeURIComponent(postId)}`,
      {
        method: 'DELETE',
      }
    );
  }

  public async getNotifications(query?: NotificationsQuery): Promise<NotificationsResponse> {
    const params = new URLSearchParams();
    if (query?.cursor) params.set('cursor', query.cursor);
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.unread_only) params.set('unread_only', 'true');
    const qs = params.toString();
    return this.request<NotificationsResponse>(`/api/v1/notifications${qs ? `?${qs}` : ''}`);
  }

  public async getUnreadNotificationCount(): Promise<number> {
    const res = await this.request<{ unread_count: number }>('/api/v1/notifications/unread-count');
    return res.unread_count || 0;
  }

  public async markNotificationAsRead(notificationId: string): Promise<MarkReadResponse> {
    return this.request<MarkReadResponse>(
      `/api/v1/notifications/${encodeURIComponent(notificationId)}/read`,
      {
        method: 'PATCH',
        body: JSON.stringify({}),
      }
    );
  }

  public async markAllNotificationsAsRead(): Promise<MarkAllReadResponse> {
    return this.request<MarkAllReadResponse>('/api/v1/notifications/read-all', {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
  }
}
