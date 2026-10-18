import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MockAdapter } from '../api/mock/MockAdapter';
import { LiveClient } from '../api/LiveClient';
import { ApiClientError } from '../api/client';
import { mockDiscussionPosts, mockVisualPins } from '../api/mock/fixtures';
import { SavedCollectionsPage } from '../pages/SavedCollectionsPage';
import { UserProfilePage } from '../pages/UserProfilePage';
import { ProfileTabs } from '../components/profile/ProfileTabs';
import { DiscussionPostCard } from '../components/feed/DiscussionPostCard';
import { VisualPinCard } from '../components/feed/VisualPinCard';
import { SidebarNav } from '../components/layout/SidebarNav';
import { TopHeader } from '../components/layout/TopHeader';
import { RouterProvider } from '../router/Router';
import { ThemeProvider } from '../theme/ThemeContext';

describe('Screen 8 — Saved Collections: MockAdapter Data Contracts & Filtering', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({ simulatedLatencyMs: 0 });
  });

  it('1. retrieves all bookmarked posts (is_saved = true) authored across different creators', async () => {
    const res = await adapter.getSavedPosts();
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThanOrEqual(7);

    // All returned items must have is_saved: true
    for (const post of res.data) {
      expect(post.is_saved).toBe(true);
    }

    // Verify critical bugfix: Saved posts must include items created by creators OTHER than alex_dev
    const authors = new Set(res.data.map((p) => p.author.username));
    expect(authors.has('alec')).toBe(true);
    expect(authors.has('elena_arch')).toBe(true);
    expect(authors.has('sara_code')).toBe(true);
    expect(authors.size).toBeGreaterThan(1);
  });

  it('2. filters saved posts by format type: discussions vs visual vs all', async () => {
    // All
    const allRes = await adapter.getSavedPosts({ type: 'all' });
    expect(allRes.data.some((p) => p.post_type === 'discussion')).toBe(true);
    expect(allRes.data.some((p) => p.post_type === 'visual')).toBe(true);

    // Discussions only
    const discRes = await adapter.getSavedPosts({ type: 'discussions' });
    expect(discRes.data.length).toBeGreaterThan(0);
    for (const post of discRes.data) {
      expect(post.post_type).toBe('discussion');
    }

    // Visual pins only
    const visRes = await adapter.getSavedPosts({ type: 'visual' });
    expect(visRes.data.length).toBeGreaterThan(0);
    for (const post of visRes.data) {
      expect(post.post_type).toBe('visual');
    }

    // Sum of discussions and visual pins equals total saved
    expect(discRes.data.length + visRes.data.length).toBe(allRes.data.length);
  });

  it('3. filters saved items by community slug or ID', async () => {
    const hardwareRes = await adapter.getSavedPosts({ communitySlug: 'hardware' });
    expect(hardwareRes.data.length).toBeGreaterThan(0);
    for (const post of hardwareRes.data) {
      expect(post.community_slug?.toLowerCase()).toBe('hardware');
    }

    const systemsRes = await adapter.getSavedPosts({ communitySlug: 'c_systems' });
    expect(systemsRes.data.length).toBeGreaterThan(0);
    for (const post of systemsRes.data) {
      expect(post.community_id).toBe('c_systems');
    }
  });

  it('4. filters saved items by keyword search across titles, content, captions, and tags', async () => {
    // Search by title keyword
    const coolingSearch = await adapter.getSavedPosts({ query: 'cooling' });
    expect(coolingSearch.data.length).toBeGreaterThan(0);
    for (const post of coolingSearch.data) {
      const match =
        (post.title?.toLowerCase().includes('cooling') ?? false) ||
        (post.post_type === 'visual' && (post as any).caption?.toLowerCase().includes('cooling')) ||
        (post as any).tags?.some((t: string) => t.toLowerCase().includes('cooling'));
      expect(match).toBe(true);
    }

    // Search by author name/handle
    const authorSearch = await adapter.getSavedPosts({ query: 'elena' });
    expect(authorSearch.data.length).toBeGreaterThan(0);
    for (const post of authorSearch.data) {
      expect(
        post.author.username.toLowerCase().includes('elena') ||
        post.author.display_name.toLowerCase().includes('elena')
      ).toBe(true);
    }

    // Nonexistent query returns empty results
    const emptySearch = await adapter.getSavedPosts({ query: 'nonexistent_xyz_quantum_999' });
    expect(emptySearch.data).toHaveLength(0);
  });

  it('5. sorts saved items by new, top, and comments', async () => {
    // Sort by new (newest created_at first)
    const newRes = await adapter.getSavedPosts({ sort: 'new' });
    for (let i = 1; i < newRes.data.length; i++) {
      const prevDate = new Date(newRes.data[i - 1].created_at).getTime();
      const currDate = new Date(newRes.data[i].created_at).getTime();
      expect(prevDate).toBeGreaterThanOrEqual(currDate);
    }

    // Sort by top (highest score first)
    const topRes = await adapter.getSavedPosts({ sort: 'top' });
    for (let i = 1; i < topRes.data.length; i++) {
      expect(topRes.data[i - 1].score).toBeGreaterThanOrEqual(topRes.data[i].score);
    }

    // Sort by comments (highest comments_count first)
    const commentsRes = await adapter.getSavedPosts({ sort: 'comments' });
    for (let i = 1; i < commentsRes.data.length; i++) {
      expect(commentsRes.data[i - 1].comments_count).toBeGreaterThanOrEqual(commentsRes.data[i].comments_count);
    }
  });

  it('6. supports cursor pagination with limit and has_more', async () => {
    const page1 = await adapter.getSavedPosts({ limit: 3 });
    expect(page1.data).toHaveLength(3);
    expect(page1.has_more).toBe(true);
    expect(page1.next_cursor).toBeDefined();

    const page2 = await adapter.getSavedPosts({ limit: 3, cursor: page1.next_cursor });
    expect(page2.data.length).toBeGreaterThan(0);
    expect(page2.data[0].id).not.toBe(page1.data[0].id);
  });
});

