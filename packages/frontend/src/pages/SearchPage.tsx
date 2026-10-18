import { useUniversalSearch } from '../hooks/useUniversalSearch';
import {
  SearchHeader,
  SearchTabs,
  UserSearchResultCard,
  CommunitySearchResultCard,
  SearchEmptyState,
  SearchSkeleton,
} from '../components/search';
import { DiscussionPostCard } from '../components/feed';
import { MasonryGrid } from '../components/discovery/MasonryGrid';
import { Button } from '../components/ui/Button';
import {
  Search,
  Users,
  User,
  MessageSquare,
  Image,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { DiscussionPostCard as IDiscussionPostCard, VisualPinCard as IVisualPinCard } from '@socialgraph/shared';

const POPULAR_TOPICS = [
  { name: 'Distributed Systems', category: 'communities' },
  { name: 'Cache Invalidation', category: 'discussions' },
  { name: 'Redis 7', category: 'discussions' },
  { name: 'Brutalist Architecture', category: 'visual' },
  { name: 'Generative Design', category: 'visual' },
  { name: 'Elena Rostova', category: 'people' },
];

export function SearchPage() {
  const {
    query,
    setQuery,
    category,
    setCategory,
    sort,
    setSort,
    results,
    loading,
    error,
    hasSearched,
    counts,
    submitSearch,
    clearSearch,
    votePost,
    toggleSavePost,
    retry,
  } = useUniversalSearch();

  const handleSuggestionClick = (term: string) => {
    setQuery(term);
    submitSearch(term);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-8">
      {/* Search Header Input */}
      <SearchHeader
        query={query}
        onQueryChange={setQuery}
        onSubmit={submitSearch}
        loading={loading}
      />

      {/* When no query has been entered yet: Initial Exploration Canvas */}
      {!hasSearched ? (
        <section
          data-testid="search-initial-state"
          className="bg-white dark:bg-[#181B22] border border-[#E2E8F0] dark:border-[#2E3544] rounded-2xl p-6 sm:p-10 shadow-xs"
        >
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
              <Sparkles size={13} />
              <span>Universal Discovery</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
              Search across SocialGraph
            </h2>
            <p className="mt-2 text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              Find technical discussions, architectural pins, research communities, and fellow systems engineers.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-[#F1F5F9] dark:border-[#262B36]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-3 flex items-center gap-1.5">
              <Search size={13} />
              <span>Suggested Searches</span>
            </h3>

            <div className="flex flex-wrap gap-2">
              {POPULAR_TOPICS.map((topic) => (
                <button
                  key={topic.name}
                  type="button"
                  onClick={() => handleSuggestionClick(topic.name)}
                  className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-[#262B36] text-[#334155] dark:text-[#CBD5E1] hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary transition-all cursor-pointer"
                >
                  <span>{topic.name}</span>
                  <ArrowRight
                    size={11}
                    className="opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all text-primary"
                  />
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : (
        /* Results Section */
        <div>
          {/* Category Tabs & Sorting */}
          <SearchTabs
            activeCategory={category}
            onCategoryChange={setCategory}
            sort={sort}
            onSortChange={setSort}
            counts={counts}
          />

          {/* Loading State */}
          {loading && <SearchSkeleton category={category} />}

          {/* Error State */}
          {!loading && error && (
            <div
              data-testid="search-error-state"
              className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center max-w-lg mx-auto"
            >
              <AlertCircle size={28} className="text-red-500 mx-auto mb-2" />
              <h3 className="font-bold text-sm text-red-800 dark:text-red-300">
                Search request failed
              </h3>
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {error.message || 'An unexpected error occurred while searching. Please try again.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={retry}
                className="mt-4 text-xs font-semibold"
              >
                Retry Search
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && results && results.total_count === 0 && (
            <SearchEmptyState
              query={query}
              category={category}
              onClear={clearSearch}
              onSuggestionClick={handleSuggestionClick}
            />
          )}

          {/* Results Presentation */}
          {!loading && !error && results && results.total_count > 0 && (
            <div data-testid="search-results-container" className="space-y-8">
              {/* VIEW: ALL (Structured multi-entity preview) */}
              {category === 'all' && (
                <>
                  {/* Communities Preview Strip */}
                  {results.communities.length > 0 && (
                    <section aria-label="Matching communities">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-primary" />
                          <h3 className="font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC]">
                            Communities ({results.communities.length})
                          </h3>
                        </div>
                        {results.communities.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setCategory('communities')}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            View all ({results.communities.length})
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.communities.slice(0, 2).map((community) => (
                          <CommunitySearchResultCard
                            key={community.id}
                            community={community}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* People Preview Strip */}
                  {results.users.length > 0 && (
                    <section aria-label="Matching people">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-primary" />
                          <h3 className="font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC]">
                            People ({results.users.length})
                          </h3>
                        </div>
                        {results.users.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setCategory('people')}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            View all ({results.users.length})
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {results.users.slice(0, 2).map((user) => (
                          <UserSearchResultCard key={user.id} user={user} />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Discussions Preview Stream */}
                  {results.discussions.length > 0 && (
                    <section aria-label="Matching discussions">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MessageSquare size={16} className="text-primary" />
                          <h3 className="font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC]">
                            Discussions ({results.discussions.length})
                          </h3>
                        </div>
                        {results.discussions.length > 3 && (
                          <button
                            type="button"
                            onClick={() => setCategory('discussions')}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            View all ({results.discussions.length})
                          </button>
                        )}
                      </div>
                      <div className="space-y-4">
                        {results.discussions.slice(0, 4).map((post) => (
                          <DiscussionPostCard
                            key={post.id}
                            post={post as IDiscussionPostCard}
                            onVote={votePost}
                            onToggleSave={toggleSavePost}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Visual Pins Preview Masonry */}
                  {results.visuals.length > 0 && (
                    <section aria-label="Matching visual pins">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Image size={16} className="text-primary" />
                          <h3 className="font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC]">
                            Visual Pins ({results.visuals.length})
                          </h3>
                        </div>
                        {results.visuals.length > 4 && (
                          <button
                            type="button"
                            onClick={() => setCategory('visual')}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            View all ({results.visuals.length})
                          </button>
                        )}
                      </div>
                      <MasonryGrid
                        pins={results.visuals as IVisualPinCard[]}
                        onVote={votePost}
                        onToggleSave={toggleSavePost}
                      />
                    </section>
                  )}
                </>
              )}

              {/* VIEW: DISCUSSIONS ONLY */}
              {category === 'discussions' && (
                <section aria-label="Discussions search results" className="space-y-4">
                  {results.discussions.length === 0 ? (
                    <p className="text-center py-10 text-xs text-[#64748B] dark:text-[#94A3B8]">
                      No discussion posts matched &ldquo;{query}&rdquo;.
                    </p>
                  ) : (
                    results.discussions.map((post) => (
                      <DiscussionPostCard
                        key={post.id}
                        post={post as IDiscussionPostCard}
                        onVote={votePost}
                        onToggleSave={toggleSavePost}
                      />
                    ))
                  )}
                </section>
              )}

              {/* VIEW: VISUAL PINS ONLY (Masonry) */}
              {category === 'visual' && (
                <section aria-label="Visual pins search results">
                  {results.visuals.length === 0 ? (
                    <p className="text-center py-10 text-xs text-[#64748B] dark:text-[#94A3B8]">
                      No visual pins matched &ldquo;{query}&rdquo;.
                    </p>
                  ) : (
                    <MasonryGrid
                      pins={results.visuals as IVisualPinCard[]}
                      onVote={votePost}
                      onToggleSave={toggleSavePost}
                    />
                  )}
                </section>
              )}

              {/* VIEW: COMMUNITIES ONLY */}
              {category === 'communities' && (
                <section aria-label="Communities search results">
                  {results.communities.length === 0 ? (
                    <p className="text-center py-10 text-xs text-[#64748B] dark:text-[#94A3B8]">
                      No communities matched &ldquo;{query}&rdquo;.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.communities.map((community) => (
                        <CommunitySearchResultCard
                          key={community.id}
                          community={community}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* VIEW: PEOPLE ONLY */}
              {category === 'people' && (
                <section aria-label="People search results">
                  {results.users.length === 0 ? (
                    <p className="text-center py-10 text-xs text-[#64748B] dark:text-[#94A3B8]">
                      No people matched &ldquo;{query}&rdquo;.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {results.users.map((user) => (
                        <UserSearchResultCard key={user.id} user={user} />
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
