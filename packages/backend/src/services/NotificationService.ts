import type { Db, Filter, ClientSession } from 'mongodb';
import {
  AppError,
  type NotificationType,
  type NotificationItem,
  type NotificationsQuery,
  type NotificationsResponse,
  type UserSummary,
} from '@socialgraph/shared';
import { getDb } from '../db/mongo.js';
import { COLLECTIONS } from '../db/collections.js';
import type { NotificationDoc, UserDoc } from '../db/types.js';
import { toNotificationItem, toUserSummary } from '../db/serialization.js';
import { realtimeEventBus } from '../realtime/EventBus.js';

export interface CreateNotificationOptions {
  recipient_id: string;
  actor_id: string;
  type: NotificationType;
  post_id?: string;
  comment_id?: string;
  conversation_id?: string;
  session?: ClientSession;
}

export class NotificationService {
  private get db(): Db {
    return getDb();
  }

  /**
   * Persistently creates an in-app notification.
   * Suppresses self-interactions (actor === recipient).
   * Ensures idempotency:
   *  - Follow notifications use a deterministic ID (`notif_flw_${actor}_${recipient}`).
   *  - Comment/reply notifications use a deterministic ID tied to comment (`notif_cmt_${commentId}`).
   */
  public async createNotification(opts: CreateNotificationOptions): Promise<NotificationDoc | null> {
    const { recipient_id, actor_id, type, post_id, comment_id, conversation_id, session } = opts;

    // Core rule: Never notify users of their own actions
    if (recipient_id === actor_id) {
      return null;
    }

    const notifsCol = this.db.collection<NotificationDoc>(COLLECTIONS.NOTIFICATIONS);
    const now = new Date();
    let savedDoc: NotificationDoc | null = null;

    if (type === 'follow') {
      const docId = `notif_flw_${actor_id}_${recipient_id}`;
      await notifsCol.updateOne(
        { _id: docId },
        {
          $set: {
            read: false,
            created_at: now,
          },
          $setOnInsert: {
            _id: docId,
            recipient_id,
            actor_id,
            type,
          },
          $unset: {
            read_at: '',
          },
        },
        { upsert: true, session }
      );
      savedDoc = (await notifsCol.findOne({ _id: docId }, { session })) || null;
    } else {
      // Comment, reply, or direct message notification
      const docId = comment_id
        ? `notif_cmt_${comment_id}`
        : type === 'message' && conversation_id
        ? `notif_msg_${conversation_id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
        : `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      const doc: NotificationDoc = {
        _id: docId,
        recipient_id,
        actor_id,
        type,
        post_id,
        comment_id,
        conversation_id,
        read: false,
        created_at: now,
      };

      try {
        await notifsCol.insertOne(doc, { session });
        savedDoc = doc;
      } catch (err: any) {
        if (err?.code === 11000) {
          // Idempotent retry: return existing document
          savedDoc = (await notifsCol.findOne({ _id: docId }, { session })) || null;
        } else {
          throw err;
        }
      }
    }

    // Emit real-time notification to the recipient via SSE
    if (savedDoc) {
      try {
        const actorDoc = await this.db.collection<UserDoc>(COLLECTIONS.USERS).findOne({ _id: actor_id }, { session });
        const item = toNotificationItem(savedDoc, actorDoc ? toUserSummary(actorDoc) : undefined);
        realtimeEventBus.publish({
          type: 'notification.created',
          recipient_id,
          notification: item,
        });
      } catch {
        // SSE delivery failure should not break notification persistence
      }
    }

    return savedDoc;
  }

