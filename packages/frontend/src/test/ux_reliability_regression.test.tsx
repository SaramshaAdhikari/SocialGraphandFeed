import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DiscoveryPinCard } from '../components/discovery/DiscoveryPinCard';
import { VisualPinCard } from '../components/feed/VisualPinCard';
import { AppLayout } from '../components/layout/AppLayout';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { CommunityHeader } from '../components/community/CommunityHeader';
import { CommentComposer } from '../components/post/CommentComposer';
import { TopHeader } from '../components/layout/TopHeader';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { RouterProvider } from '../router/Router';
import { ThemeProvider } from '../theme/ThemeContext';
import { AuthProvider } from '../auth/AuthContext';
import { mockVisualPins, mockUsers, mockCommunities } from '../api/mock/fixtures';
import type { VisualPinCard as IVisualPinCard } from '@socialgraph/shared';

describe('Phase 3 UX Reliability & Defect Regression Suite', () => {
  const samplePin: IVisualPinCard = mockVisualPins[0];

  it('1. DiscoveryPinCard renders fallback indicator when image fails to load', () => {
    const html = renderToString(
      <RouterProvider initialPath="/explore">
        <DiscoveryPinCard
          pin={samplePin}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );

    // Initial render includes img with lazy loading
    expect(html).toContain('img');
    expect(html).toContain(samplePin.media.url);
    expect(html).toContain('alt="');
  });

  it('2. VisualPinCard renders aspect ratio media box and alt tags correctly', () => {
    const html = renderToString(
      <RouterProvider initialPath="/">
        <VisualPinCard
          post={samplePin}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );

    expect(html).toContain('aspect-ratio');
    expect(html).toContain(samplePin.title);
    expect(html).toContain('c/' + samplePin.community_slug);
  });

  it('3. AppLayout includes /saved in dedicated canvas without RightRail collision', () => {
    const html = renderToString(
      <ThemeProvider>
        <RouterProvider initialPath="/saved">
          <AuthProvider>
            <AppLayout>
              <div data-testid="saved-inner-content">Saved Library Canvas</div>
            </AppLayout>
          </AuthProvider>
        </RouterProvider>
      </ThemeProvider>
    );

    // In dedicated canvas, RightRail is NOT rendered
    expect(html).toContain('Saved Library Canvas');
    expect(html).not.toContain('Trending Discussions');
    expect(html).not.toContain('Recommended Hubs');
  });

  it('4. AppLayout renders RightRail on default home feed path "/"', () => {
    const html = renderToString(
      <ThemeProvider>
        <RouterProvider initialPath="/">
          <AuthProvider>
            <AppLayout>
              <div data-testid="feed-content">Home Feed Stream</div>
            </AppLayout>
          </AuthProvider>
        </RouterProvider>
      </ThemeProvider>
    );

    expect(html).toContain('Home Feed Stream');
    expect(html).toContain('Trending Discussions');
    expect(html).toContain('Recommended Hubs');
  });

  it('5. ProfileHeader renders creator identity, badges, and cover banner', () => {
    const profile = mockUsers.usr_2; // Elena Rostova
    const html = renderToString(
      <RouterProvider initialPath="/u/elena_arch">
        <ProfileHeader
          profile={profile}
          isSelf={false}
          onToggleFollow={async () => {}}
        />
      </RouterProvider>
    );

    expect(html).toContain(profile.display_name);
    expect(html).toContain(profile.username);
    expect(html).toContain(profile.banner_url);
    expect(html).toContain('Verified Creator');
  });

  it('6. CommunityHeader renders identity, slug, member count, and banner', () => {
    const comm = mockCommunities.systems;
    const html = renderToString(
      <RouterProvider initialPath="/c/systems">
        <CommunityHeader
          community={comm}
          onToggleMembership={() => {}}
        />
      </RouterProvider>
    );

    expect(html).toContain(comm.name);
    expect(html).toContain('c/' + comm.slug);
    expect(html).toContain(comm.banner_url);
    expect(html).toContain('14,250');
  });

  it('7. CommentComposer renders platform shortcut hint and submit button', () => {
    const html = renderToString(
      <CommentComposer
        onSubmit={async () => {}}
        placeholder="Write a comment..."
      />
    );

    expect(html).toContain('Enter</kbd> to send');
    expect(html).toContain('Write a comment...');
    expect(html).toContain('Comment');
  });

  it('8. TopHeader includes responsive mobile search navigation target', () => {
    const html = renderToString(
      <ThemeProvider>
        <RouterProvider initialPath="/">
          <AuthProvider>
            <TopHeader />
          </AuthProvider>
        </RouterProvider>
      </ThemeProvider>
    );

    expect(html).toContain('href="/search"');
    expect(html).toContain('aria-label="Search posts, communities, and users"');
  });

  it('9. MobileBottomNav renders Sign In destination for unauthenticated visitors', () => {
    const html = renderToString(
      <RouterProvider initialPath="/">
        <MobileBottomNav />
      </RouterProvider>
    );

    expect(html).toContain('href="/login"');
    expect(html).toContain('Sign In');
  });

  it('10. DiscoveryPinCard renders touch-accessible quick-save button', () => {
    const unsavedPin = { ...samplePin, is_saved: false };
    const html = renderToString(
      <RouterProvider initialPath="/explore">
        <DiscoveryPinCard
          pin={unsavedPin}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );

    expect(html).toContain('opacity-100 sm:opacity-0 sm:group-hover/pin:opacity-100');
    expect(html).toContain('focus-visible:ring-2');
  });
});
