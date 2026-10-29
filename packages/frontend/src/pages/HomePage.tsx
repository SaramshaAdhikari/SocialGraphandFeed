import { useCallback, useState } from 'react';
import { useFeed } from '../hooks/useFeed';
import { FeedSortBar } from '../components/feed/FeedSortBar';
import { FeedList } from '../components/feed/FeedList';
import { AlertCircle, X } from 'lucide-react';
import { useRealtimeEvents } from '../hooks/useRealtimeEvents';
import { useAuth } from '../auth/AuthContext';

export function HomePage() {
  const {
    posts,
    scope,
    sort,
    loading,
    loadingMore,
    hasMore,
    error,
    setScope,
    setSort,
    refresh,
    loadMore,
    vote,
    toggleSave,
  } = useFeed({
    initialScope: 'all',
    initialSort: 'hot',
    pageSize: 8,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [newPosts, setNewPosts] = useState(0);
  const handleRealtimeEvent = useCallback((event: { type: string }) => {
    if (event.type === 'post.created') setNewPosts((count) => count + 1);
  }, []);
  const { status } = useAuth();
  const { connected } = useRealtimeEvents(handleRealtimeEvent, { enabled: status === 'authenticated' });

  const handleVote = async (postId: string, direction: 1 | -1 | 0) => {
    try {
      await vote(postId, direction);
    } catch {
      setToastMessage('Failed to record your vote. Action rolled back.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleToggleSave = async (postId: string) => {
    try {
      await toggleSave(postId);
    } catch {
      setToastMessage('Failed to update bookmark. Action rolled back.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between px-1 py-1 text-xs text-text-muted">
        <span className="text-text-secondary">
          <span className={`mr-2 inline-block h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {connected ? 'Live social graph connected' : status === 'authenticated' ? 'Live updates reconnecting; feed remains available' : 'Live updates active for authenticated members'}
        </span>
        {newPosts > 0 && (
          <button type="button" className="rounded-full bg-text-primary text-canvas px-3 py-1 font-semibold text-xs shadow-xs hover:opacity-90 transition-opacity cursor-pointer" onClick={() => { setNewPosts(0); void refresh(); }}>
            {newPosts} new {newPosts === 1 ? 'post' : 'posts'} available
          </button>
        )}
      </div>
      {/* Interactive Toast Notification for Mutation Failures */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-16 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 bg-surface-card text-text-primary border border-border px-4 py-2.5 rounded-lg shadow-lg text-xs animate-slide-up"
        >
          <AlertCircle size={16} className="text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Screen 1: Feed Scope and Sort Controls */}
      <FeedSortBar
        scope={scope}
        sort={sort}
        onScopeChange={setScope}
        onSortChange={setSort}
        disabled={loading && posts.length === 0}
      />

      {/* Feed Stream */}
      <FeedList
        posts={posts}
        scope={scope}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        error={error}
        onLoadMore={loadMore}
        onRetry={refresh}
        onVote={handleVote}
        onToggleSave={handleToggleSave}
      />
    </div>
  );
}

export default HomePage;
