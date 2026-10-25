import { useCallback, useState } from 'react';
import { useFeed } from '../hooks/useFeed';
import { FeedSortBar } from '../components/feed/FeedSortBar';
import { FeedList } from '../components/feed/FeedList';
import { AlertCircle, X } from 'lucide-react';
import { useRealtimeEvents } from '../hooks/useRealtimeEvents';

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
  const { connected } = useRealtimeEvents(handleRealtimeEvent);

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
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-slate-700 dark:bg-[#181B22]">
        <span className="text-slate-600 dark:text-slate-300">
          <span className={`mr-2 inline-block h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {connected ? 'Live social graph connected' : 'Live updates reconnecting; feed remains available'}
        </span>
        {newPosts > 0 && (
          <button
            type="button"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white hover:bg-indigo-700"
            onClick={() => { setNewPosts(0); void refresh(); }}
          >
            {newPosts} new {newPosts === 1 ? 'post' : 'posts'} available
          </button>
        )}
      </div>
      {/* Interactive Toast Notification for Mutation Failures */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-16 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 bg-[#0F172A] text-white px-4 py-2.5 rounded-lg shadow-lg text-xs animate-slide-up"
        >
          <AlertCircle size={16} className="text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
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
