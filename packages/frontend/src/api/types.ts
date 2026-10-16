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
} from '@socialgraph/shared';

export type DataSourceType = 'mock' | 'live';

export interface VoteResult {
  post_id: string;
  new_score: number;
  user_vote: 1 | -1 | 0;
}

export interface ISocialGraphApi {
  readonly dataSource: DataSourceType;

  // Health and system metrics
  getHealth(): Promise<HealthStatus>;
  getMetrics(): Promise<{ uptime_seconds: number; node_version: string }>;

  // Feeds
  getFeed(query?: FeedQuery): Promise<FeedResponse>;
  getDiscovery(query?: DiscoveryQuery): Promise<DiscoveryResponse>;

  // Posts & Interactions
  getPost(postId: string): Promise<PostCard>;
  getComments(postId: string): Promise<CommentNode[]>;
  votePost(postId: string, direction: 1 | -1 | 0): Promise<VoteResult>;
  toggleSavePost(postId: string): Promise<{ post_id: string; is_saved: boolean }>;
  createComment(postId: string, input: CreateCommentInput): Promise<CommentNode>;

  // Social Graph (Users & Communities)
  getUserProfile(username: string): Promise<UserProfile>;
  getUserPosts(username: string, query?: FeedQuery): Promise<FeedResponse>;
  toggleFollow(targetUserId: string): Promise<FollowToggleResponse>;
  getCommunity(communitySlug: string): Promise<Community>;
  getCommunityFeed(communitySlug: string, query?: FeedQuery): Promise<FeedResponse>;
}
