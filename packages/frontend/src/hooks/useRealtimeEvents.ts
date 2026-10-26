import { useEffect, useRef, useState } from 'react';

export interface RealtimeEvent {
  type: string;
  event_id: string;
  created_at: string;
  post_id?: string;
  author_id?: string;
}

export function useRealtimeEvents(onEvent: (event: RealtimeEvent) => void) {
  const callbackRef = useRef(onEvent);
  const [connected, setConnected] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  useEffect(() => { callbackRef.current = onEvent; }, [onEvent]);

  useEffect(() => {
    let source: EventSource | null = null;
    let timer: number | undefined;
    let stopped = false;
    let attempt = 0;
    const connect = () => {
      if (stopped) return;
      source = new EventSource('/api/v1/realtime/events', { withCredentials: true });
      source.onopen = () => { attempt = 0; setConnected(true); };
      source.onerror = () => {
        setConnected(false);
        source?.close();
        if (!stopped) {
          const delay = Math.min(30_000, 1_000 * 2 ** attempt++);
          timer = window.setTimeout(() => { setReconnectCount((count) => count + 1); connect(); }, delay);
        }
      };
      for (const eventType of ['post.created', 'follow.created', 'follow.deleted', 'post.liked', 'post.unliked']) {
        source.addEventListener(eventType, (event) => {
          try { callbackRef.current(JSON.parse((event as MessageEvent).data) as RealtimeEvent); } catch { /* ignore malformed server events */ }
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
  }, []);

  return { connected, reconnectCount };
}
