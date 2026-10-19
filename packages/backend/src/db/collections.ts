export const COLLECTIONS = {
  USERS: 'users',
  SESSIONS: 'sessions',
  POSTS: 'posts',
  COMMENTS: 'comments',
  FOLLOWS: 'follows',
  COMMUNITIES: 'communities',
  COMMUNITY_MEMBERSHIPS: 'community_memberships',
  POST_VOTES: 'post_votes',
  POST_SAVES: 'post_saves',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
