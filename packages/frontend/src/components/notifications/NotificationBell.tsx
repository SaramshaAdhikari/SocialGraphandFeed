import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCheck, MessageSquare, UserPlus, MessageCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../../api';
import type { NotificationItem } from '@socialgraph/shared';
import { useRouter } from '../../router/Router';
import { useAuth } from '../../auth/AuthContext';
import { Avatar } from '../ui';

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

export function NotificationBell() {
  const { user, status } = useAuth();
  const { navigate } = useRouter();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [markingAll, setMarkingAll] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user || status !== 'authenticated') return;
    try {
      const count = await api.getUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      // Ignore count fetch errors silently
    }
  }, [user, status]);

  const fetchNotifications = useCallback(async () => {
    if (!user || status !== 'authenticated') return;
    setLoading(true);
    try {
      const res = await api.getNotifications({ limit: 20 });
      setNotifications(res.data);
    } catch {
      // Handle error gracefully
    } finally {
      setLoading(false);
    }
  }, [user, status]);

  // Initial fetch and window real-time listener
  useEffect(() => {
    fetchUnreadCount();

    const handleRealtime = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (!detail) return;

      if (detail.type === 'notification.created') {
        setUnreadCount((prev) => prev + 1);
        if (detail.notification) {
          setNotifications((prev) => [detail.notification, ...prev]);
        }
      } else if (detail.type === 'message.created') {
        fetchUnreadCount();
      }
    };

    window.addEventListener('socialgraph:realtime', handleRealtime);
    return () => {
      window.removeEventListener('socialgraph:realtime', handleRealtime);
    };
  }, [fetchUnreadCount]);

  // When opening dropdown, load latest notifications
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Outside click & Escape to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

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
    setIsOpen(false);
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

  if (!user || status !== 'authenticated') {
    return null;
  }

  const displayedNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        data-testid="notification-bell-button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="relative p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-w-[38px] min-h-[38px] flex items-center justify-center"
      >
        <Bell size={19} className="transition-transform group-hover:scale-105" />
        {unreadCount > 0 && (
          <span
            data-testid="notification-unread-badge"
            className="absolute top-1.5 right-1.5 min-w-[17px] h-[17px] px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none shadow-xs border-2 border-canvas animate-in zoom-in-50 duration-200"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Popover */}
      {isOpen && (
        <div
          data-testid="notification-dropdown-menu"
          className="absolute right-0 sm:right-0 mt-2 w-[calc(100vw-32px)] sm:w-96 max-w-sm rounded-2xl bg-surface-card border border-border shadow-xl backdrop-blur-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-border flex items-center justify-between bg-surface-subtle/50">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-text-primary">Notifications</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                data-testid="mark-all-notifications-read-btn"
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="px-3 py-1.5 border-b border-border/50 flex items-center gap-2 bg-canvas/30 text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-black/[0.06] dark:bg-white/[0.08] text-text-primary'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                filter === 'unread'
                  ? 'bg-black/[0.06] dark:bg-white/[0.08] text-text-primary'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
            {loading && notifications.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center gap-2 text-text-muted">
                <RefreshCw size={20} className="animate-spin text-primary" />
                <span className="text-xs">Loading notifications…</span>
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="p-8 text-center text-text-muted flex flex-col items-center justify-center gap-2">
                <Bell size={28} className="opacity-30" />
                <p className="text-xs font-medium">
                  {filter === 'unread'
                    ? 'No unread notifications'
                    : 'No notifications yet'}
                </p>
                <p className="text-[11px] text-text-muted/70 max-w-[220px]">
                  When someone follows you, comments, or sends a direct message, it will show up here.
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => {
                const actorName = notif.actor?.display_name || 'Someone';
                const actorHandle = notif.actor ? `@${notif.actor.username}` : '';

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`p-3 flex items-start gap-3 hover:bg-surface-subtle transition-all cursor-pointer group border-l-2 ${
                      !notif.read ? 'bg-black/[0.03] dark:bg-white/[0.04] border-primary' : 'border-transparent'
                    }`}
                  >
                    {/* Actor Avatar */}
                    <div className="relative shrink-0">
                      <Avatar
                        src={notif.actor?.avatar_url || '/avatars/alex-dev.svg'}
                        alt={actorName}
                        size="md"
                      />
                      <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-surface-card border border-border">
                        {notif.type === 'message' ? (
                          <MessageSquare size={11} className="text-blue-500" />
                        ) : notif.type === 'follow' ? (
                          <UserPlus size={11} className="text-emerald-500" />
                        ) : (
                          <MessageCircle size={11} className="text-amber-500" />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-primary leading-snug">
                        <span className="font-semibold">{actorName}</span>{' '}
                        <span className="text-text-muted font-normal">{actorHandle}</span>{' '}
                        {notif.type === 'message' && 'sent you a direct message.'}
                        {notif.type === 'follow' && 'started following you.'}
                        {notif.type === 'comment' && 'commented on your post.'}
                        {notif.type === 'reply' && 'replied to your comment.'}
                      </p>
                      <span className="text-[10px] text-text-muted mt-1 block font-mono">
                        {formatTimeAgo(notif.created_at)}
                      </span>
                    </div>

                    {/* Actions: unread dot / mark read button */}
                    <div className="shrink-0 flex items-center gap-1.5 self-center">
                      {!notif.read && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(e, notif)}
                          title="Mark as read"
                          className="p-1 rounded-md text-text-muted hover:text-primary hover:bg-surface-elevated transition-colors"
                        >
                          <span className="w-2 h-2 rounded-full bg-primary block" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Link to Dedicated Page */}
          <div className="p-2.5 border-t border-border bg-surface-subtle/50 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="text-xs font-semibold text-text-muted hover:text-primary transition-colors flex items-center justify-center gap-1.5 w-full cursor-pointer py-1"
            >
              <span>View full notification center</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
