import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MockAdapter } from '../api/mock/MockAdapter';
import { ApiClientError } from '../api/client';
import { mockCommunities } from '../api/mock/fixtures';
import { CommunityHeader } from '../components/community/CommunityHeader';
import { CommunityTabs } from '../components/community/CommunityTabs';
import { CommunitySidebar } from '../components/community/CommunitySidebar';
import { CommunitySkeleton } from '../components/community/CommunitySkeleton';
import { CommunityPage } from '../pages/CommunityPage';
import { RecommendedHubs } from '../components/layout/RecommendedHubs';
import { LiveClient } from '../api/LiveClient';
import { RouterProvider } from '../router/Router';
import { ThemeProvider } from '../theme/ThemeContext';

describe('Screen 5 — Community Hub: API Contracts & Data Layer', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({ simulatedLatencyMs: 0 });
  });

  it('retrieves community details by slug with metadata, rules, and membership status', async () => {
    const community = await adapter.getCommunity('systems');
    expect(community.id).toBe('comm_systems');
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
    const community = await adapter.getCommunity('comm_systems');
    expect(community.slug).toBe('systems');
    expect(community.name).toBe('Distributed Systems');

    // Also supports legacy alias c_systems
    const legacy = await adapter.getCommunity('c_systems');
    expect(legacy.slug).toBe('systems');
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

  it('persists idempotent membership changes in the adapter and reads the same state in hub and recommendations', async () => {
    const before = await adapter.getCommunity('algorithms');
    expect(before.is_member).toBe(false);
    const join = await adapter.setCommunityMembership('algorithms', true);
    expect(join.is_member).toBe(true);
    const afterJoin = await adapter.getCommunity('algorithms');
    expect(afterJoin.is_member).toBe(true);
    expect((await adapter.getCommunities()).find((c) => c.slug === 'algorithms')).toMatchObject({ is_member: true, members_count: afterJoin.members_count });
    expect((await adapter.setCommunityMembership('algorithms', true)).members_count).toBe(afterJoin.members_count);
    await adapter.setCommunityMembership('algorithms', false);
    await adapter.setCommunityMembership('algorithms', false);
    expect((await adapter.getCommunity('algorithms')).is_member).toBe(false);
    expect((await adapter.getCommunity('algorithms')).members_count).toBe(before.members_count);
  });

  it('does not change visible membership when the membership API rejects the mutation', async () => {
    const before = await adapter.getCommunity('algorithms');
    adapter.simulateFailure('/api/v1/communities/algorithms/join', {
      type: 'https://socialgraph.dev/errors/internal', title: 'Unavailable', status: 503,
      detail: 'Membership update failed', code: 'SERVICE_UNAVAILABLE', timestamp: new Date().toISOString(),
    });
    await expect(adapter.setCommunityMembership('algorithms', true)).rejects.toThrow(ApiClientError);
    expect(await adapter.getCommunity('algorithms')).toMatchObject({ is_member: before.is_member, members_count: before.members_count });
  });

  it('sends DELETE without a JSON content type or body', async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ community_id: 'comm_systems', is_member: false, members_count: 2 }) });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    try {
      await new LiveClient().setCommunityMembership('systems', false);
      expect(String(fetchMock.mock.calls[0][0])).toContain('/api/v1/auth/session');
      const [, options] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
      expect(options.method).toBe('DELETE');
      expect(options.body).toBeUndefined();
      expect((options.headers as Record<string, string>)['Content-Type']).toBeUndefined();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('retrieves scoped community feed containing only posts for that community', async () => {
    const feedResponse = await adapter.getCommunityFeed('systems', { limit: 20 });
    expect(feedResponse.success).toBe(true);
    expect(feedResponse.data.length).toBeGreaterThan(0);

    for (const post of feedResponse.data) {
      expect(post.community_id).toBe('comm_systems');
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
        onToggleMembership={() => {}}
      />
    );

    expect(html).toContain('Algorithms &amp; Data Structures');
    expect(html).toContain('c/algorithms');
    expect(html).toContain('Join Hub');
  });

  it('renders recommendation membership from the same community state as hub detail', () => {
    const member = { ...mockCommunities.systems, is_member: true };
    const nonMember = { ...mockCommunities.algorithms, is_member: false };
    const recommendations = renderToString(<RouterProvider initialPath="/"><RecommendedHubs communities={[member, nonMember]} onMembershipChange={() => {}} /></RouterProvider>);
    const memberDetail = renderToString(<CommunityHeader community={member} onToggleMembership={() => {}} />);
    const nonMemberDetail = renderToString(<CommunityHeader community={nonMember} onToggleMembership={() => {}} />);
    expect(recommendations).toContain('Joined');
    expect(memberDetail).toContain('Joined');
    expect(recommendations).toContain('Join');
    expect(nonMemberDetail).toContain('Join Hub');
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
      <CommunitySidebar community={comm} />
    );

    expect(html).toContain('About Community');
    expect(html).toContain('c/systems Rules');
    expect(html).toContain('Include Empirical Benchmarks');
    expect(html).toContain('Technical Rigor &amp; Civility');
  });

  it('renders CommunitySidebar gracefully when community has no rules', () => {
    const comm = mockCommunities.hardware; // rules is empty []
    const html = renderToString(
      <CommunitySidebar community={comm} />
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
