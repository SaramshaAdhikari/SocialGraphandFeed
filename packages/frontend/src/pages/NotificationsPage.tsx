import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  UserPlus,
  MessageCircle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { api } from '../api';
import type { NotificationItem } from '@socialgraph/shared';
import { useRouter } from '../router/Router';
import { useAuth } from '../auth/AuthContext';
import { Avatar, Button } from '../components/ui';

function formatTimeAgo(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffSec = Math.max(0, Math.floor((now - date) / 1000));
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

export function NotificationsPage() {
  const { user, status } = useAuth();
  const { navigate } = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(
    async (cursor?: string | null, isRefresh = false) => {
      if (!user || status !== 'authenticated') return;
      if (isRefresh) setLoading(true);
      setError(null);

      try {
        const [res, count] = await Promise.all([
          api.getNotifications({
            cursor: cursor || undefined,
            limit: 25,
            unread_only: filter === 'unread' ? true : undefined,
          }),
          api.getUnreadNotificationCount(),
        ]);

        if (cursor) {
          setNotifications((prev) => [...prev, ...res.data]);
        } else {
          setNotifications(res.data);
        }
        setNextCursor(res.next_cursor || null);
        setHasMore(res.has_more);
        setUnreadCount(count);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load notifications.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [user, status, filter]
  );

  useEffect(() => {
    fetchNotifications(null, true);
  }, [fetchNotifications]);

  // Listen to incoming real-time notifications
  useEffect(() => {
    const handleRealtime = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (!detail) return;

      if (detail.type === 'notification.created' && detail.notification) {
        setNotifications((prev) => [detail.notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    };

    window.addEventListener('socialgraph:realtime', handleRealtime);
    return () => {
      window.removeEventListener('socialgraph:realtime', handleRealtime);
    };
  }, []);

  const handleMarkAsRead = async (e: React.MouseEvent, notif: NotificationItem) => {
    e.stopPropagation();
    if (notif.read) return;

    try {
      await api.markNotificationAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silent fail
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Silent fail
    } finally {
      setMarkingAll(false);
    }
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      void api.markNotificationAsRead(notif.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    if (notif.type === 'message' && notif.conversation_id) {
      navigate(`/messages/${notif.conversation_id}`);
    } else if (notif.type === 'follow' && notif.actor) {
      navigate(`/u/${notif.actor.username}`);
    } else if ((notif.type === 'comment' || notif.type === 'reply') && notif.post_id) {
      navigate(`/post/${notif.post_id}`);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && nextCursor && !loadingMore) {
      setLoadingMore(true);
      fetchNotifications(nextCursor);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" data-testid="notifications-page">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2.5">
            <Bell size={24} className="text-primary" />
            <span>Activity &amp; Notifications</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Stay updated on new followers, discussions, replies, and incoming messages.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              isLoading={markingAll}
              leftIcon={<CheckCheck size={14} />}
            >
              Mark all as read
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchNotifications(null, true)}
            isLoading={loading}
            leftIcon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-black/[0.06] dark:bg-white/[0.08] text-text-primary'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-subtle'
            }`}
          >
            All Activity
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              filter === 'unread'
                ? 'bg-black/[0.06] dark:bg-white/[0.08] text-text-primary'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-subtle'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs text-text-muted font-mono hidden sm:block">
          {notifications.length} item{notifications.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-surface-card rounded-2xl border border-border overflow-hidden divide-y divide-border/40 shadow-xs">
        {loading && notifications.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-text-muted">
            <RefreshCw size={24} className="animate-spin text-primary" />
            <p className="text-xs sm:text-sm font-medium">Loading activity stream…</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500">
            <p className="text-sm font-medium">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNotifications(null, true)}
              className="mt-3"
            >
              Retry
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center text-text-muted flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-surface-subtle flex items-center justify-center text-text-muted">
              <Bell size={28} />
            </div>
            <h3 className="text-base font-semibold text-text-primary">No activity yet</h3>
            <p className="text-xs sm:text-sm text-text-muted max-w-sm">
              {filter === 'unread'
                ? 'You have caught up with all notifications.'
                : 'When someone follows you, comments on your posts, or messages you, notifications will show up here.'}
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const actorName = notif.actor?.display_name || 'Someone';
            const actorHandle = notif.actor ? `@${notif.actor.username}` : '';

            return (
              <div
                key={notif.id}
                onClick={() => handleItemClick(notif)}
                className={`p-4 sm:p-5 flex items-start gap-4 hover:bg-surface-subtle transition-all cursor-pointer group border-l-2 ${
                  !notif.read ? 'bg-black/[0.03] dark:bg-white/[0.04] border-primary' : 'border-transparent'
                }`}
              >
                {/* Actor Avatar with event indicator */}
                <div className="relative shrink-0">
                  <Avatar
                    src={notif.actor?.avatar_url || '/avatars/alex-dev.svg'}
                    alt={actorName}
                    size="lg"
                  />
                  <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-surface-card border border-border shadow-xs">
                    {notif.type === 'message' ? (
                      <MessageSquare size={13} className="text-blue-500" />
                    ) : notif.type === 'follow' ? (
                      <UserPlus size={13} className="text-emerald-500" />
                    ) : (
                      <MessageCircle size={13} className="text-amber-500" />
                    )}
                  </div>
                </div>

                {/* Message Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm text-text-primary">{actorName}</span>
                    <span className="text-xs text-text-muted">{actorHandle}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-text-secondary mt-0.5 leading-relaxed">
                    {notif.type === 'message' && 'Sent you a direct message.'}
                    {notif.type === 'follow' && 'Started following your activity.'}
                    {notif.type === 'comment' && 'Commented on your discussion post.'}
                    {notif.type === 'reply' && 'Replied to your comment.'}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-text-muted font-mono">
                    <span>{formatTimeAgo(notif.created_at)}</span>
                    <span>&bull;</span>
                    <span className="text-primary group-hover:underline flex items-center gap-1">
                      <span>View details</span>
                      <ArrowRight size={11} />
                    </span>
                  </div>
                </div>

                {/* Read indicator / Action */}
                <div className="shrink-0 flex items-center gap-2 self-center">
                  {!notif.read ? (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(e, notif)}
                      title="Mark as read"
                      className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-elevated transition-colors flex items-center gap-1 text-xs"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-primary block" />
                    </button>
                  ) : (
                    <span className="text-[11px] text-text-muted flex items-center gap-1 font-mono">
                      <Check size={13} className="text-text-muted" />
                      <span className="hidden sm:inline">Read</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Load More */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="md"
            onClick={handleLoadMore}
            isLoading={loadingMore}
          >
            Load Older Notifications
          </Button>
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