describe('Screen 8 — Saved Collections: Un-save, In-Memory State & Undo Restoration', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({ simulatedLatencyMs: 0 });
  });

  it('7. un-saving a post removes it from getSavedPosts() while preserving global post integrity', async () => {
    const initialSaved = await adapter.getSavedPosts();
    const targetPostId = initialSaved.data[0].id;
    const initialCount = initialSaved.data.length;

    // Toggle save to un-save
    const toggleRes = await adapter.toggleSavePost(targetPostId);
    expect(toggleRes.is_saved).toBe(false);

    // Verify target post is no longer returned by getSavedPosts()
    const updatedSaved = await adapter.getSavedPosts();
    expect(updatedSaved.data.length).toBe(initialCount - 1);
    expect(updatedSaved.data.some((p) => p.id === targetPostId)).toBe(false);

    // Verify post itself still exists in the overall system and can be fetched by ID
    const postRecord = await adapter.getPost(targetPostId);
    expect(postRecord.id).toBe(targetPostId);
    expect(postRecord.is_saved).toBe(false);
  });

  it('8. toggling save again re-saves the post (Undo action) and restores it in getSavedPosts()', async () => {
    const initialSaved = await adapter.getSavedPosts();
    const targetPostId = initialSaved.data[0].id;
    const initialCount = initialSaved.data.length;

    // 1. Un-save
    await adapter.toggleSavePost(targetPostId);
    const afterUnsave = await adapter.getSavedPosts();
    expect(afterUnsave.data.length).toBe(initialCount - 1);

    // 2. Undo: Re-save
    const undoRes = await adapter.toggleSavePost(targetPostId);
    expect(undoRes.is_saved).toBe(true);

    // 3. Verify restored
    const afterUndo = await adapter.getSavedPosts();
    expect(afterUndo.data.length).toBe(initialCount);
    expect(afterUndo.data.some((p) => p.id === targetPostId)).toBe(true);
  });
});

describe('Screen 8 — Saved Collections: Profile Saved Tab Integration & Privacy Boundaries', () => {
  it('9. ProfileTabs conditionally displays Saved tab for self (isSelf = true) with accurate count', () => {
    const htmlSelf = renderToString(
      <ProfileTabs
        activeTab="saved"
        onTabChange={() => {}}
        isSelf={true}
        counts={{ all: 10, discussions: 6, visual: 4, saved: 7 }}
      />
    );

    expect(htmlSelf).toContain('Saved');
    expect(htmlSelf).toContain('7');
    expect(htmlSelf).toContain('aria-selected="true"');
  });

  it('10. ProfileTabs strictly omits Saved tab when viewing another user profile (isSelf = false)', () => {
    const htmlOther = renderToString(
      <ProfileTabs
        activeTab="all"
        onTabChange={() => {}}
        isSelf={false}
        counts={{ all: 28, discussions: 20, visual: 8 }}
      />
    );

    expect(htmlOther).not.toContain('Saved');
    expect(htmlOther).toContain('All');
    expect(htmlOther).toContain('Discussions');
    expect(htmlOther).toContain('Visual Pins');
  });

  it('10b. UserProfilePage renders for self on /u/alex_dev without runtime exceptions', () => {
    const html = renderToString(
      <ThemeProvider>
        <RouterProvider initialPath="/u/alex_dev">
          <UserProfilePage />
        </RouterProvider>
      </ThemeProvider>
    );
    expect(html).toBeDefined();
    expect(html).toContain('profile-skeleton');
  });
});

