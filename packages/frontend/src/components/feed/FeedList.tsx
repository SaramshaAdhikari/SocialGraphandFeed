import { useEffect, useRef } from 'react';
import type { PostCard } from '@socialgraph/shared';
import { AlertCircle, RefreshCw, CheckCircle2, Compass, Users } from 'lucide-react';
import type { FeedScope } from '../../hooks/useFeed';
import { DiscussionPostCard } from './DiscussionPostCard';
import { VisualPinCard } from './VisualPinCard';
import { PostCardSkeleton } from '../ui/Skeleton';
import { Button } from '../ui/Button';
import { Link } from '../../router/Router';

export interface FeedListProps {
  posts: PostCard[];
  scope: FeedScope;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  onLoadMore: () => void;
  onRetry: () => void;
  onVote: (postId: string, direction: 1 | -1 | 0) => void;
  onToggleSave: (postId: string) => void;
  className?: string;
}

export function FeedList({
  posts,
  scope,
  loading,
  loadingMore,
  hasMore,
  error,
  onLoadMore,
  onRetry,
  onVote,
  onToggleSave,
  className = '',
}: FeedListProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Setup IntersectionObserver for infinite scroll sentinel
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading || loadingMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [first] = entries;
        if (first.isIntersecting && hasMore && !loading && !loadingMore) {
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0.1,
      }
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loading, loadingMore, onLoadMore]);

  // Initial Loading State: Skeletons
  if (loading && posts.length === 0) {
    return (
      <div className={`space-y-4 ${className}`} aria-busy="true" aria-label="Loading feed posts">
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    );
  }

  // Initial Error State
  if (error && posts.length === 0) {
    return (
      <div
        role="alert"
        className={`bg-surface-card rounded-2xl border border-rose-500/25 p-6 sm:p-8 text-center shadow-xs space-y-4 transition-colors ${className}`}
      >
        <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <AlertCircle size={24} />
        </div>
        <div>
          <h2 className="text-base font-bold text-text-primary mb-1">Failed to load feed</h2>
          <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
            {error.message || 'An unexpected error occurred while communicating with the feed service.'}
          </p>
        </div>
        <Button
          onClick={onRetry}
          variant="primary"
          size="sm"
          leftIcon={<RefreshCw size={14} />}
          className="font-semibold"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Empty State (Contextual to Scope)
  if (!loading && posts.length === 0) {
    return (
      <div
        className={`bg-surface-card rounded-3xl border border-border p-8 sm:p-12 text-center shadow-xs space-y-4 transition-colors ${className}`}
      >
        <div className="w-14 h-14 mx-auto rounded-2xl bg-surface-subtle flex items-center justify-center text-text-muted">
          {scope === 'following' ? (
            <Users size={28} />
          ) : (
            <Compass size={28} />
          )}
        </div>

        <div className="max-w-md mx-auto">
          <h2 className="text-base sm:text-lg font-bold text-text-primary mb-1">
            {scope === 'following'
              ? 'No posts from creators you follow'
              : scope === 'communities'
              ? 'No community posts in this feed'
              : 'No posts in this feed yet'}
          </h2>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            {scope === 'following'
              ? 'Follow creators and engineers in the Discover feed to see their latest work here.'
              : scope === 'communities'
              ? 'Join topical communities to see focused architectural and systems discussions.'
              : 'Check back soon or switch sorting modes to see trending posts.'}
          </p>
        </div>

        <div className="pt-2">
          {scope === 'following' ? (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/explore">
                <Button variant="primary" size="sm" leftIcon={<Compass size={15} />} className="font-semibold">
                  Explore Creators
                </Button>
              </Link>
              <Link to="/communities">
                <Button variant="outline" size="sm" leftIcon={<Users size={15} />} className="font-semibold">
                  Browse Communities
                </Button>
              </Link>
            </div>
          ) : scope === 'communities' ? (
            <Link to="/communities">
              <Button variant="primary" size="sm" leftIcon={<Users size={15} />} className="font-semibold">
                Browse Communities
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" onClick={onRetry} leftIcon={<RefreshCw size={14} />} className="font-semibold">
              Refresh Feed
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 sm:space-y-5 ${className}`} id="feed-content">
      {/* Stream of Mixed Posts */}
      {posts.map((post) => {
        if (post.post_type === 'discussion') {
          return (
            <DiscussionPostCard
              key={post.id}
              post={post}
              onVote={onVote}
              onToggleSave={onToggleSave}
            />
          );
        }

        if (post.post_type === 'visual') {
          return (
            <VisualPinCard
              key={post.id}
              post={post}
              onVote={onVote}
              onToggleSave={onToggleSave}
            />
          );
        }

        return null;
      })}

      {/* Pagination Sentinel & Loading More Indicator */}
      <div ref={sentinelRef} className="py-2">
        {loadingMore && (
          <div className="space-y-3 pt-2" aria-live="polite" aria-label="Loading more posts">
            <PostCardSkeleton />
          </div>
        )}
      </div>

      {/* Accessible Manual "Load More" Fallback Button */}
      {hasMore && !loadingMore && (
        <div className="flex justify-center pt-2 pb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            className="w-full sm:w-auto min-w-[200px] font-semibold"
          >
            Load More Posts
          </Button>
        </div>
      )}

      {/* End of Feed Indicator */}
      {!hasMore && posts.length > 0 && (
        <div
          role="status"
          className="py-8 px-4 text-center border-t border-border text-text-muted space-y-1 transition-colors"
        >
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 mb-1">
            <CheckCircle2 size={18} />
          </div>
          <p className="text-sm font-bold text-text-primary">You're all caught up!</p>
          <p className="text-xs text-text-muted">
            You've viewed all posts currently available in this feed.
          </p>
        </div>
      )}
    </div>
  );
}
export default FeedList;
