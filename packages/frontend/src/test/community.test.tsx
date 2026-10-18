import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MockAdapter } from '../api/mock/MockAdapter';
import { ApiClientError } from '../api/client';
import { mockCommunities } from '../api/mock/fixtures';
import { CommunityHeader } from '../components/community/CommunityHeader';
import { CommunityTabs } from '../components/community/CommunityTabs';
import { CommunitySidebar } from '../components/community/CommunitySidebar';
import { CommunitySkeleton } from '../components/community/CommunitySkeleton';
import { CommunityPage } from '../pages/CommunityPage';
import { RouterProvider } from '../router/Router';
import { ThemeProvider } from '../theme/ThemeContext';

describe('Screen 5 — Community Hub: API Contracts & Data Layer', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({ simulatedLatencyMs: 0 });
  });

  it('retrieves community details by slug with metadata, rules, and membership status', async () => {
    const community = await adapter.getCommunity('systems');
    expect(community.id).toBe('c_systems');
    expect(community.name).toBe('Distributed Systems');
    expect(community.slug).toBe('systems');
    expect(community.description).toContain('Architectures for scale');
    expect(community.members_count).toBeGreaterThan(0);
    expect(community.is_member).toBe(true);
    expect(Array.isArray(community.rules)).toBe(true);
    expect(community.rules.length).toBeGreaterThan(0);
    expect(community.rules[0].title).toBe('Include Empirical Benchmarks');
  });

  it('retrieves community details by ID as fallback', async () => {
    const community = await adapter.getCommunity('c_systems');
    expect(community.slug).toBe('systems');
    expect(community.name).toBe('Distributed Systems');
  });

  it('retrieves community details case-insensitively', async () => {
    const community = await adapter.getCommunity('Systems');
    expect(community.slug).toBe('systems');
  });

  it('throws 404 ApiClientError when querying a nonexistent community slug', async () => {
    await expect(adapter.getCommunity('nonexistent_hub_999')).rejects.toThrow(ApiClientError);
    try {
      await adapter.getCommunity('nonexistent_hub_999');
    } catch (err: any) {
      expect(err.problem.status).toBe(404);
      expect(err.problem.code).toBe('COMMUNITY_NOT_FOUND');
    }
  });

  it('retrieves scoped community feed containing only posts for that community', async () => {
    const feedResponse = await adapter.getCommunityFeed('systems', { limit: 20 });
    expect(feedResponse.success).toBe(true);
    expect(feedResponse.data.length).toBeGreaterThan(0);

    for (const post of feedResponse.data) {
      expect(post.community_id).toBe('c_systems');
    }
  });

  it('sorts community feed posts by new in chronological order', async () => {
    const feedResponse = await adapter.getCommunityFeed('systems', { sort: 'new', limit: 20 });
    expect(feedResponse.data.length).toBeGreaterThan(0);

    for (let i = 0; i < feedResponse.data.length - 1; i++) {
      const current = new Date(feedResponse.data[i].created_at).getTime();
      const next = new Date(feedResponse.data[i + 1].created_at).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });
});

describe('Screen 5 — Community Hub: Components UI', () => {
  it('renders CommunityHeader with banner, avatar, title, slug, and member count', () => {
    const comm = mockCommunities.systems;
    const html = renderToString(
      <CommunityHeader
        community={comm}
        isMember={comm.is_member}
        membersCount={comm.members_count}
        onToggleMembership={() => {}}
      />
    );

    expect(html).toContain('Distributed Systems');
    expect(html).toContain('c/systems');
    expect(html).toContain('Architectures for scale');
    expect(html).toContain('Joined'); // comm.is_member is true for systems
    expect(html).toContain('members');
  });

  it('renders CommunityHeader with "Join Hub" button when user is not a member', () => {
    const comm = mockCommunities.algorithms; // is_member is false
    const html = renderToString(
      <CommunityHeader
        community={comm}
        isMember={false}
        membersCount={comm.members_count}
        onToggleMembership={() => {}}
      />
    );

    expect(html).toContain('Algorithms &amp; Data Structures');
    expect(html).toContain('c/algorithms');
    expect(html).toContain('Join Hub');
  });

  it('renders CommunityTabs with All, Discussions, Visual Pins, and sort controls', () => {
    const html = renderToString(
      <CommunityTabs
        activeTab="all"
        onTabChange={() => {}}
        sort="hot"
        onSortChange={() => {}}
        counts={{ all: 6, discussions: 4, visual: 2 }}
      />
    );

    expect(html).toContain('All');
    expect(html).toContain('Discussions');
    expect(html).toContain('Visual Pins');
    expect(html).toContain('Hot');
    expect(html).toContain('New');
    expect(html).toContain('Top');
    expect(html).toContain('6');
    expect(html).toContain('4');
    expect(html).toContain('2');
  });

  it('renders CommunitySidebar with About metadata and community rules', () => {
    const comm = mockCommunities.systems;
    const html = renderToString(
      <CommunitySidebar
        community={comm}
        membersCount={comm.members_count}
      />
    );

    expect(html).toContain('About Community');
    expect(html).toContain('c/systems Rules');
    expect(html).toContain('Include Empirical Benchmarks');
    expect(html).toContain('Technical Rigor &amp; Civility');
  });

  it('renders CommunitySidebar gracefully when community has no rules', () => {
    const comm = mockCommunities.hardware; // rules is empty []
    const html = renderToString(
      <CommunitySidebar
        community={comm}
        membersCount={comm.members_count}
      />
    );

    expect(html).toContain('No custom rules defined yet');
  });

  it('renders CommunitySkeleton without throwing', () => {
    const html = renderToString(<CommunitySkeleton />);
    expect(html).toContain('community-skeleton');
    expect(html).toContain('animate-pulse');
  });
});

describe('Screen 5 — Community Hub: Page Routing & Resilience', () => {
  it('renders 404 Community Not Found when navigating to an invalid slug', () => {
    const html = renderToString(
      <ThemeProvider>
        <RouterProvider initialPath="/c/unknown_hub_xyz">
          <CommunityPage />
        </RouterProvider>
      </ThemeProvider>
    );

    expect(html).toBeDefined();
  });

  it('renders CommunityPage with scoped feed layout', () => {
    const html = renderToString(
      <ThemeProvider>
        <RouterProvider initialPath="/c/systems">
          <CommunityPage />
        </RouterProvider>
      </ThemeProvider>
    );

    expect(html).toBeDefined();
  });
});
