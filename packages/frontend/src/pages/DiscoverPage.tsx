import { useState, useEffect, useRef } from 'react';
import { useDiscovery } from '../hooks/useDiscovery';
import { DiscoveryCategoryBar, MasonryGrid, DiscoverySkeleton } from '../components/discovery';
import { Button } from '../components/ui/Button';
import { AlertCircle, RefreshCw, Compass, CheckCircle2, X } from 'lucide-react';

export function DiscoverPage() {
  const {
    pins,
    category,
    loading,
    loadingMore,
    error,
    hasMore,
    setCategory,
    refresh,
    loadMore,
    vote,
    toggleSave,
  } = useDiscovery({
    initialCategory: 'all',
    pageSize: 12,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // IntersectionObserver for infinite scroll sentinel
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading || loadingMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [first] = entries;
        if (first.isIntersecting && hasMore && !loading && !loadingMore) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: '250px',
        threshold: 0.1,
      }
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loading, loadingMore, loadMore]);

  const handleVote = async (pinId: string, direction: 1 | -1 | 0) => {
    try {
      await vote(pinId, direction);
    } catch {
      setToastMessage('Failed to update reaction. Action rolled back.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleToggleSave = async (pinId: string) => {
    try {
      await toggleSave(pinId);
    } catch {
      setToastMessage('Failed to update bookmark. Action rolled back.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Toast Alert */}
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
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Screen 2 Header & Category Navigation */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              Visual Discovery
            </h1>
            <p className="text-xs sm:text-sm text-text-muted">
              High-density architectural masonry gallery preserving natural media aspect ratios.
            </p>
          </div>
        </div>

        <DiscoveryCategoryBar
          category={category}
          onCategoryChange={setCategory}
          disabled={loading && pins.length === 0}
        />
      </div>

      {/* Initial Loading Skeleton */}
      {loading && pins.length === 0 && <DiscoverySkeleton />}

      {/* Error State */}
      {error && pins.length === 0 && (
        <div
          role="alert"
          className="bg-surface-card rounded-2xl border border-red-200 dark:border-red-900/40 p-8 sm:p-12 text-center shadow-sm space-y-4"
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertCircle size={24} />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary mb-1">
              Failed to load discovery pins
            </h2>
            <p className="text-sm text-text-muted max-w-md mx-auto">
              {error.message || 'An error occurred while fetching visual inspiration.'}
            </p>
          </div>
          <Button
            onClick={refresh}
            variant="primary"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && pins.length === 0 && !error && (
        <div className="bg-surface-card rounded-2xl border border-border p-10 sm:p-16 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-surface-subtle flex items-center justify-center text-text-muted">
            <Compass size={28} />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-base sm:text-lg font-bold text-text-primary mb-1">
              No pins found in this category
            </h2>
            <p className="text-sm text-text-muted">
              There are no visual pins matching "{category}". Explore all inspirations or choose a different category.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCategory('all')}
              leftIcon={<Compass size={14} />}
            >
              Show All Inspirations
            </Button>
          </div>
        </div>
      )}

      {/* Populated Masonry Stream */}
      {pins.length > 0 && (
        <>
          <MasonryGrid
            pins={pins}
            onVote={handleVote}
            onToggleSave={handleToggleSave}
          />

          {/* Sentinel & Loading More Skeletons */}
          <div ref={sentinelRef} className="py-2">
            {loadingMore && (
              <div className="pt-4" aria-live="polite">
                <DiscoverySkeleton />
              </div>
            )}
          </div>

          {/* Accessible Manual "Load More" Fallback Button */}
          {hasMore && !loadingMore && (
            <div className="flex justify-center pt-2 pb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMore}
                className="w-full sm:w-auto min-w-[220px]"
              >
                Load More Inspirations
              </Button>
            </div>
          )}

          {/* End of Discover Stream Indicator */}
          {!hasMore && (
            <div
              role="status"
              className="py-10 px-4 text-center border-t border-border text-text-muted space-y-1 transition-colors"
            >
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mb-1">
                <CheckCircle2 size={18} />
              </div>
              <p className="text-sm font-semibold text-text-primary">
                You've reached the end of the gallery
              </p>
              <p className="text-xs text-text-muted">
                Check back soon or explore other topical categories.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DiscoverPage;
