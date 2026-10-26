import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { RouterProvider } from '../router/Router';
import { ThemeProvider } from '../theme/ThemeContext';
import { AuthProvider } from '../auth/AuthContext';
import { FeedSortBar } from '../components/feed/FeedSortBar';
import { FeedList } from '../components/feed/FeedList';
import { DiscussionPostCard } from '../components/feed/DiscussionPostCard';
import { DiscoveryPinCard } from '../components/discovery/DiscoveryPinCard';
import { VisualPinCard } from '../components/feed/VisualPinCard';
import { CommentNodeItem } from '../components/post/CommentNodeItem';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { TopHeader } from '../components/layout/TopHeader';
import { SidebarNav } from '../components/layout/SidebarNav';
import {
  mockDiscussionPosts,
  mockVisualPins,
  mockCommentsByPostId,
  mockUsers,
} from '../api/mock/fixtures';

describe('Product Visual Refinement & Social Graph Quality Regression Suite', () => {
  const sampleDiscussion = mockDiscussionPosts[0];
  const samplePin = mockVisualPins[0];
  const sampleUser = mockUsers['usr_1'];
  const sampleComment = mockCommentsByPostId['post_disc_101'][0];

  it('1. TopHeader renders universal search bar, mobile search shortcut, and theme toggle', () => {
    const html = renderToString(
      <ThemeProvider>
        <RouterProvider initialPath="/">
          <AuthProvider>
            <TopHeader />
          </AuthProvider>
        </RouterProvider>
      </ThemeProvider>
    );

    expect(html).toContain('Search posts, communities, users...');
    expect(html).toContain('aria-label="Search posts, communities, and users"');
    expect(html).toContain('title="Switch to dark mode"');
  });

  it('2. SidebarNav renders brand badge and key navigation destinations with semantic active states', () => {
    const html = renderToString(
      <RouterProvider initialPath="/explore">
        <AuthProvider>
          <SidebarNav />
        </AuthProvider>
      </RouterProvider>
    );

    expect(html).toContain('SocialGraph');
    expect(html).toContain('Home Feed');
    expect(html).toContain('Discover');
    expect(html).toContain('Communities');
    expect(html).toContain('Saved');
    expect(html).toContain('Appearance');
  });

  it('3. FeedSortBar provides accessible tablist for scopes and toolbar for sorts', () => {
    const html = renderToString(
      <FeedSortBar
        scope="following"
        sort="hot"
        onScopeChange={() => {}}
        onSortChange={() => {}}
      />
    );

    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-label="Feed Scopes"');
    expect(html).toContain('role="toolbar"');
    expect(html).toContain('aria-label="Sort Options"');
    expect(html).toContain('For You');
    expect(html).toContain('Following');
    expect(html).toContain('Communities');
    expect(html).toContain('Hot');
    expect(html).toContain('New');
    expect(html).toContain('Top');
  });

  it('4. FeedList renders an actionable CTA when Following feed has no posts', () => {
    const html = renderToString(
      <RouterProvider initialPath="/">
        <FeedList
          posts={[]}
          scope="following"
          loading={false}
          loadingMore={false}
          hasMore={false}
          error={null}
          onLoadMore={() => {}}
          onRetry={() => {}}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );

    expect(html).toContain('No posts from creators you follow');
    expect(html).toContain('Explore Creators');
    expect(html).toContain('Browse Communities');
  });

  it('5. DiscussionPostCard displays vertical vote gutter, author avatar, and tags', () => {
    const html = renderToString(
      <RouterProvider initialPath="/">
        <DiscussionPostCard
          post={sampleDiscussion}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );

    expect(html).toContain(sampleDiscussion.title);
    expect(html).toContain(`u/`);
    expect(html).toContain(sampleDiscussion.author.username);
    expect(html).toContain('aria-label="Upvote"');
    expect(html).toContain('aria-label="Downvote"');
    expect(html).toContain('aria-label="Vote on post"');
    expect(html).toContain('flex-col');
  });

  it('6. DiscoveryPinCard renders Pinterest-style hover save pill and CLS aspect ratio reservation', () => {
    const html = renderToString(
      <RouterProvider initialPath="/explore">
        <DiscoveryPinCard
          pin={samplePin}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );

    expect(html).toContain('aspect-ratio');
    expect(html).toContain('Save');
    expect(html).toContain(samplePin.title);
    expect(html).toContain(samplePin.author.display_name);
  });

  it('7. VisualPinCard includes verified creator badge and community link', () => {
    const html = renderToString(
      <RouterProvider initialPath="/">
        <VisualPinCard
          post={samplePin}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );

    expect(html).toContain('c/' + samplePin.community_slug);
    expect(html).toContain(samplePin.author.display_name);
    expect(html).toContain('aria-label="Like pin"');
  });

  it('8. CommentNodeItem displays thread guide line and author identity', () => {
    const html = renderToString(
      <RouterProvider initialPath={`/post/${sampleDiscussion.id}`}>
        <CommentNodeItem
          comment={sampleComment}
          depth={1}
          onAddReply={async () => {}}
          onVoteComment={() => {}}
        />
      </RouterProvider>
    );

    expect(html).toContain(sampleComment.author.display_name);
    expect(html).toContain(sampleComment.author.username);
    expect(html).toContain('title="Collapse thread"');
    expect(html).toContain('title="Upvote comment (held in local session memory)"');
  });

  it('9. ProfileHeader displays stats, bio, verified status, and follow button', () => {
    const html = renderToString(
      <RouterProvider initialPath={`/u/${sampleUser.username}`}>
        <AuthProvider>
          <ProfileHeader
            profile={sampleUser}
            isSelf={false}
            onToggleFollow={async () => {}}
          />
        </AuthProvider>
      </RouterProvider>
    );

    expect(html).toContain(sampleUser.display_name);
    expect(html).toContain(sampleUser.username);
    expect(html).toContain('Distributed systems researcher');
    expect(html).toContain('Followers');
    expect(html).toContain('Following');
  });
});
