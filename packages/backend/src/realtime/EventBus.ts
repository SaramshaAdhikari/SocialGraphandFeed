import { randomUUID } from 'node:crypto';

export type RealtimeEvent =
  | {
      type: 'post.created';
      event_id: string;
      created_at: string;
      author_id: string;
      post_id: string;
      follower_ids: string[];
    }
  | {
      type: 'follow.created' | 'follow.deleted';
      event_id: string;
      created_at: string;
      actor_id: string;
      target_user_id: string;
    }
  | {
      type: 'post.liked' | 'post.unliked';
      event_id: string;
      created_at: string;
      actor_id: string;
      post_id: string;
      author_id: string;
    };

type Listener = (event: RealtimeEvent) => void;
type RealtimeEventInput =
  | Omit<Extract<RealtimeEvent, { type: 'post.created' }>, 'event_id' | 'created_at'>
  | Omit<Extract<RealtimeEvent, { type: 'follow.created' | 'follow.deleted' }>, 'event_id' | 'created_at'>
  | Omit<Extract<RealtimeEvent, { type: 'post.liked' | 'post.unliked' }>, 'event_id' | 'created_at'>;

class EventBus {
  private readonly listeners = new Map<string, Set<Listener>>();

  subscribe(userId: string, listener: Listener): () => void {
    const listeners = this.listeners.get(userId) ?? new Set<Listener>();
    listeners.add(listener);
    this.listeners.set(userId, listeners);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) this.listeners.delete(userId);
    };
  }

  publish(event: RealtimeEventInput): void {
    const complete = {
      ...event,
      event_id: `evt_${randomUUID()}`,
      created_at: new Date().toISOString(),
    } as RealtimeEvent;
    const recipients = complete.type === 'post.created'
      ? complete.follower_ids
      : complete.type === 'follow.created' || complete.type === 'follow.deleted'
        ? [complete.target_user_id]
        : 'author_id' in complete ? [complete.author_id] : [];

    for (const recipient of new Set(recipients)) {
      for (const listener of this.listeners.get(recipient) ?? []) listener(complete);
    }
  }
}

export const realtimeEventBus = new EventBus();