describe('Screen 8 — Saved Collections: Live Client Contract & Honest Error Handling', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('11. LiveClient calls /api/v1/posts/saved with mapped query parameters', async () => {
    let requestedUrl = '';
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      requestedUrl = url;
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: [],
          has_more: false,
        }),
      } as any;
    });

    const liveClient = new LiveClient('http://localhost:3000');
    await liveClient.getSavedPosts({
      type: 'discussions',
      communitySlug: 'hardware',
      query: 'cooling',
      sort: 'top',
      limit: 20,
    });

    expect(requestedUrl).toContain('/api/v1/posts/saved');
    expect(requestedUrl).toContain('type=discussions');
    expect(requestedUrl).toContain('community=hardware');
    expect(requestedUrl).toContain('q=cooling');
    expect(requestedUrl).toContain('sort=top');
    expect(requestedUrl).toContain('limit=20');
  });

  it('12. LiveClient throws ApiClientError on 404/500 with zero silent fallback to mock data', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          type: 'https://socialgraph.dev/errors/not-found',
          title: 'Not Found',
          status: 404,
          detail: 'Route GET /api/v1/posts/saved not found',
          code: 'ROUTE_NOT_FOUND',
          timestamp: new Date().toISOString(),
        }),
      } as any;
    });

    const liveClient = new LiveClient('http://localhost:3000');

    await expect(liveClient.getSavedPosts()).rejects.toThrow(ApiClientError);

    try {
      await liveClient.getSavedPosts();
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiClientError);
      expect(err.problem.status).toBe(404);
      expect(err.problem.code).toBe('ROUTE_NOT_FOUND');
      expect(err.problem.detail).toContain('Route GET /api/v1/posts/saved not found');
    }
  });
});

describe('Screen 8 — Saved Collections: UI Page Rendering & Shell Navigation', () => {
  it('13. renders SavedCollectionsPage shell with header, format tabs, search, and sort controls', () => {
    const html = renderToString(
      <ThemeProvider>
        <RouterProvider initialPath="/saved">
          <SavedCollectionsPage />
        </RouterProvider>
      </ThemeProvider>
    );

    expect(html).toContain('saved-collections-page');
    expect(html).toContain('Saved Collections');
    expect(html).toContain('Personal curation library');
    expect(html).toContain('Discussions');
    expect(html).toContain('Visual Pins');
    expect(html).toContain('Search saved posts, authors, tags...');
    expect(html).toContain('saved-sort');
  });

  it('14. SidebarNav and TopHeader provide direct accessible navigation links to /saved', () => {
    const sidebarHtml = renderToString(
      <RouterProvider initialPath="/saved">
        <SidebarNav />
      </RouterProvider>
    );
    expect(sidebarHtml).toContain('href="/saved"');
    expect(sidebarHtml).toContain('Saved');

    const topHeaderHtml = renderToString(
      <ThemeProvider>
        <RouterProvider initialPath="/saved">
          <TopHeader />
        </RouterProvider>
      </ThemeProvider>
    );
    expect(topHeaderHtml).toBeDefined();
    expect(topHeaderHtml).toContain('u/alex_dev');
  });

  it('15. DiscussionPostCard and VisualPinCard render active saved bookmark state', () => {
    const disc = mockDiscussionPosts[0];
    const pin = mockVisualPins[0];

    const discHtml = renderToString(
      <RouterProvider initialPath="/saved">
        <DiscussionPostCard
          post={{ ...disc, is_saved: true }}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );
    // Saved button is rendered with active filled bookmark and Saved label
    expect(discHtml).toContain('Saved');
    expect(discHtml).toContain('fill-current text-primary');

    const pinHtml = renderToString(
      <RouterProvider initialPath="/saved">
        <VisualPinCard
          post={{ ...pin, is_saved: true }}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );
    expect(pinHtml).toContain('Saved');
    expect(pinHtml).toContain('aria-label="Unsave pin"');
  });
});
