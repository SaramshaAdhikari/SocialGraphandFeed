import { useState, useMemo } from 'react';
import type { Community } from '@socialgraph/shared';
import {
  Users,
  Search,
  Check,
  Plus,
  SlidersHorizontal,
  X,
  AlertCircle,
  RefreshCw,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { useCommunities } from '../hooks/useCommunities';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Link } from '../router/Router';

export function CommunitiesPage() {
  const {
    communities,
    loading,
    error,
    refresh,
    toggleMembership,
  } = useCommunities();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'joined'>('all');
  const [sort, setSort] = useState<'members' | 'name' | 'newest'>('members');
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleToggleMembership = async (community: Community) => {
    setPendingSlug(community.slug);
    try {
      await toggleMembership(community);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : 'Membership update failed.');
    } finally {
      setPendingSlug(null);
    }
  };

  const filteredCommunities = useMemo(() => {
    let result = [...communities];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }

    // Membership tab filter
    if (filter === 'joined') {
      result = result.filter((c) => c.is_member);
    }

    // Sort order
    result.sort((a, b) => {
      if (sort === 'members') return b.members_count - a.members_count;
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'newest') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });

    return result;
  }, [communities, searchQuery, filter, sort]);

  const joinedCount = useMemo(
    () => communities.filter((c) => c.is_member).length,
    [communities]
  );
  const totalCount = communities.length;

  return (
    <div
      role="region"
      aria-label="Community Directory"
      data-testid="communities-directory-page"
      className="w-full space-y-6 pb-12"
    >
      {/* Toast Alert for mutation rollback */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-16 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 bg-surface-card text-text-primary border border-border px-4 py-2.5 rounded-xl shadow-lg text-xs animate-slide-up"
        >
          <AlertCircle size={16} className="text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-text-muted hover:text-text-primary cursor-pointer"
            aria-label="Dismiss message"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
            <Users size={22} className="text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
                Community Directory
              </h1>
              <Badge variant="brand" size="sm" className="font-mono tabular-nums">
                {totalCount}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-text-muted mt-0.5">
              Discover and join focused hubs for distributed systems, architecture, design, and creative media.
            </p>
          </div>
        </div>

        {/* Membership Summary Stats */}
        <div className="flex items-center gap-2 self-start md:self-auto text-xs font-medium text-text-muted">
          <span className="px-3 py-1 rounded-full bg-surface-subtle border border-border">
            Joined: <strong className="text-text-primary">{joinedCount}</strong>
          </span>
          <span className="px-3 py-1 rounded-full bg-surface-subtle border border-border">
            Total: <strong className="text-text-primary">{totalCount}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-card rounded-2xl border border-border p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search communities by name, slug, or topic..."
              aria-label="Search communities"
              className="w-full h-10 pl-10 pr-9 text-xs sm:text-sm bg-surface-subtle text-text-primary placeholder-text-muted rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear community search query"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-text-muted flex items-center gap-1 font-medium hidden sm:inline-flex">
              <SlidersHorizontal size={13} />
              <span>Sort:</span>
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              aria-label="Sort communities"
              className="h-10 px-3 text-xs sm:text-sm font-medium bg-surface-subtle text-text-primary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="members">Most Members</option>
              <option value="name">Alphabetical (A–Z)</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>

        {/* Filter Tabs: All vs Joined */}
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-muted hover:bg-surface-subtle hover:text-text-primary'
            }`}
          >
            All Communities ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('joined')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filter === 'joined'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-muted hover:bg-surface-subtle hover:text-text-primary'
            }`}
          >
            Joined ({joinedCount})
          </button>

          {searchQuery && (
            <span className="ml-auto text-xs text-text-muted">
              {filteredCommunities.length} {filteredCommunities.length === 1 ? 'match' : 'matches'}
            </span>
          )}
        </div>
      </div>

      {/* Loading Skeleton Grid */}
      {loading && (
        <div
          aria-busy="true"
          aria-label="Loading communities"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-surface-card rounded-2xl border border-border overflow-hidden p-0 animate-pulse"
            >
              <div className="h-24 bg-surface-subtle" />
              <div className="p-4 space-y-3 -mt-6">
                <div className="w-14 h-14 rounded-xl bg-surface-subtle border-2 border-surface-card" />
                <div className="h-4 bg-surface-subtle rounded w-3/4" />
                <div className="h-3 bg-surface-subtle rounded w-1/3" />
                <div className="h-12 bg-surface-subtle rounded w-full" />
                <div className="h-8 bg-surface-subtle rounded w-full pt-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div
          role="alert"
          className="bg-surface-card rounded-2xl border border-red-200 dark:border-red-900/40 p-8 sm:p-12 text-center shadow-xs space-y-4 max-w-lg mx-auto"
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertCircle size={24} />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary mb-1">
              Unable to load communities
            </h2>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              {error.message || 'An error occurred while fetching the community catalog.'}
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

      {/* Empty Search / Filter State */}
      {!loading && !error && filteredCommunities.length === 0 && (
        <div
          data-testid="communities-empty-state"
          className="bg-surface-card rounded-2xl border border-border p-10 sm:p-14 text-center space-y-4 max-w-lg mx-auto shadow-xs"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-surface-subtle text-text-muted flex items-center justify-center">
            <Users size={28} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-text-primary">
              {searchQuery.trim()
                ? `No communities matching "${searchQuery.trim()}"`
                : filter === 'joined'
                ? 'You haven\'t joined any communities yet'
                : 'No communities available'}
            </h2>
            <p className="text-xs sm:text-sm text-text-muted mt-1.5 leading-relaxed">
              {searchQuery.trim()
                ? 'Try checking for typos or searching with broader keywords.'
                : filter === 'joined'
                ? 'Explore the full directory to find topics of interest and join conversations.'
                : 'New communities will be added to the directory soon.'}
            </p>
          </div>
          <div className="pt-2">
            {searchQuery ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </Button>
            ) : filter === 'joined' ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setFilter('all')}
              >
                Show All Communities
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {/* Populated Community Grid */}
      {!loading && !error && filteredCommunities.length > 0 && (
        <div
          data-testid="communities-grid"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredCommunities.map((comm) => {
            const isMember = comm.is_member;
            const isPending = pendingSlug === comm.slug;

            return (
              <article
                key={comm.id}
                data-testid={`community-card-${comm.slug}`}
                className="group bg-surface-card rounded-2xl border border-border overflow-hidden shadow-xs hover:shadow-card-hover hover:border-border-strong transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Banner Image or Subtle Gradient Fallback */}
                  <div className="relative h-24 w-full bg-gradient-to-r from-primary/15 via-primary/5 to-transparent dark:from-primary/25 dark:via-primary/10 overflow-hidden">
                    {comm.banner_url ? (
                      <img
                        src={comm.banner_url}
                        alt={`${comm.name} banner`}
                        loading="lazy"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full opacity-30 bg-[radial-gradient(var(--color-primary)_1px,transparent_1px)] [background-size:12px_12px]" />
                    )}
                  </div>

                  {/* Card Content Header */}
                  <div className="px-4 pb-4 pt-0">
                    <div className="flex items-start justify-between gap-3 -mt-8 mb-3">
                      {/* Community Avatar / Emblem */}
                      <Link
                        to={`/c/${encodeURIComponent(comm.slug)}`}
                        className="relative w-16 h-16 rounded-2xl border-2 border-surface-card bg-surface-subtle shadow-sm overflow-hidden shrink-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {comm.avatar_url ? (
                          <img
                            src={comm.avatar_url}
                            alt={comm.name}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-extrabold text-primary uppercase">
                            {comm.slug.slice(0, 2)}
                          </span>
                        )}
                      </Link>

                      {/* Join / Membership Toggle Button */}
                      <Button
                        variant={isMember ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleMembership(comm)}
                        disabled={isPending}
                        isLoading={isPending}
                        aria-pressed={isMember}
                        aria-label={
                          isMember
                            ? `Leave ${comm.name} community`
                            : `Join ${comm.name} community`
                        }
                        className="mt-2 h-8 px-3 min-w-[80px] text-xs font-semibold rounded-full shrink-0 shadow-xs"
                        leftIcon={
                          isMember ? (
                            <Check size={14} className="text-emerald-500 shrink-0" />
                          ) : (
                            <Plus size={14} className="shrink-0" />
                          )
                        }
                      >
                        {isMember ? 'Joined' : 'Join'}
                      </Button>
                    </div>

                    {/* Community Title & Slug */}
                    <div className="mb-2">
                      <Link
                        to={`/c/${encodeURIComponent(comm.slug)}`}
                        className="group-hover:text-primary transition-colors block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                      >
                        <h2 className="text-base font-bold text-text-primary tracking-tight line-clamp-1">
                          {comm.name}
                        </h2>
                      </Link>
                      <span className="text-xs font-semibold text-primary">
                        c/{comm.slug}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed mb-4 min-h-[3rem]">
                      {comm.description}
                    </p>
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="px-4 py-3 bg-surface-subtle/40 border-t border-border flex items-center justify-between text-xs text-text-muted">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium">
                      <Users size={13} className="text-primary" />
                      <strong className="text-text-primary">
                        {comm.members_count.toLocaleString()}
                      </strong>
                    </span>

                    {comm.rules && comm.rules.length > 0 && (
                      <span className="flex items-center gap-1">
                        <BookOpen size={12} />
                        <span>{comm.rules.length} {comm.rules.length === 1 ? 'rule' : 'rules'}</span>
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/c/${encodeURIComponent(comm.slug)}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline focus-visible:outline-none"
                  >
                    <span>View Hub</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CommunitiesPage;
