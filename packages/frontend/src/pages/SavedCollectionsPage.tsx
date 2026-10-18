import { useState } from 'react';
import { useSavedPosts } from '../hooks/useSavedPosts';
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

export function SavedCollectionsPage() {
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
  } = useSavedPosts();

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

  return (
    <div
      role="region"
      aria-label="Saved Collections"
      data-testid="saved-collections-page"
      className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6"
    >
      {/* 1. Header & Library Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-[#2E3544]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
            <Bookmark size={22} className="fill-primary/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                Saved Collections
              </h1>
              <Badge variant="brand" size="sm" className="font-mono tabular-nums">
                {totalCount}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              Personal curation library of bookmarked technical discussions and architectural visual pins.
            </p>
          </div>
        </div>

        {/* Counter Badges */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1E232E] border border-slate-200/80 dark:border-slate-800 text-[#475569] dark:text-[#94A3B8] flex items-center gap-1.5 font-medium">
            <MessageSquare size={13} className="text-primary" />
            <span>{counts.discussions} Discussions</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1E232E] border border-slate-200/80 dark:border-slate-800 text-[#475569] dark:text-[#94A3B8] flex items-center gap-1.5 font-medium">
            <ImageIcon size={13} className="text-primary" />
            <span>{counts.visual} Visual Pins</span>
          </div>
        </div>
      </div>

      {/* 2. Controls Bar: Format Tabs, Search, Sort & Community Filters */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Format Tabs (All / Discussions / Visual Pins) */}
          <div
            role="tablist"
            aria-label="Saved content format filters"
            className="flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-[#181B22] rounded-2xl border border-[#E2E8F0] dark:border-[#2E3544] shrink-0"
          >
            <button
              type="button"
              role="tab"
              aria-selected={typeFilter === 'all'}
              onClick={() => setTypeFilter('all')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-[#262B36] text-primary dark:text-white shadow-xs'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                typeFilter === 'discussions'
                  ? 'bg-white dark:bg-[#262B36] text-primary dark:text-white shadow-xs'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                typeFilter === 'visual'
                  ? 'bg-white dark:bg-[#262B36] text-primary dark:text-white shadow-xs'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
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
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  ) : undefined
                }
              />
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 shrink-0">
              <label htmlFor="saved-sort" className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium hidden sm:inline">
                Sort:
              </label>
              <select
                id="saved-sort"
                aria-label="Sort saved items"
                value={sort}
                onChange={(e) => setSort(e.target.value as SavedPostSort)}
                className="h-10 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-[#181B22] border border-[#E2E8F0] dark:border-[#2E3544] rounded-xl text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-xs"
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
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            <span className="text-[#64748B] dark:text-[#94A3B8] font-semibold flex items-center gap-1 shrink-0 mr-1">
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
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white font-semibold shadow-xs'
                      : 'bg-white dark:bg-[#181B22] border border-[#E2E8F0] dark:border-[#2E3544] text-[#475569] dark:text-[#94A3B8] hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                >
                  <span>{comm.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
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
                  className="bg-white dark:bg-[#181B22] rounded-2xl border border-[#E2E8F0] dark:border-[#2E3544] p-5 space-y-3 animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#262B36]" />
                    <div className="h-4 bg-slate-200 dark:bg-[#262B36] rounded w-1/4" />
                  </div>
                  <div className="h-5 bg-slate-200 dark:bg-[#262B36] rounded w-3/4" />
                  <div className="h-16 bg-slate-100 dark:bg-[#1F2430] rounded-xl" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div
          role="alert"
          data-testid="saved-error-banner"
          className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-2xl p-6 text-center space-y-3 max-w-lg mx-auto"
        >
          <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-red-700 dark:text-red-300">
              Unable to load saved collections
            </h3>
            <p className="text-xs text-red-600/90 dark:text-red-400/90 mt-1 leading-relaxed">
              {error.message || 'The saved posts service encountered an unexpected error.'}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={refresh}
            leftIcon={<RefreshCw size={14} />}
            className="font-semibold"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && posts.length === 0 && (
        <div
          data-testid="saved-empty-state"
          className="bg-white dark:bg-[#181B22] rounded-3xl border border-[#E2E8F0] dark:border-[#2E3544] p-10 sm:p-14 text-center space-y-4 max-w-xl mx-auto shadow-xs transition-colors"
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#262B36] text-[#64748B] dark:text-[#94A3B8] flex items-center justify-center mx-auto">
            <Bookmark size={28} />
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              {searchQuery.trim()
                ? `No saved posts match "${searchQuery.trim()}"`
                : isFiltered
                ? 'No items match your active filter'
                : 'Your saved collection is empty'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-1.5 max-w-md mx-auto leading-relaxed">
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
              {/* If we have visual pins in all view, provide masonry or cards */}
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
          className="fixed bottom-18 sm:bottom-8 right-4 sm:right-8 z-50 flex items-center gap-3 bg-[#0F172A] dark:bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700/50 text-xs animate-slide-up"
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
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
export default SavedCollectionsPage;
