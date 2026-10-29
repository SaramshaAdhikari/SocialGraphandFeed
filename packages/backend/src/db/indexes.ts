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
  const notifications = db.collection(COLLECTIONS.NOTIFICATIONS);
  const reports = db.collection(COLLECTIONS.REPORTS);
  const inboxes = db.collection(COLLECTIONS.FEED_INBOXES);
  const conversations = db.collection(COLLECTIONS.CONVERSATIONS);
  const messages = db.collection(COLLECTIONS.MESSAGES);

  await Promise.all([
    // Users: unique username
    users.createIndex({ username: 1 }, { unique: true, name: 'uniq_username' }),
    users.createIndex({ display_name: 1 }, { name: 'idx_users_display_name' }),
    sessions.createIndex({ expires_at:  1 }, { expireAfterSeconds: 0, name: 'ttl_sessions' }),

    // Posts: reverse-chronological, top score, and hot score cursor pagination
    posts.createIndex({ created_at: -1, _id: -1 }, { name: 'idx_posts_created_at_id' }),
    posts.createIndex({ score: -1, created_at: -1, _id: -1 }, { name: 'idx_posts_score_created_at_id' }),
    posts.createIndex({ hot_score: -1, created_at: -1, _id: -1 }, { name: 'idx_posts_hot_created_at_id' }),
    posts.createIndex({ tags: 1 }, { name: 'idx_posts_tags' }),
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
    communities.createIndex({ name: 1 }, { name: 'idx_communities_name' }),

    // Community Memberships: unique user-community pair
    memberships.createIndex({ user_id: 1, community_id: 1 }, { unique: true, name: 'uniq_user_community' }),
    memberships.createIndex({ user_id: 1 }, { name: 'idx_user_memberships' }),

    // Post Votes: unique user vote per post
    votes.createIndex({ post_id: 1, user_id: 1 }, { unique: true, name: 'uniq_post_vote' }),
    votes.createIndex({ user_id: 1, post_id: 1 }, { name: 'idx_votes_user_post' }),

    // Post Saves: unique user bookmark per post
    saves.createIndex({ post_id: 1, user_id: 1 }, { unique: true, name: 'uniq_post_save' }),
    saves.createIndex({ user_id: 1, created_at: -1 }, { name: 'idx_saves_user_created_at' }),

    // Notifications: recipient-based reverse-chronological cursor pagination, unread counts, and deletion cascade cleanup
    notifications.createIndex(
      { recipient_id: 1, created_at: -1, _id: -1 },
      { name: 'idx_notifications_recipient_created_at_id' }
    ),
    notifications.createIndex(
      { recipient_id: 1, read: 1 },
      { name: 'idx_notifications_recipient_read' }
    ),
    notifications.createIndex(
      { post_id: 1 },
      { name: 'idx_notifications_post_id', sparse: true }
    ),
    notifications.createIndex(
      { comment_id: 1 },
      { name: 'idx_notifications_comment_id', sparse: true }
    ),

    // Reports: unique reporter per target, status-based moderation queue, compound target cleanup, and queue filtering
    reports.createIndex(
      { reporter_id: 1, target_type: 1, target_id: 1 },
      { unique: true, name: 'uniq_reporter_target' }
    ),
    reports.createIndex(
      { status: 1, created_at: -1, _id: -1 },
      { name: 'idx_reports_status_created_at_id' }
    ),
    reports.createIndex(
      { status: 1, target_type: 1, created_at: -1, _id: -1 },
      { name: 'idx_reports_status_target_type_created_at_id' }
    ),
    reports.createIndex(
      { target_type: 1, target_id: 1, status: 1 },
      { name: 'idx_reports_target_status' }
    ),

    // Feed Inboxes (Fan-Out-on-Write timeline): user timelines sorted by date, score, hot_score with post_id tie-breaking, unique delivery, and cascade cleanup
    inboxes.createIndex(
      { user_id: 1, created_at: -1, post_id: -1 },
      { name: 'idx_feed_inboxes_user_created_at_id' }
    ),
    inboxes.createIndex(
      { user_id: 1, hot_score: -1, created_at: -1, post_id: -1 },
      { name: 'idx_feed_inboxes_user_hot_score_id' }
    ),
    inboxes.createIndex(
      { user_id: 1, score: -1, created_at: -1, post_id: -1 },
      { name: 'idx_feed_inboxes_user_score_id' }
    ),
    inboxes.createIndex(
      { user_id: 1, post_id: 1 },
      { unique: true, name: 'uniq_feed_inbox_user_post' }
    ),
    inboxes.createIndex(
      { post_id: 1 },
      { name: 'idx_feed_inboxes_post_id' }
    ),
    inboxes.createIndex(
      { user_id: 1, author_id: 1 },
      { name: 'idx_feed_inboxes_user_author' }
    ),

    // Conversations: participant-based chronological lookup & deduplication
    conversations.createIndex(
      { participant_ids: 1, updated_at: -1 },
      { name: 'idx_conversations_participants_updated' }
    ),

    // Messages: conversation history retrieval & ordering
    messages.createIndex(
      { conversation_id: 1, created_at: -1, _id: -1 },
      { name: 'idx_messages_conversation_created' }
    ),
  ]);
}
