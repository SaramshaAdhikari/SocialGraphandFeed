import { useEffect, useRef, useState } from 'react';

export interface RealtimeEvent {
  type: string;
  event_id: string;
  created_at: string;
  post_id?: string;
  author_id?: string;
  conversation_id?: string;
  message?: any;
  recipient_id?: string;
  sender_id?: string;
  reader_id?: string;
  notification?: any;
}

export interface UseRealtimeEventsOptions {
  enabled?: boolean;
}

export function useRealtimeEvents(
  onEvent?: (event: RealtimeEvent) => void,
  options: UseRealtimeEventsOptions = {}
) {
  const { enabled = true } = options;
  const callbackRef = useRef(onEvent);
  const [connected, setConnected] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);

  useEffect(() => {
    callbackRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) {
      setConnected(false);
      return;
    }

    let source: EventSource | null = null;
    let timer: number | undefined;
    let stopped = false;
    let attempt = 0;

    const connect = () => {
      if (stopped) return;
      source = new EventSource('/api/v1/realtime/events', { withCredentials: true });
      source.onopen = () => {
        attempt = 0;
        setConnected(true);
      };
      source.onerror = () => {
        setConnected(false);
        source?.close();
        if (!stopped) {
          const delay = Math.min(30_000, 1_000 * 2 ** attempt++);
          timer = window.setTimeout(() => {
            setReconnectCount((count) => count + 1);
            connect();
          }, delay);
        }
      };

      const eventTypes = [
        'post.created',
        'follow.created',
        'follow.deleted',
        'post.liked',
        'post.unliked',
        'message.created',
        'message.read',
        'notification.created',
      ];

      for (const eventType of eventTypes) {
        source.addEventListener(eventType, (event) => {
          try {
            const parsed = JSON.parse((event as MessageEvent).data) as RealtimeEvent;
            if (callbackRef.current) {
              callbackRef.current(parsed);
            }
            // Dispatch global event for application-wide subscribers
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('socialgraph:realtime', { detail: parsed }));
            }
          } catch {
            /* ignore malformed server events */
          }
        });
      }
    };

    connect();

    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
      source?.close();
      setConnected(false);
    };
  }, [enabled]);

  return { connected, reconnectCount };
}
