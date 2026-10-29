import { randomUUID } from 'node:crypto';
import type { Db } from 'mongodb';
import {
  AppError,
  type ConversationSummary,
  type DirectMessage,
  type UserSummary,
} from '@socialgraph/shared';
import { getDb } from '../db/mongo.js';
import { COLLECTIONS } from '../db/collections.js';
import type { ConversationDoc, DirectMessageDoc, UserDoc } from '../db/types.js';
import { toUserSummary } from '../db/serialization.js';
import { realtimeEventBus } from '../realtime/EventBus.js';
import { NotificationService } from './NotificationService.js';

export class ConversationService {
  private get db(): Db {
    return getDb();
  }

  /**
   * Retrieves an existing 1-on-1 direct conversation or creates a new one.
   */
  public async getOrCreateDirectConversation(
    currentUserId: string,
    recipientId: string
  ): Promise<ConversationSummary> {
    if (currentUserId === recipientId) {
      throw AppError.badRequest('Cannot create a direct conversation with yourself.');
    }

    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);
    const recipient = await usersCol.findOne({ _id: recipientId });
    if (!recipient) {
      throw AppError.notFound('User', recipientId);
    }

    const convCol = this.db.collection<ConversationDoc>(COLLECTIONS.CONVERSATIONS);
    const existing = await convCol.findOne({
      participant_ids: { $all: [currentUserId, recipientId], $size: 2 },
    });

    if (existing) {
      return this.formatConversation(existing, currentUserId);
    }

    const now = new Date();
    const convId = `conv_${randomUUID()}`;
    const newConv: ConversationDoc = {
      _id: convId,
      participant_ids: [currentUserId, recipientId].sort(),
      created_at: now,
      updated_at: now,
      unread_counts: {
        [currentUserId]: 0,
        [recipientId]: 0,
      },
    };

