import type {
  UserSummary,
  UserProfile,
  PostCard,
  VisualPinCard,
  DiscussionPostCard,
  CommentNode,
  Community,
  MediaAttachment,
} from '@socialgraph/shared';
import type { UserDoc, PostDoc, CommentDoc, CommunityDoc } from './types.js';

export function toUserSummary(user: UserDoc): UserSummary {
  return {
    id: user._id,
    username: user.username,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    is_verified: user.is_verified,
  };
}

export function toUserProfile(user: UserDoc, isFollowing = false): UserProfile {
  return {
    ...toUserSummary(user),
    bio: user.bio || '',
    banner_url: user.banner_url ?? undefined,
    website: user.website ?? undefined,
    followers_count: user.followers_count || 0,
    following_count: user.following_count || 0,
    posts_count: user.posts_count || 0,
    is_following: isFollowing,
    created_at: user.created_at.toISOString(),
  };
}

export function toPostCard(
  post: PostDoc,
  author: UserSummary,
  userVote: 1 | -1 | 0 = 0,
  isSaved = false
): PostCard {
  const base = {
    id: post._id,
    author,
    community_id: post.community_id ?? undefined,
    community_slug: post.community_slug ?? undefined,
    created_at: post.created_at.toISOString(),
    updated_at: post.updated_at.toISOString(),
    score: post.score ?? 0,
    user_vote: userVote,
    comments_count: post.comments_count ?? 0,
    is_saved: isSaved,
  };

  if (post.post_type === 'visual') {
    const rawMedia = Array.isArray(post.media) ? post.media[0] : post.media;
    const media: MediaAttachment = rawMedia || {
      id: `media_${post._id}`,
      url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200',
      aspect_ratio: 1.0,
    };

    const visualPin: VisualPinCard = {
      ...base,
      post_type: 'visual',
      title: post.title ?? undefined,
      caption: post.caption || post.content || undefined,
      media,
      collection_id: post.collection_id ?? undefined,
      dominant_color: post.dominant_color ?? undefined,
      destination_url: post.destination_url ?? undefined,
      tags: post.tags ?? undefined,
    };
    return visualPin;
  }

  const mediaArray = Array.isArray(post.media)
    ? post.media
    : post.media
    ? [post.media]
    : undefined;

  const discussion: DiscussionPostCard = {
    ...base,
    post_type: 'discussion',
    title: post.title,
    content: post.content || '',
    media: mediaArray,
    flair: post.flair ?? undefined,
    tags: post.tags ?? undefined,
  };
  return discussion;
}

export function toCommunity(comm: CommunityDoc, isMember = false): Community {
  return {
    id: comm._id,
    name: comm.name,
    slug: comm.slug,
    description: comm.description,
    banner_url: comm.banner_url,
    avatar_url: comm.avatar_url,
    members_count: comm.members_count || 0,
    rules: comm.rules || [],
    is_member: isMember,
    created_at: comm.created_at.toISOString(),
  };
}

export function buildCommentTree(
  comments: CommentDoc[],
  authorMap: Map<string, UserSummary>,
  userVotesMap?: Map<string, 1 | -1 | 0>
): CommentNode[] {
  const nodeMap = new Map<string, CommentNode>();
  const rootNodes: CommentNode[] = [];

  // Create node objects
  for (const c of comments) {
    const author = authorMap.get(c.author_id) || {
      id: c.author_id,
      username: 'unknown',
      display_name: 'Unknown User',
      avatar_url: '/avatars/alex-dev.svg',
      is_verified: false,
    };

    const node: CommentNode = {
      id: c._id,
      post_id: c.post_id,
      parent_id: c.parent_id,
      author,
      content: c.content,
      created_at: c.created_at.toISOString(),
      updated_at: c.updated_at.toISOString(),
      score: c.score ?? 0,
      user_vote: userVotesMap?.get(c._id) ?? 0,
      depth: c.depth ?? 0,
      replies: [],
    };
    nodeMap.set(c._id, node);
  }

  // Construct hierarchy
  for (const c of comments) {
    const node = nodeMap.get(c._id)!;
    if (c.parent_id && nodeMap.has(c.parent_id)) {
      const parent = nodeMap.get(c.parent_id)!;
      parent.replies.push(node);
    } else {
      rootNodes.push(node);
    }
  }

  return rootNodes;
}
