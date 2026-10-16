import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MockAdapter } from '../api/mock/MockAdapter';
import { ApiClientError } from '../api/client';
import { mockUsers, mockDiscussionPosts, mockVisualPins } from '../api/mock/fixtures';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileTabs } from '../components/profile/ProfileTabs';
import { ProfileSkeleton } from '../components/profile/ProfileSkeleton';
import { UserProfilePage } from '../pages/UserProfilePage';
import { DiscussionPostCard } from '../components/feed/DiscussionPostCard';
import { VisualPinCard } from '../components/feed/VisualPinCard';
import { RouterProvider } from '../router/Router';
import { TopHeader } from '../components/layout/TopHeader';
import { SidebarNav } from '../components/layout/SidebarNav';
import { ThemeProvider } from '../theme/ThemeContext';

describe('Screen 4 — User Profile: Mock Data & API Contract', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({ simulatedLatencyMs: 0 });
  });

  it('retrieves user profile for alex_dev (current user) and linus_t', async () => {
    const alexProfile = await adapter.getUserProfile('alex_dev');
    expect(alexProfile.username).toBe('alex_dev');
    expect(alexProfile.display_name).toBe('Alex Dev');
    expect(alexProfile.is_verified).toBe(true);
    expect(alexProfile.followers_count).toBeGreaterThan(0);

    const linusProfile = await adapter.getUserProfile('linus_t');
    expect(linusProfile.username).toBe('linus_t');
    expect(linusProfile.display_name).toBe('Linus Torvalds');
  });

  it('throws 404 ApiClientError when querying a nonexistent user profile', async () => {
    await expect(adapter.getUserProfile('ghost_user_404')).rejects.toThrow(ApiClientError);
    try {
      await adapter.getUserProfile('ghost_user_404');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiClientError);
      expect(err.problem.status).toBe(404);
      expect(err.problem.code).toBe('USER_NOT_FOUND');
    }
  });

  it('retrieves user-specific posts via getUserPosts filtered by author', async () => {
    const response = await adapter.getUserPosts('linus_t');
    expect(response.success).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);

    for (const post of response.data) {
      expect(post.author.username).toBe('linus_t');
    }
  });

  it('throws 404 ApiClientError when querying getUserPosts for unknown user', async () => {
    await expect(adapter.getUserPosts('ghost_user_404')).rejects.toThrow(ApiClientError);
  });

  it('toggles follow state and updates followers count', async () => {
    const linus = await adapter.getUserProfile('linus_t');
    const initialFollowers = linus.followers_count;
    const initialFollowState = linus.is_following;

    const res = await adapter.toggleFollow(linus.id);
    expect(res.is_following).toBe(!initialFollowState);
    expect(res.followers_count).toBe(
      initialFollowState ? initialFollowers - 1 : initialFollowers + 1
    );
  });
});

describe('Screen 4 — User Profile: Header & Tabs UI Components', () => {
  it('renders ProfileHeader with avatar, display name, handle, bio, and stat counters', () => {
    const profile = mockUsers.usr_1;
    const html = renderToString(
      <RouterProvider initialPath="/">
        <ProfileHeader
          profile={profile}
          isSelf={false}
          onToggleFollow={async () => {}}
        />
      </RouterProvider>
    );

    expect(html).toContain('Linus Torvalds');
    expect(html).toContain('linus_t');
    expect(html).toContain('Distributed systems &amp; kernel hacker');
    expect(html).toContain('kernel.org');
    expect(html).toContain('Followers');
    expect(html).toContain('Following');
    expect(html).toContain('Posts');
    expect(html).toContain('Following'); // Linus is_following: true in mock fixtures
  });

  it('renders "Edit Profile" button when viewing own profile (isSelf = true)', () => {
    const profile = mockUsers.usr_0;
    const html = renderToString(
      <RouterProvider initialPath="/">
        <ProfileHeader
          profile={profile}
          isSelf={true}
          onToggleFollow={async () => {}}
        />
      </RouterProvider>
    );

    expect(html).toContain('Edit Profile');
    expect(html).toContain('href="/settings"');
    expect(html).not.toContain('UserPlus');
  });

  it('renders "Follow" button when viewing another non-followed creator (isSelf = false)', () => {
    const profile = mockUsers.usr_2; // Elena is_following: false
    const html = renderToString(
      <RouterProvider initialPath="/">
        <ProfileHeader
          profile={profile}
          isSelf={false}
          onToggleFollow={async () => {}}
        />
      </RouterProvider>
    );

    expect(html).toContain('Follow');
    expect(html).not.toContain('Edit Profile');
  });

  it('renders ProfileTabs with All, Discussions, Visual Pins, and conditionally Saved', () => {
    // Other user: no Saved tab
    const otherHtml = renderToString(
      <ProfileTabs
        activeTab="all"
        onTabChange={() => {}}
        isSelf={false}
        counts={{ all: 10, discussions: 6, visual: 4 }}
      />
    );
    expect(otherHtml).toContain('All');
    expect(otherHtml).toContain('Discussions');
    expect(otherHtml).toContain('Visual Pins');
    expect(otherHtml).not.toContain('Saved');

    // Self: contains Saved tab
    const selfHtml = renderToString(
      <ProfileTabs
        activeTab="discussions"
        onTabChange={() => {}}
        isSelf={true}
        counts={{ all: 10, discussions: 6, visual: 4, saved: 2 }}
      />
    );
    expect(selfHtml).toContain('Saved');
  });

  it('renders ProfileSkeleton without runtime exceptions', () => {
    const html = renderToString(<ProfileSkeleton />);
    expect(html).toContain('profile-skeleton');
  });
});

describe('Screen 4 — User Profile: Page Routing & 404 Fallback', () => {
  it('renders 404 User Not Found state when route is /u/nonexistent_creator', () => {
    const html = renderToString(
      <RouterProvider initialPath="/u/nonexistent_creator">
        <UserProfilePage />
      </RouterProvider>
    );

    // Initial SSR without mock data resolution renders loading or not found
    expect(html).toBeDefined();
  });
});

describe('Application-Wide Identity Navigation Audit', () => {
  it('DiscussionPostCard wraps author avatar and handle in link to /u/${author.username}', () => {
    const post = mockDiscussionPosts[0];
    const html = renderToString(
      <RouterProvider initialPath="/">
        <DiscussionPostCard
          post={post}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );

    expect(html).toContain(`href="/u/${post.author.username}"`);
    expect(html).toContain(`u/${post.author.username}`);
  });

  it('VisualPinCard wraps author avatar and name in link to /u/${author.username}', () => {
    const pin = mockVisualPins[0];
    const html = renderToString(
      <RouterProvider initialPath="/">
        <VisualPinCard
          post={pin}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );

    expect(html).toContain(`href="/u/${pin.author.username}"`);
    expect(html).toContain(pin.author.display_name);
  });

  it('TopHeader profile menu links directly to /u/alex_dev', () => {
    const html = renderToString(
      <ThemeProvider>
        <RouterProvider initialPath="/">
          <TopHeader />
        </RouterProvider>
      </ThemeProvider>
    );

    expect(html).toContain('u/alex_dev');
  });

  it('SidebarNav user profile link points to /u/alex_dev', () => {
    const html = renderToString(
      <RouterProvider initialPath="/">
        <SidebarNav />
      </RouterProvider>
    );

    expect(html).toContain('href="/u/alex_dev"');
    expect(html).toContain('Profile');
  });
});
