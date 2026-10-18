import { useMemo } from 'react';
import { UserX, Compass, Home, MessageSquare, Image, Bookmark, Sparkles } from 'lucide-react';
import { useRouter, Link } from '../router/Router';
import { useProfile } from '../hooks/useProfile';
import { ProfileHeader, ProfileTabs, ProfileSkeleton } from '../components/profile';
import { DiscussionPostCard, VisualPinCard } from '../components/feed';
import { MasonryGrid } from '../components/discovery/MasonryGrid';
import { Button } from '../components/ui';
import type { DiscussionPostCard as IDiscussionPostCard, VisualPinCard as IVisualPinCard } from '@socialgraph/shared';

export function UserProfilePage() {
  const { params, currentPath, navigate } = useRouter();

  // Extract username from params or path match fallback
  const username = useMemo(() => {
    if (params.username) return params.username;
    const match = currentPath.match(/^\/u\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }, [params.username, currentPath]);

  const {
    profile,
    posts,
    filteredPosts,
    activeTab,
    setActiveTab,
    loading,
    error,
    isNotFound,
    isSelf,
    toggleFollow,
    vote,
    toggleSave,
  } = useProfile(username);

  // Compute category counts for tab badges
  const counts = useMemo(() => {
    const discussions = posts.filter((p) => p.post_type === 'discussion').length;
    const visual = posts.filter((p) => p.post_type === 'visual').length;
    const saved = posts.filter((p) => p.is_saved).length;
    return {
      all: posts.length,
      discussions,
      visual,
      saved,
    };
  }, [posts]);

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8" role="region" aria-label="Loading Profile">
        <ProfileSkeleton />
      </div>
    );
  }

  // 404 User Not Found State
  if (isNotFound || (!profile && error)) {
    return (
      <div
        className="max-w-2xl mx-auto px-4 py-16 text-center"
        role="region"
        aria-label="User Profile Not Found"
        data-testid="profile-not-found"
      >
        <div className="bg-white dark:bg-[#181B22] rounded-3xl border border-[#E2E8F0] dark:border-[#2E3544] p-8 sm:p-12 shadow-sm transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <UserX size={32} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-2 tracking-tight">
            User Not Found
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] max-w-md mx-auto mb-6 leading-relaxed">
            The user <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">@{username || 'unknown'}</span> does not exist or has been removed from SocialGraph.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <Home size={16} />
              <span>Back to Home Feed</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/explore')}
              className="gap-2"
            >
              <Compass size={16} />
              <span>Explore Creators</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div
      className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6"
      role="region"
      aria-label={`${profile.display_name} Profile`}
      data-testid="user-profile-page"
    >
      {/* Profile Header Identity */}
      <ProfileHeader
        profile={profile}
        isSelf={isSelf}
        onToggleFollow={toggleFollow}
      />

      {/* Content Navigation Tabs */}
      <ProfileTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isSelf={isSelf}
        counts={counts}
      />

      {/* Tab Content Panel */}
      <section
        id={`profile-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`profile-tab-${activeTab}`}
        className="focus:outline-none"
      >
        {filteredPosts.length === 0 ? (
          /* Empty State for Selected Tab */
          <div
            data-testid="profile-tab-empty"
            className="bg-white dark:bg-[#181B22] rounded-3xl border border-[#E2E8F0] dark:border-[#2E3544] p-12 text-center shadow-xs transition-colors"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#F1F5F9] dark:bg-[#262B36] text-[#64748B] dark:text-[#94A3B8] flex items-center justify-center mx-auto mb-3.5">
              {activeTab === 'discussions' ? (
                <MessageSquare size={26} />
              ) : activeTab === 'visual' ? (
                <Image size={26} />
              ) : activeTab === 'saved' ? (
                <Bookmark size={26} />
              ) : (
                <Sparkles size={26} />
              )}
            </div>

            <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1.5">
              {activeTab === 'discussions'
                ? 'No discussions published yet'
                : activeTab === 'visual'
                ? 'No visual pins shared yet'
                : activeTab === 'saved'
                ? 'No saved items in collection'
                : 'No posts published yet'}
            </h3>

            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] max-w-sm mx-auto leading-relaxed mb-4">
              {activeTab === 'discussions'
                ? `When @${profile.username} publishes architectural notes or technical discussions, they will appear here.`
                : activeTab === 'visual'
                ? `Visual pins and photography published by @${profile.username} will be showcased in this gallery.`
                : activeTab === 'saved'
                ? 'Posts and pins you bookmark across the feed will be gathered here for quick access.'
                : `@${profile.username} has not posted any content yet.`}
            </p>

            {isSelf && activeTab === 'saved' && (
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary-hover transition-colors shadow-xs"
              >
                Explore Home Feed
              </Link>
            )}
          </div>
        ) : activeTab === 'visual' ? (
          /* Visual Pins Tab: Pinterest Multi-Column Masonry */
          <div data-testid="profile-masonry-view">
            <MasonryGrid
              pins={filteredPosts as IVisualPinCard[]}
              onVote={vote}
              onToggleSave={toggleSave}
            />
          </div>
        ) : activeTab === 'discussions' ? (
          /* Discussions Tab: Reddit-Style Discussion Cards */
          <div className="space-y-4" data-testid="profile-discussions-view">
            {filteredPosts.map((post) => (
              <DiscussionPostCard
                key={post.id}
                post={post as IDiscussionPostCard}
                onVote={vote}
                onToggleSave={toggleSave}
              />
            ))}
          </div>
        ) : (
          /* All or Saved Tabs: Responsive Mixed Feed */
          <div className="space-y-4" data-testid="profile-mixed-feed-view">
            {filteredPosts.map((post) =>
              post.post_type === 'discussion' ? (
                <DiscussionPostCard
                  key={post.id}
                  post={post as IDiscussionPostCard}
                  onVote={vote}
                  onToggleSave={toggleSave}
                />
              ) : (
                <VisualPinCard
                  key={post.id}
                  post={post as IVisualPinCard}
                  onVote={vote}
                  onToggleSave={toggleSave}
                />
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}
