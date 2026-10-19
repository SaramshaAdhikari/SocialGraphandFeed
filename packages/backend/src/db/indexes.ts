import type { Db } from 'mongodb';
import { COLLECTIONS } from './collections.js';

export async function ensureIndexes(db: Db): Promise<void> {
  const users = db.collection(COLLECTIONS.USERS);
  const sessions = db.collection(COLLECTIONS.SESSIONS);
  const posts = db.collection(COLLECTIONS.POSTS);
  const comments = db.collection(COLLECTIONS.COMMENTS);
  const follows = db.collection(COLLECTIONS.FOLLOWS);
  const communities = db.collection(COLLECTIONS.COMMUNITIES);
  const memberships = db.collection(COLLECTIONS.COMMUNITY_MEMBERSHIPS);
  const votes = db.collection(COLLECTIONS.POST_VOTES);
  const saves = db.collection(COLLECTIONS.POST_SAVES);

  await Promise.all([
    // Users: unique username
    users.createIndex({ username: 1 }, { unique: true, name: 'uniq_username' }),
    sessions.createIndex({ expires_at:  1 }, { expireAfterSeconds: 0, name: 'ttl_sessions' }),

    // Posts: reverse-chronological, top score, and hot score cursor pagination
    posts.createIndex({ created_at: -1, _id: -1 }, { name: 'idx_posts_created_at_id' }),
    posts.createIndex({ score: -1, created_at: -1, _id: -1 }, { name: 'idx_posts_score_created_at_id' }),
    posts.createIndex({ hot_score: -1, created_at: -1, _id: -1 }, { name: 'idx_posts_hot_created_at_id' }),
    posts.createIndex({ author_id: 1, created_at: -1 }, { name: 'idx_posts_author_created_at' }),
    posts.createIndex({ community_id: 1, created_at: -1 }, { name: 'idx_posts_community_created_at' }),
    posts.createIndex({ community_slug: 1, created_at: -1 }, { name: 'idx_posts_community_slug_created_at' }),
    posts.createIndex(
      { author_id: 1, idempotency_key: 1 },
      { unique: true, partialFilterExpression: { idempotency_key: { $type: 'string' } }, name: 'uniq_posts_author_idemp' }
    ),

    // Comments: post comment tree traversal
    comments.createIndex(
      { post_id: 1, parent_id: 1, created_at: 1 },
      { name: 'idx_comments_post_parent_created' }
    ),
    comments.createIndex(
      { author_id: 1, idempotency_key: 1 },
      { unique: true, partialFilterExpression: { idempotency_key: { $type: 'string' } }, name: 'uniq_comments_author_idemp' }
    ),

    // Follows: unique directed edges
    follows.createIndex({ follower_id: 1, target_user_id: 1 }, { unique: true, name: 'uniq_follower_target' }),
    follows.createIndex({ target_user_id: 1 }, { name: 'idx_target_user' }),
    follows.createIndex({ follower_id: 1 }, { name: 'idx_follower' }),

    // Communities: unique slug
    communities.createIndex({ slug: 1 }, { unique: true, name: 'uniq_slug' }),

    // Community Memberships: unique user-community pair
    memberships.createIndex({ user_id: 1, community_id: 1 }, { unique: true, name: 'uniq_user_community' }),
    memberships.createIndex({ user_id: 1 }, { name: 'idx_user_memberships' }),

    // Post Votes: unique user vote per post
    votes.createIndex({ post_id: 1, user_id: 1 }, { unique: true, name: 'uniq_post_vote' }),

    // Post Saves: unique user bookmark per post
    saves.createIndex({ post_id: 1, user_id: 1 }, { unique: true, name: 'uniq_post_save' }),
  ]);
}