  /**
   * Retrieves cursor-paginated notifications for an authenticated recipient, newest first.
   */
  public async getNotifications(
    userId: string,
    query: NotificationsQuery = {}
  ): Promise<NotificationsResponse> {
    const startTime = Date.now();
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const notifsCol = this.db.collection<NotificationDoc>(COLLECTIONS.NOTIFICATIONS);

    const filter: Filter<NotificationDoc> = { recipient_id: userId };
    if (query.unread_only) {
      filter.read = false;
    }

    if (query.cursor) {
      try {
        let cursorDate: Date;
        let cursorId: string;
        const decodedStr = Buffer.from(query.cursor, 'base64url').toString('utf8');
        const parsed = JSON.parse(decodedStr);

        if (parsed.t === 'new' && parsed.createdAt && parsed.id) {
          cursorDate = new Date(parsed.createdAt);
          cursorId = String(parsed.id);
        } else if (parsed.created_at && parsed.id) {
          cursorDate = new Date(parsed.created_at);
          cursorId = String(parsed.id);
        } else {
          throw new Error('Malformed cursor payload');
        }

        if (isNaN(cursorDate.getTime())) {
          throw new Error('Invalid cursor timestamp');
        }

        const cursorFilter = {
          $or: [
            { created_at: { $lt: cursorDate } },
            { created_at: cursorDate, _id: { $lt: cursorId } },
          ],
        };

        filter.$and = [cursorFilter];
      } catch (err: any) {
        throw AppError.badRequest(`Invalid or malformed pagination cursor: ${err?.message || 'decoding failed'}`);
      }
    }

    const docs = await notifsCol
      .find(filter)
      .sort({ created_at: -1, _id: -1 })
      .limit(limit + 1)
      .toArray();

    const hasMore = docs.length > limit;
    const page = hasMore ? docs.slice(0, limit) : docs;

    // Batch hydrate actor profiles without N+1 round trips
    const actorIds = [...new Set(page.map((d) => d.actor_id))];
    const actorDocs = actorIds.length > 0
      ? await this.db.collection<UserDoc>(COLLECTIONS.USERS).find({ _id: { $in: actorIds } }).toArray()
      : [];
    const actorMap = new Map<string, UserSummary>(actorDocs.map((u) => [u._id, toUserSummary(u)]));

    const data: NotificationItem[] = page.map((d) => toNotificationItem(d, actorMap.get(d.actor_id)));

    let nextCursor: string | null = null;
    if (hasMore && page.length > 0) {
      const last = page[page.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({ created_at: last.created_at.toISOString(), id: last._id }),
        'utf8'
      ).toString('base64url');
    }

    return {
      success: true,
      data,
      next_cursor: nextCursor,
      has_more: hasMore,
      meta: {
        count: data.length,
        server_execution_time_ms: Date.now() - startTime,
      },
    };
  }

  /**
   * Returns count of unread notifications for a recipient.
   */
  public async getUnreadCount(userId: string): Promise<number> {
    const notifsCol = this.db.collection<NotificationDoc>(COLLECTIONS.NOTIFICATIONS);
    return notifsCol.countDocuments({ recipient_id: userId, read: false });
  }

  /**
   * Marks a specific notification owned by the recipient as read.
   * Throws 404 NOT_FOUND if the notification does not exist or belongs to another user.
   */
  public async markAsRead(userId: string, notificationId: string): Promise<NotificationItem> {
    const notifsCol = this.db.collection<NotificationDoc>(COLLECTIONS.NOTIFICATIONS);
    const now = new Date();

    const updated = await notifsCol.findOneAndUpdate(
      { _id: notificationId, recipient_id: userId },
      { $set: { read: true, read_at: now } },
      { returnDocument: 'after' }
    );

    if (!updated) {
      throw AppError.notFound(`Notification '${notificationId}' not found`);
    }

    const actor = await this.db.collection<UserDoc>(COLLECTIONS.USERS).findOne({ _id: updated.actor_id });
    return toNotificationItem(updated, actor ? toUserSummary(actor) : undefined);
  }

  /**
   * Marks all unread notifications for the recipient as read.
   */
  public async markAllAsRead(userId: string): Promise<number> {
    const notifsCol = this.db.collection<NotificationDoc>(COLLECTIONS.NOTIFICATIONS);
    const res = await notifsCol.updateMany(
      { recipient_id: userId, read: false },
      { $set: { read: true, read_at: new Date() } }
    );
    return res.modifiedCount;
  }
}
