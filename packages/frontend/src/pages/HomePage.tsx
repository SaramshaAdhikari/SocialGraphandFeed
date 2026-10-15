import { useState } from 'react';
import { useFeed } from '../hooks/useFeed';
import { FeedSortBar } from '../components/feed/FeedSortBar';
import { FeedList } from '../components/feed/FeedList';
import { AlertCircle, X } from 'lucide-react';

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
