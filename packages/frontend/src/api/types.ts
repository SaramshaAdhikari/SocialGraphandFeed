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
  FollowToggleResponse,
  FollowListResponse,
  Community,
  CreatePostInput,
  MediaAttachment,
} from '@socialgraph/shared';

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

export interface ISocialGraphApi {
  readonly dataSource: DataSourceType;

  // Health and system metrics
  getHealth(): Promise<HealthStatus>;
  getMetrics(): Promise<{ uptime_seconds: number; node_version: string }>;

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
  getUserPosts(username: string, query?: FeedQuery): Promise<FeedResponse>;
  toggleFollow(targetUserId: string, isFollowing?: boolean): Promise<FollowToggleResponse>;
  getFollowers(username: string, cursor?: string | null, limit?: number): Promise<FollowListResponse>;
  getFollowing(username: string, cursor?: string | null, limit?: number): Promise<FollowListResponse>;
  getCommunity(communitySlug: string): Promise<Community>;
  getCommunities(): Promise<Community[]>;
  setCommunityMembership(communitySlug: string, isMember: boolean): Promise<CommunityMembershipResult>;
  getCommunityFeed(communitySlug: string, query?: FeedQuery): Promise<FeedResponse>;

  // Search
  search(query: SearchQuery): Promise<UniversalSearchResults>;
}
