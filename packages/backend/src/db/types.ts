import type { MediaAttachment, CommunityRule } from '@socialgraph/shared';

export interface UserDoc {
  _id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  banner_url?: string;
  website?: string;
  is_verified: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface PostDoc {
  _id: string;
  post_type: 'visual' | 'discussion';
  author_id: string;
  title: string;
  content?: string;
  caption?: string;
  community_id?: string;
  community_slug?: string;
  collection_id?: string;
  media?: MediaAttachment | MediaAttachment[];
  dominant_color?: string;
  flair?: string;
  tags?: string[];
  score: number;
  hot_score: number;
  comments_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface CommentDoc {
  _id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string;
  content: string;
  score: number;
  depth: number;
  created_at: Date;
  updated_at: Date;
}

export interface FollowDoc {
  _id: string;
  follower_id: string;
  target_user_id: string;
  created_at: Date;
}

export interface CommunityDoc {
  _id: string;
  name: string;
  slug: string;
  description: string;
  banner_url?: string;
  avatar_url?: string;
  members_count: number;
  rules: CommunityRule[];
  created_at: Date;
  updated_at: Date;
}

export interface CommunityMembershipDoc {
  _id: string;
  user_id: string;
  community_id: string;
  created_at: Date;
}

export interface PostVoteDoc {
  _id: string;
  post_id: string;
  user_id: string;
  direction: 1 | -1;
  created_at: Date;
  updated_at: Date;
}

export interface PostSaveDoc {
  _id: string;
  post_id: string;
  user_id: string;
  created_at: Date;
}
