import type {
  HealthStatus,
  PostCard,
  DiscussionPostCard,
  VisualPinCard,
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
  CreatePostInput,
  MediaAttachment,
  ConversationSummary,
  DirectMessage,
  NotificationItem,
  NotificationsQuery,
  NotificationsResponse,
  MarkReadResponse,
  MarkAllReadResponse,
} from '@socialgraph/shared';

export type { NotificationItem, NotificationsQuery, NotificationsResponse, MarkReadResponse, MarkAllReadResponse };
export type DataSourceType = 'mock' | 'live';

export interface VoteResult {
  post_id: string;
  new_score: number;
  user_vote: 1 | -1 | 0;
}

export type SearchCategory = 'all' | 'discussions' | 'visual' | 'communities' | 'people';
export type SearchSort = 'relevance' | 'top' | 'new';

export interface SearchQuery {
  q: string;
  category?: SearchCategory;
  sort?: SearchSort;
  limit?: number;
}

export interface UniversalSearchResults {
  query: string;
  discussions: DiscussionPostCard[];
  visuals: VisualPinCard[];
  communities: Community[];
  users: UserProfile[];
  total_count: number;
}

export type SavedPostTypeFilter = 'all' | 'discussions' | 'visual';
export type SavedPostSort = 'new' | 'top' | 'comments';

export interface SavedPostsQuery {
  type?: SavedPostTypeFilter;
  communitySlug?: string;
  topic?: string;
  query?: string;
  sort?: SavedPostSort;
  cursor?: string | null;
  limit?: number;
}

export interface CommunityMembershipResult {
  community_id: string;
  is_member: boolean;
  members_count: number;
}

export interface GraphNode {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio?: string;
  followers_count?: number;
  following_count?: number;
  is_verified?: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphNeighborhoodData {
  center: GraphNode;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ISocialGraphApi {
  readonly dataSource: DataSourceType;

  // Health and system metrics
  getHealth(): Promise<HealthStatus>;
  getMetrics(): Promise<{ uptime_seconds: number; node_version: string; memory?: { rss_mb: number; heap_used_mb: number; heap_total_mb: number } }>;

  // Feeds
  getFeed(query?: FeedQuery): Promise<FeedResponse>;
  getDiscovery(query?: DiscoveryQuery): Promise<DiscoveryResponse>;
  getSavedPosts(query?: SavedPostsQuery): Promise<FeedResponse>;

  // Posts & Interactions
  uploadMedia(files: File[]): Promise<MediaAttachment[]>;
  getPost(postId: string): Promise<PostCard>;
  getComments(postId: string): Promise<CommentNode[]>;
  createPost(input: CreatePostInput, idempotencyKey?: string): Promise<PostCard>;
  votePost(postId: string, direction: 1 | -1 | 0): Promise<VoteResult>;
  toggleSavePost(postId: string): Promise<{ post_id: string; is_saved: boolean }>;
  createComment(postId: string, input: CreateCommentInput): Promise<CommentNode>;

  // Social Graph (Users & Communities)
  getUserProfile(username: string): Promise<UserProfile>;
  updateProfile(input: UpdateUserProfileInput): Promise<UserProfile>;
  getUserPosts(username: string, query?: FeedQuery): Promise<FeedResponse>;
  toggleFollow(targetUserId: string, isFollowing?: boolean): Promise<FollowToggleResponse>;
  getFollowers(username: string, cursor?: string | null, limit?: number): Promise<FollowListResponse>;
  getFollowing(username: string, cursor?: string | null, limit?: number): Promise<FollowListResponse>;
  getCommunity(communitySlug: string): Promise<Community>;
  getCommunities(): Promise<Community[]>;
  setCommunityMembership(communitySlug: string, isMember: boolean): Promise<CommunityMembershipResult>;
  getCommunityFeed(communitySlug: string, query?: FeedQuery): Promise<FeedResponse>;
  getGraphNeighborhood(limit?: number): Promise<GraphNeighborhoodData>;

  // Posts & Interactions - Edit & Delete
  editPost(postId: string, input: { title?: string; body?: string; media_urls?: string[]; community_id?: string }): Promise<PostCard>;
  deletePost(postId: string): Promise<{ success: boolean; post_id: string }>;

  // Search
  search(query: SearchQuery): Promise<UniversalSearchResults>;

  // Notifications
  getNotifications(query?: NotificationsQuery): Promise<NotificationsResponse>;
  getUnreadNotificationCount(): Promise<number>;
  markNotificationAsRead(notificationId: string): Promise<MarkReadResponse>;
  markAllNotificationsAsRead(): Promise<MarkAllReadResponse>;

  // Direct Messaging
  getConversations(cursor?: string | null, limit?: number): Promise<{ data: ConversationSummary[]; next_cursor: string | null; has_more: boolean }>;
  getOrCreateConversation(recipientId: string, initialMessage?: string): Promise<ConversationSummary>;
  getConversation(conversationId: string): Promise<ConversationSummary>;
  getMessages(conversationId: string, cursor?: string | null, limit?: number): Promise<{ data: DirectMessage[]; next_cursor: string | null; has_more: boolean }>;
  sendMessage(conversationId: string, content: string): Promise<DirectMessage>;
  deleteMessage(conversationId: string, messageId: string): Promise<DirectMessage>;
  deleteConversation(conversationId: string): Promise<{ success: boolean; message: string }>;
  markConversationAsRead(conversationId: string): Promise<void>;
  getUnreadMessagesCount(): Promise<number>;
}
