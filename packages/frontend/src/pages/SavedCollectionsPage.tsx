import { useState } from 'react';
import { useSavedPosts } from '../hooks/useSavedPosts';
import { useAuth } from '../auth/AuthContext';
import { isMockMode } from '../api';
import { MasonryGrid, DiscoverySkeleton } from '../components/discovery/MasonryGrid';
import { DiscussionPostCard } from '../components/feed/DiscussionPostCard';
import { VisualPinCard } from '../components/feed/VisualPinCard';
import { Input, Button, Badge } from '../components/ui';
import { Link } from '../router/Router';
import {
  Bookmark,
  LayoutGrid,
  MessageSquare,
  Image as ImageIcon,
  Search,
  X,
  RotateCcw,
  AlertCircle,
  RefreshCw,
  Compass,
  Home,
  SlidersHorizontal,
} from 'lucide-react';
import type { SavedPostSort } from '../api/types';

export interface SavedCollectionsPageProps {
  savedPostsHook?: typeof useSavedPosts;
}

export function SavedCollectionsPage({ savedPostsHook = useSavedPosts }: SavedCollectionsPageProps = {}) {
  const { status } = useAuth();
  const isLive = !isMockMode();

  const {
    posts,
    discussions,
    visualPins,
    loading,
    error,
    typeFilter,
    setTypeFilter,
    communityFilter,
    setCommunityFilter,
    searchQuery,
    setSearchQuery,
    sort,
    setSort,
    totalCount,
    counts,
    availableCommunities,
    vote,
    toggleSave,
    undoLastUnsave,
    toastMessage,
    canUndo,
    dismissToast,
    refresh,
  } = savedPostsHook();

  const [undoLoading, setUndoLoading] = useState(false);

  const handleUndo = async () => {
    if (undoLoading) return;
    setUndoLoading(true);
    try {
      await undoLastUnsave();
    } finally {
      setUndoLoading(false);
    }
  };

  const handleClearFilters = () => {
    setTypeFilter('all');
    setCommunityFilter('all');
    setSearchQuery('');
    setSort('new');
  };

  const isFiltered = typeFilter !== 'all' || communityFilter !== 'all' || Boolean(searchQuery.trim());

  const isRoute404 = Boolean(
    error?.message?.includes('404') ||
    error?.message?.toLowerCase().includes('not found') ||
    (error as any)?.problem?.status === 404
  );

  return (
    <div
      role="region"
      aria-label="Saved Collections"
      data-testid="saved-collections-page"
      className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6"
    >
      {/* 1. Header & Library Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
            <Bookmark size={22} className="fill-primary/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
                Saved Collections
              </h1>
              <Badge variant="brand" size="sm" className="font-mono tabular-nums">
                {totalCount}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-text-muted mt-0.5">
              Personal curation library of bookmarked technical discussions and architectural visual pins.
            </p>
          </div>
        </div>

        {/* Counter Summary Badges & Quick Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-surface-subtle border border-border text-text-secondary flex items-center gap-1.5 font-medium">
            <MessageSquare size={13} className="text-primary" />
            <span>{counts.discussions} Discussions</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-surface-subtle border border-border text-text-secondary flex items-center gap-1.5 font-medium">
            <ImageIcon size={13} className="text-primary" />
            <span>{counts.visual} Visual Pins</span>
          </div>
          <button
            type="button"
            onClick={() => refresh()}
            disabled={loading}
            title="Refresh saved library"
            aria-label="Refresh saved library"
            className="p-2 rounded-xl bg-surface-subtle border border-border text-text-muted hover:text-text-primary hover:border-border transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-primary' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Unified Controls Toolbar: Format Tabs, Search, Sort & Community Filters */}
      <div className="bg-surface-card border border-border rounded-2xl p-2.5 sm:p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Format Tabs (All / Discussions / Visual Pins) */}
          <div
            role="tablist"
            aria-label="Saved content format filters"
            className="inline-flex items-center p-1 bg-surface-subtle rounded-xl border border-border/60 shrink-0"
          >
            <button
              type="button"
              role="tab"
              aria-selected={typeFilter === 'all'}
              onClick={() => setTypeFilter('all')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-surface-card text-text-primary shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <LayoutGrid size={15} />
              <span>All</span>
              <span className="text-[11px] opacity-75 tabular-nums font-mono">({counts.all})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={typeFilter === 'discussions'}
              onClick={() => setTypeFilter('discussions')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                typeFilter === 'discussions'
                  ? 'bg-surface-card text-text-primary shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <MessageSquare size={15} />
              <span>Discussions</span>
              <span className="text-[11px] opacity-75 tabular-nums font-mono">({counts.discussions})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={typeFilter === 'visual'}
              onClick={() => setTypeFilter('visual')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                typeFilter === 'visual'
                  ? 'bg-surface-card text-text-primary shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <ImageIcon size={15} />
              <span>Visual Pins</span>
              <span className="text-[11px] opacity-75 tabular-nums font-mono">({counts.visual})</span>
            </button>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search saved posts, authors, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={15} />}
                rightIcon={
                  searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search query"
                      className="text-text-muted hover:text-text-primary"
                    >
                      <X size={14} />
                    </button>
                  ) : undefined
                }
              />
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 shrink-0">
              <label htmlFor="saved-sort" className="text-xs text-text-secondary font-medium hidden sm:inline">
                Sort:
              </label>
              <select
                id="saved-sort"
                aria-label="Sort saved items"
                value={sort}
                onChange={(e) => setSort(e.target.value as SavedPostSort)}
                className="h-10 px-3 py-1.5 text-xs font-semibold bg-surface-card border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-xs"
              >
                <option value="new">Newest Saved</option>
                <option value="top">Top Score</option>
                <option value="comments">Most Commented</option>
              </select>
            </div>
          </div>
        </div>

        {/* Community Topic Filter Pills (Grounded in real post metadata) */}
        {availableCommunities.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-border/40 text-xs touch-pan-x scroll-smooth pr-4">
            <span className="text-text-muted font-semibold flex items-center gap-1 shrink-0 mr-1">
              <SlidersHorizontal size={13} />
              <span>Topic:</span>
            </span>
            {availableCommunities.map((comm) => {
              const isActive = communityFilter.toLowerCase() === comm.slug.toLowerCase();
              return (
                <button
                  key={comm.slug}
                  type="button"
                  onClick={() => setCommunityFilter(comm.slug)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white font-semibold shadow-xs'
                      : 'bg-surface-subtle border border-border text-text-secondary hover:border-primary/50'
                  }`}
                >
                  <span>{comm.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-surface-card text-text-muted'
                    }`}
                  >
                    {comm.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Main Content Stream / States */}
      {/* Loading Skeleton */}
      {loading && (
        <div data-testid="saved-loading-skeleton" className="space-y-4">
          {typeFilter === 'visual' ? (
            <DiscoverySkeleton />
          ) : (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-surface-card rounded-2xl border border-border p-5 space-y-3 animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-subtle" />
                    <div className="h-4 bg-surface-subtle rounded w-1/4" />
                  </div>
                  <div className="h-5 bg-surface-subtle rounded w-3/4" />
                  <div className="h-16 bg-surface-subtle rounded-xl" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Unauthenticated Prompt (Live Mode) */}
      {!loading && isLive && status === 'unauthenticated' && (
        <div
          role="status"
          data-testid="saved-unauthenticated-banner"
          className="bg-surface-card rounded-3xl border border-border p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto shadow-xs transition-colors"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Bookmark size={24} />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-bold text-text-primary">
              Sign in to view saved collections
            </h2>
            <p className="text-xs sm:text-sm text-text-muted max-w-sm mx-auto leading-relaxed">
              Saved discussions and visual pins are associated with your account session. Sign in to access your personal curation library.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-primary text-white hover:bg-primary-hover transition-colors shadow-xs"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-surface-subtle text-text-secondary hover:bg-surface-card hover:border-border border border-transparent transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      )}

      {/* Compact Secondary Error Banner */}
      {!loading && (!isLive || status !== 'unauthenticated') && error && (
        <div
          role="alert"
          data-testid="saved-error-banner"
          className="bg-amber-500/10 dark:bg-amber-950/25 border border-amber-500/25 rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs transition-colors"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <AlertCircle size={16} />
            </div>
            <div className="space-y-0.5">
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                {isRoute404
                  ? 'Backend route synchronization pending (HTTP 404)'
                  : 'Unable to synchronize saved collections'}
              </p>
              <p className="text-amber-800/80 dark:text-amber-300/80 leading-normal">
                {isRoute404
                  ? 'The saved posts endpoint is awaiting route order synchronization on the backend. Your bookmarks remain safely recorded in MongoDB.'
                  : (error.message || 'The saved posts service encountered an unexpected error.')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              leftIcon={<RefreshCw size={13} />}
              className="h-8 px-3 font-semibold border-amber-500/30 text-amber-900 dark:text-amber-200 hover:bg-amber-500/10"
            >
              Try Again
            </Button>
            <Link
              to="/explore"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary-hover transition-colors"
            >
              <Compass size={13} />
              <span>Explore Discover</span>
            </Link>
          </div>
        </div>
      )}

      {/* Error State Content Area (Informative Curation Architecture & Integration Card) */}
      {!loading && (!isLive || status !== 'unauthenticated') && error && (
        <div className="bg-surface-card border border-border rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs space-y-8">
          <div className="max-w-xl mx-auto text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-subtle border border-border text-text-muted text-xs font-medium">
              <Bookmark size={13} className="text-primary" />
              <span>Personal Library Offline State</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-text-primary">
              Saved content will appear here once connected
            </h2>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Your bookmarks across feeds and discussions are preserved in your account session. When the service completes route synchronization, bookmarked items will populate this view automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 sm:p-5 rounded-2xl bg-surface-subtle border border-border/60 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <MessageSquare size={16} />
              </div>
              <h3 className="text-sm font-bold text-text-primary">Technical Discussions</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Bookmark deep-dive RFCs, system architecture discussions, and community commentary for reference.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-surface-subtle border border-border/60 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <ImageIcon size={16} />
              </div>
              <h3 className="text-sm font-bold text-text-primary">Architectural Visual Pins</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Save system topology diagrams, infrastructure blueprints, and hardware photography in responsive masonry.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-surface-subtle border border-border/60 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Bookmark size={16} />
              </div>
              <h3 className="text-sm font-bold text-text-primary">Safe Database Storage</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Bookmark actions persist safely to MongoDB without data loss during backend route maintenance.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-border/60">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              leftIcon={<RefreshCw size={14} />}
              className="font-semibold"
            >
              Retry Connection
            </Button>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary-hover transition-colors shadow-xs"
            >
              <Compass size={14} />
              <span>Explore Discover</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-surface-subtle text-text-secondary hover:bg-surface-card hover:border-border border border-transparent transition-colors"
            >
              <Home size={14} />
              <span>Browse Home Feed</span>
            </Link>
          </div>
        </div>
      )}

      {/* Empty State (Shown ONLY when successfully loaded with 0 items) */}
      {!loading && (!isLive || status !== 'unauthenticated') && !error && posts.length === 0 && (
        <div
          data-testid="saved-empty-state"
          className="bg-surface-card rounded-3xl border border-border p-10 sm:p-14 text-center space-y-4 max-w-xl mx-auto shadow-xs transition-colors"
        >
          <div className="w-14 h-14 rounded-2xl bg-surface-subtle text-text-muted flex items-center justify-center mx-auto">
            <Bookmark size={28} />
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-text-primary">
              {searchQuery.trim()
                ? `No saved posts match "${searchQuery.trim()}"`
                : isFiltered
                ? 'No items match your active filter'
                : 'Your saved collection is empty'}
            </h2>
            <p className="text-xs sm:text-sm text-text-muted mt-1.5 max-w-md mx-auto leading-relaxed">
              {searchQuery.trim()
                ? 'Try checking for typos, searching for tags, or resetting your search keywords.'
                : isFiltered
                ? 'Try adjusting your type or topic filter to view other bookmarked items in your library.'
                : 'Bookmark interesting technical RFCs and architectural photography across the platform to build your personal library.'}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {isFiltered ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                leftIcon={<RotateCcw size={14} />}
                className="font-semibold"
              >
                Clear All Filters
              </Button>
            ) : (
              <>
                <Link
                  to="/explore"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary-hover transition-colors shadow-xs"
                >
                  <Compass size={14} />
                  <span>Explore Discover</span>
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-surface-subtle text-text-secondary hover:bg-surface-card hover:border-border border border-transparent transition-colors"
                >
                  <Home size={14} />
                  <span>Browse Home Feed</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Populated Content Stream */}
      {!loading && !error && posts.length > 0 && (
        <section aria-label="Saved Items Stream" className="space-y-6">
          {typeFilter === 'visual' ? (
            /* Pinterest-Style Masonry Grid for Visual Pins */
            <MasonryGrid
              pins={visualPins}
              onVote={vote}
              onToggleSave={toggleSave}
            />
          ) : typeFilter === 'discussions' ? (
            /* Reddit-Style Stream for Discussions */
            <div className="space-y-4">
              {discussions.map((disc) => (
                <DiscussionPostCard
                  key={disc.id}
                  post={disc}
                  onVote={vote}
                  onToggleSave={toggleSave}
                />
              ))}
            </div>
          ) : (
            /* Unified Mixed View (Harmonious Pinterest / Reddit Blend) */
            <div className="space-y-6">
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="transition-opacity duration-200">
                    {post.post_type === 'discussion' ? (
                      <DiscussionPostCard
                        post={post}
                        onVote={vote}
                        onToggleSave={toggleSave}
                      />
                    ) : (
                      <VisualPinCard
                        post={post}
                        onVote={vote}
                        onToggleSave={toggleSave}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 4. Undo Toast Notification Banner */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          data-testid="saved-undo-toast"
          className="fixed bottom-18 sm:bottom-8 right-4 sm:right-8 z-50 flex items-center gap-3 bg-ink-button text-white px-4 py-3 rounded-2xl shadow-xl border border-border/40 text-xs animate-slide-up"
        >
          <Bookmark size={16} className="text-primary shrink-0" />
          <span className="max-w-[280px] sm:max-w-md truncate">{toastMessage}</span>

          {canUndo && (
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoLoading}
              className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors cursor-pointer shrink-0 ml-1"
            >
              {undoLoading ? 'Restoring...' : 'Undo'}
            </button>
          )}

          <button
            type="button"
            onClick={dismissToast}
            aria-label="Dismiss notification"
            className="text-text-muted hover:text-white transition-colors p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
export default SavedCollectionsPage;