    await convCol.insertOne(newConv);
    return this.formatConversation(newConv, currentUserId);
  }

  /**
   * Lists conversations for the current user, ordered by most recently active.
   */
  public async getUserConversations(
    userId: string,
    cursor?: string,
    limit = 20
  ): Promise<{ data: ConversationSummary[]; next_cursor: string | null; has_more: boolean }> {
    const convCol = this.db.collection<ConversationDoc>(COLLECTIONS.CONVERSATIONS);
    const query: any = {
      participant_ids: userId,
      hidden_for: { $ne: userId },
    };

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        query.updated_at = { $lt: cursorDate };
      }
    }

    const docs = await convCol
      .find(query)
      .sort({ updated_at: -1 })
      .limit(limit + 1)
      .toArray();

    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;

    // Batch load all participant profiles for efficiency
    const allParticipantIds = Array.from(new Set(items.flatMap((c) => c.participant_ids)));
    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);
    const users = await usersCol.find({ _id: { $in: allParticipantIds } }).toArray();
    const userMap = new Map<string, UserSummary>();
    for (const u of users) {
      userMap.set(u._id, toUserSummary(u));
    }

    const formatted = items.map((doc) => this.formatConversationWithMap(doc, userId, userMap));
    const nextCursor =
      hasMore && items.length > 0
        ? items[items.length - 1].updated_at.toISOString()
        : null;

    return {
      data: formatted,
      next_cursor: nextCursor,
      has_more: hasMore,
    };
  }

  /**
   * Retrieves single conversation details if the user is an authorized participant.
   */
  public async getConversation(conversationId: string, userId: string): Promise<ConversationSummary> {
    const convCol = this.db.collection<ConversationDoc>(COLLECTIONS.CONVERSATIONS);
    const conv = await convCol.findOne({ _id: conversationId });
    if (!conv) {
      throw AppError.notFound('Conversation', conversationId);
    }

    if (!conv.participant_ids.includes(userId)) {
      throw AppError.forbidden('You are not a participant in this conversation.');
    }

    return this.formatConversation(conv, userId);
  }

  /**
   * Retrieves cursor-paginated messages for a conversation.
   */
  public async getMessages(
    conversationId: string,
    userId: string,
    cursor?: string,
    limit = 50
  ): Promise<{ data: DirectMessage[]; next_cursor: string | null; has_more: boolean }> {
    // Validate authorization
    await this.getConversation(conversationId, userId);

    const msgCol = this.db.collection<DirectMessageDoc>(COLLECTIONS.MESSAGES);
    const query: any = { conversation_id: conversationId };

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        query.created_at = { $lt: cursorDate };
      }
    }

    const docs = await msgCol
      .find(query)
      .sort({ created_at: -1 })
      .limit(limit + 1)
      .toArray();

    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;

    // Batch load sender profiles
    const senderIds = Array.from(new Set(items.map((m) => m.sender_id)));
    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);
    const senders = await usersCol.find({ _id: { $in: senderIds } }).toArray();
    const senderMap = new Map<string, UserSummary>();
    for (const s of senders) {
      senderMap.set(s._id, toUserSummary(s));
    }

    const messages: DirectMessage[] = items.map((doc) => ({
      id: doc._id,
      conversation_id: doc.conversation_id,
      sender_id: doc.sender_id,
      sender: senderMap.get(doc.sender_id),
      content: doc.content,
      is_read: doc.is_read,
      read_at: doc.read_at?.toISOString(),
      created_at: doc.created_at.toISOString(),
      is_deleted: doc.is_deleted,
      deleted_at: doc.deleted_at?.toISOString(),
    }));

    // Return in chronological order (oldest to newest) for optimal chat display
    const chronological = [...messages].reverse();

    const nextCursor =
      hasMore && items.length > 0
        ? items[items.length - 1].created_at.toISOString()
        : null;

    return {
      data: chronological,
      next_cursor: nextCursor,
      has_more: hasMore,
    };
  }

  /**
   * Persists a message, updates conversation last_message and recipient unread count,
   * and emits a private SSE event to the recipient.
   */
  public async sendMessage(
    conversationId: string,
    senderId: string,
    rawContent: string
  ): Promise<DirectMessage> {
    const conv = await this.getConversation(conversationId, senderId);
    const content = rawContent.trim();
    if (!content) {
      throw AppError.badRequest('Message content cannot be blank.');
    }
    if (content.length > 2000) {
      throw AppError.badRequest('Message content cannot exceed 2000 characters.');
    }

    const recipientId = conv.participant_ids.find((id) => id !== senderId);
    if (!recipientId) {
      throw AppError.badRequest('Invalid conversation participants.');
    }

    const msgId = `msg_${randomUUID()}`;
    const now = new Date();
    const msgDoc: DirectMessageDoc = {
      _id: msgId,
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      created_at: now,
      is_read: false,
    };

    const msgCol = this.db.collection<DirectMessageDoc>(COLLECTIONS.MESSAGES);
    await msgCol.insertOne(msgDoc);

    const convCol = this.db.collection<ConversationDoc>(COLLECTIONS.CONVERSATIONS);
    await convCol.updateOne(
      { _id: conversationId },
      {
        $set: {
          updated_at: now,
          hidden_for: [],
          last_message: {
            id: msgId,
            conversation_id: conversationId,
            sender_id: senderId,
            content,
            created_at: now.toISOString(),
          },
        },
        $inc: {
          [`unread_counts.${recipientId}`]: 1,
        },
      }
    );

    // Fetch sender summary
    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);
    const senderDoc = await usersCol.findOne({ _id: senderId });
    const senderSummary = senderDoc ? toUserSummary(senderDoc) : undefined;

    const directMessage: DirectMessage = {
      id: msgId,
      conversation_id: conversationId,
      sender_id: senderId,
      sender: senderSummary,
      content,
      is_read: false,
      created_at: now.toISOString(),
    };

    // Emit scoped real-time event to recipient
    realtimeEventBus.publish({
      type: 'message.created',
      conversation_id: conversationId,
      recipient_id: recipientId,
      sender_id: senderId,
      message: directMessage,
    });

    // Create persistent notification for the recipient
    try {
      const notificationService = new NotificationService();
      await notificationService.createNotification({
        recipient_id: recipientId,
        actor_id: senderId,
        type: 'message',
        conversation_id: conversationId,
      });
    } catch {
      // Notification creation error should not abort message sending
    }

    return directMessage;
  }

  /**
   * Marks all messages in conversation from the other participant as read.
   */
  public async markAsRead(conversationId: string, userId: string): Promise<{ success: true }> {
    await this.getConversation(conversationId, userId);

    const now = new Date();
    const msgCol = this.db.collection<DirectMessageDoc>(COLLECTIONS.MESSAGES);
    await msgCol.updateMany(
      { conversation_id: conversationId, sender_id: { $ne: userId }, is_read: false },
      { $set: { is_read: true, read_at: now } }
    );

    const convCol = this.db.collection<ConversationDoc>(COLLECTIONS.CONVERSATIONS);
    await convCol.updateOne(
      { _id: conversationId },
      { $set: { [`unread_counts.${userId}`]: 0 } }
    );

    const conv = await this.getConversation(conversationId, userId);
    const otherParticipantId = conv.participant_ids.find((id) => id !== userId);
    if (otherParticipantId) {
      realtimeEventBus.publish({
        type: 'message.read',
        conversation_id: conversationId,
        reader_id: userId,
        recipient_id: otherParticipantId,
      });
    }

    return { success: true };
  }

  /**
   * Returns total unread messages count for the given user across all conversations.
   */
  public async getTotalUnreadCount(userId: string): Promise<number> {
    const convCol = this.db.collection<ConversationDoc>(COLLECTIONS.CONVERSATIONS);
    const convs = await convCol
      .find({ participant_ids: userId })
      .project({ [`unread_counts.${userId}`]: 1 })
      .toArray();

    let total = 0;
    for (const c of convs) {
      const count = c.unread_counts?.[userId];
      if (typeof count === 'number' && count > 0) {
        total += count;
      }
    }
    return total;
  }

  /**
   * Deletes an individual message using server-enforced ownership and a tombstone representation.
   */
  public async deleteMessage(
    conversationId: string,
    messageId: string,
    userId: string
  ): Promise<DirectMessage> {
    const conv = await this.getConversation(conversationId, userId);

    const msgCol = this.db.collection<DirectMessageDoc>(COLLECTIONS.MESSAGES);
    const msg = await msgCol.findOne({ _id: messageId, conversation_id: conversationId });
    if (!msg) {
      throw AppError.notFound('Message', messageId);
    }

    if (msg.sender_id !== userId) {
      throw AppError.forbidden('You can only delete your own messages.');
    }

    const now = new Date();
    await msgCol.updateOne(
      { _id: messageId },
      {
        $set: {
          is_deleted: true,
          deleted_at: now,
          content: 'This message was deleted',
        },
      }
    );

    // Update conversation's last_message if this was the latest message
    const convCol = this.db.collection<ConversationDoc>(COLLECTIONS.CONVERSATIONS);
    if (conv.last_message?.id === messageId) {
      await convCol.updateOne(
        { _id: conversationId },
        {
          $set: {
            'last_message.content': 'This message was deleted',
            'last_message.is_deleted': true,
          },
        }
      );
    }

    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);
    const senderDoc = await usersCol.findOne({ _id: userId });
    const senderSummary = senderDoc ? toUserSummary(senderDoc) : undefined;

    const deletedDto: DirectMessage = {
      id: messageId,
      conversation_id: conversationId,
      sender_id: userId,
      sender: senderSummary,
      content: 'This message was deleted',
      is_read: msg.is_read,
      read_at: msg.read_at?.toISOString(),
      created_at: msg.created_at.toISOString(),
      is_deleted: true,
      deleted_at: now.toISOString(),
    };

    const recipientId = conv.participant_ids.find((id) => id !== userId);
    if (recipientId) {
      realtimeEventBus.publish({
        type: 'message.deleted',
        conversation_id: conversationId,
        message_id: messageId,
        message: deletedDto,
        recipient_id: recipientId,
        sender_id: userId,
      });
    }

    return deletedDto;
  }

  /**
   * Removes / hides a conversation from the caller's inbox while retaining history for the other participant.
   */
  public async deleteConversation(
    conversationId: string,
    userId: string
  ): Promise<{ success: true; message: string }> {
    const convCol = this.db.collection<ConversationDoc>(COLLECTIONS.CONVERSATIONS);
    const conv = await convCol.findOne({ _id: conversationId });
    if (!conv) {
      throw AppError.notFound('Conversation', conversationId);
    }

    if (!conv.participant_ids.includes(userId)) {
      throw AppError.forbidden('You are not a participant in this conversation.');
    }

    await convCol.updateOne(
      { _id: conversationId },
      {
        $addToSet: { hidden_for: userId },
        $set: { [`unread_counts.${userId}`]: 0 },
      }
    );

    realtimeEventBus.publish({
      type: 'conversation.deleted',
      conversation_id: conversationId,
      user_id: userId,
    });

    return { success: true, message: 'Conversation removed from inbox.' };
  }

  private async formatConversation(doc: ConversationDoc, currentUserId: string): Promise<ConversationSummary> {
    const usersCol = this.db.collection<UserDoc>(COLLECTIONS.USERS);
    const users = await usersCol.find({ _id: { $in: doc.participant_ids } }).toArray();
    const userMap = new Map<string, UserSummary>();
    for (const u of users) {
      userMap.set(u._id, toUserSummary(u));
    }
    return this.formatConversationWithMap(doc, currentUserId, userMap);
  }

  private formatConversationWithMap(
    doc: ConversationDoc,
    currentUserId: string,
    userMap: Map<string, UserSummary>
  ): ConversationSummary {
    const participants: UserSummary[] = [];
    let otherParticipant: UserSummary | undefined;

    for (const pid of doc.participant_ids) {
      const summary = userMap.get(pid);
      if (summary) {
        participants.push(summary);
        if (pid !== currentUserId) {
          otherParticipant = summary;
        }
      }
    }

    const lastMsg: DirectMessage | undefined = doc.last_message
      ? {
          id: doc.last_message.id,
          conversation_id: doc.last_message.conversation_id,
          sender_id: doc.last_message.sender_id,
          sender: userMap.get(doc.last_message.sender_id),
          content: doc.last_message.content,
          is_read: false,
          created_at: doc.last_message.created_at,
          is_deleted: doc.last_message.is_deleted,
        }
      : undefined;

    return {
      id: doc._id,
      participant_ids: doc.participant_ids,
      participants,
      other_participant: otherParticipant,
      last_message: lastMsg,
      unread_count: doc.unread_counts?.[currentUserId] || 0,
      created_at: doc.created_at.toISOString(),
      updated_at: doc.updated_at.toISOString(),
    };
  }
}
