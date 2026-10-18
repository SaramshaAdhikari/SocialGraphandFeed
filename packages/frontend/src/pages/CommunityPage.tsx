import { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp, Layers, AlertCircle, Home, Compass } from 'lucide-react';
import type { DiscussionPostCard as IDiscussionPostCard, VisualPinCard as IVisualPinCard } from '@socialgraph/shared';
import { useRouter } from '../router/Router';
import { useCommunity } from '../hooks/useCommunity';
import { CommunityHeader, CommunityTabs, CommunitySidebar, CommunitySkeleton } from '../components/community';
import { DiscussionPostCard, VisualPinCard } from '../components/feed';
import { MasonryGrid } from '../components/discovery/MasonryGrid';
import { Button } from '../components/ui/Button';

export function CommunityPage() {
  const { params, currentPath, navigate } = useRouter();
  const [mobileRulesOpen, setMobileRulesOpen] = useState(false);

  // Extract community slug with regex fallback
  const communitySlug = useMemo(() => {
    if (params.communityId) return params.communityId;
    const match = currentPath.match(/^\/c\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }, [params.communityId, currentPath]);

  const {
    community,
    posts,
    filteredPosts,
    activeTab,
    setActiveTab,
    sort,
    setSort,
    loading,
    postsLoading,
    error,
    isNotFound,
    isMember,
    membersCount,
    toggleMembership,
    vote,
    toggleSave,
  } = useCommunity(communitySlug);

  // Reliable Back navigation
  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 2) {
      window.history.back();
    } else {
      navigate('/');
    }
  };

  // Compute category counts for tab badges
  const counts = useMemo(() => {
    const discussions = posts.filter((p) => p.post_type === 'discussion').length;
    const visual = posts.filter((p) => p.post_type === 'visual').length;
    return {
      all: posts.length,
      discussions,
      visual,
    };
  }, [posts]);

  // 1. Loading State
  if (loading) {
    return <CommunitySkeleton />;
  }

  // 2. 404 Community Not Found State
  if (isNotFound || (!community && error)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center" role="region" aria-label="Community Not Found">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181B22] p-8 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-4">
            <AlertCircle size={28} />
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">
            Community Not Found
          </h1>
          <p className="mt-2 text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
            The community <span className="font-mono text-primary">c/{communitySlug}</span> does not exist or may have been renamed.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Home size={15} />}
              onClick={() => navigate('/')}
            >
              Return to Home Feed
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Compass size={15} />}
              onClick={() => navigate('/explore')}
            >
              Explore Discover
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!community) return null;

  return (
    <div
      data-testid="community-page"
      role="region"
      aria-label={`${community.name} Community`}
      className="w-full space-y-4"
    >
      {/* Top Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back to feed"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1 py-0.5 -mx-1"
        >
          <ArrowLeft size={16} />
          <span>Back to Feed</span>
        </button>

        <span className="text-xs font-mono text-[#94A3B8]">
          id: {community.id}
        </span>
      </nav>

      {/* Community Header Banner & Identity */}
      <CommunityHeader
        community={community}
        isMember={isMember}
        membersCount={membersCount}
        onToggleMembership={toggleMembership}
      />

      {/* Mobile Rules Accordion (Visible on small screens only) */}
      {community.rules && community.rules.length > 0 && (
        <div className="lg:hidden rounded-xl border border-[#E2E8F0] dark:border-[#2E3544] bg-white dark:bg-[#181B22] p-3 text-xs shadow-2xs">
          <button
            type="button"
            onClick={() => setMobileRulesOpen(!mobileRulesOpen)}
            aria-expanded={mobileRulesOpen}
            className="w-full flex items-center justify-between font-bold text-[#0F172A] dark:text-[#F8FAFC]"
          >
            <span className="flex items-center gap-2 text-primary">
              <BookOpen size={15} />
              <span>Community Rules ({community.rules.length})</span>
            </span>
            {mobileRulesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {mobileRulesOpen && (
            <ol className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              {community.rules.map((rule, idx) => (
                <li key={rule.id} className="text-xs text-[#475569] dark:text-[#CBD5E1]">
                  <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    {idx + 1}. {rule.title}
                  </span>
                  {rule.description && (
                    <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 pl-3.5">
                      {rule.description}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* Main Grid: Content Stream (Left) + Community Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Scoped Content Column */}
        <section
          aria-label="Community Posts"
          className="lg:col-span-8 min-w-0"
        >
          {/* Content View Tabs & Scoped Sorting Bar */}
          <CommunityTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            sort={sort}
            onSortChange={setSort}
            counts={counts}
          />

          {/* Posts Feed / Masonry Grid / Empty State */}
          {postsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-36 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800"
                />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div
              data-testid="community-feed-empty"
              className="text-center py-12 px-4 rounded-2xl border border-dashed border-[#E2E8F0] dark:border-[#2E3544] bg-white/60 dark:bg-[#181B22]/60"
            >
              <Layers size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                No posts in this view yet
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-sm mx-auto">
                {activeTab === 'all'
                  ? 'Be the first to start a discussion or share a pin in this community.'
                  : `There are currently no ${activeTab} posts in this hub.`}
              </p>
              {activeTab !== 'all' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('all')}
                  className="mt-4 text-xs font-semibold"
                >
                  View All Posts ({counts.all})
                </Button>
              )}
            </div>
          ) : activeTab === 'visual' ? (
            // Pinterest-style Masonry Grid for visual tab
            <MasonryGrid
              pins={filteredPosts.filter((p): p is IVisualPinCard => p.post_type === 'visual')}
              onVote={vote}
              onToggleSave={toggleSave}
            />
          ) : (
            // Mixed or Discussions feed
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                if (post.post_type === 'discussion') {
                  return (
                    <DiscussionPostCard
                      key={post.id}
                      post={post as IDiscussionPostCard}
                      onVote={vote}
                      onToggleSave={toggleSave}
                    />
                  );
                }
                return (
                  <VisualPinCard
                    key={post.id}
                    post={post as IVisualPinCard}
                    onVote={vote}
                    onToggleSave={toggleSave}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: Dedicated Community Sidebar (Desktop) */}
        <div className="hidden lg:block lg:col-span-4 sticky top-20">
          <CommunitySidebar
            community={community}
            membersCount={membersCount}
          />
        </div>
      </div>
    </div>
  );
}
