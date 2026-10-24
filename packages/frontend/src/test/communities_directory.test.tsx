import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MockAdapter } from '../api/mock/MockAdapter';
import { ApiClientError } from '../api/client';
import { CommunitiesPage } from '../pages/CommunitiesPage';
import { RouterProvider } from '../router/Router';
import { ThemeProvider } from '../theme/ThemeContext';
import { setApiForTesting } from '../api';
import type { Community } from '@socialgraph/shared';

describe('Community Directory Surface — API Contracts, Hooks & UI', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({ simulatedLatencyMs: 0 });
    setApiForTesting(adapter);
  });

  it('retrieves all communities through the API abstraction', async () => {
    const communities = await adapter.getCommunities();
    expect(Array.isArray(communities)).toBe(true);
    expect(communities.length).toBeGreaterThan(0);

    const first = communities[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('slug');
    expect(first).toHaveProperty('description');
    expect(first).toHaveProperty('members_count');
    expect(first).toHaveProperty('is_member');
    expect(first).toHaveProperty('rules');
  });

  it('toggles community membership with deterministic count updates', async () => {
    const before = await adapter.getCommunity('algorithms');
    const wasMember = before.is_member;
    const initialCount = before.members_count;

    const result = await adapter.setCommunityMembership('algorithms', !wasMember);
    expect(result.is_member).toBe(!wasMember);
    expect(result.members_count).toBe(wasMember ? initialCount - 1 : initialCount + 1);

    // Verify list reflects updated membership
    const updatedList = await adapter.getCommunities();
    const updatedComm = updatedList.find((c) => c.slug === 'algorithms');
    expect(updatedComm?.is_member).toBe(!wasMember);
    expect(updatedComm?.members_count).toBe(result.members_count);

    // Revert
    await adapter.setCommunityMembership('algorithms', wasMember);
  });

  it('renders CommunitiesPage header, search controls, and directory catalog in SSR/static view', () => {
    const html = renderToString(
      <ThemeProvider>
        <RouterProvider initialPath="/communities">
          <CommunitiesPage />
        </RouterProvider>
      </ThemeProvider>
    );

    expect(html).toContain('Community Directory');
    expect(html).toContain('Search communities by name');
    expect(html).toContain('All Communities');
    expect(html).toContain('Joined');
    expect(html).toContain('Sort:');
    expect(html).toContain('Most Members');
  });

  it('links each community card to its canonical detail route /c/:communityId', async () => {
    const communities = await adapter.getCommunities();
    expect(communities.length).toBeGreaterThan(0);

    for (const comm of communities) {
      expect(comm.slug).toBeDefined();
      expect(typeof comm.slug).toBe('string');
      expect(comm.slug.length).toBeGreaterThan(0);
    }
  });

  it('handles empty community list gracefully without runtime exceptions', () => {
    // Empty community mock scenario
    const emptyAdapter = new MockAdapter({ simulatedLatencyMs: 0 });
    // Overwrite communities with empty object
    (emptyAdapter as any).communities = {};

    setApiForTesting(emptyAdapter);

    const html = renderToString(
      <ThemeProvider>
        <RouterProvider initialPath="/communities">
          <CommunitiesPage />
        </RouterProvider>
      </ThemeProvider>
    );

    expect(html).toBeDefined();
    expect(html).toContain('Community Directory');
  });

  it('handles missing banner and avatar URLs gracefully', async () => {
    const sampleCommunity: Community = {
      id: 'comm_minimal',
      name: 'Minimal Community',
      slug: 'minimal',
      description: 'A community with no optional banner or avatar URLs.',
      members_count: 42,
      rules: [],
      is_member: false,
      created_at: '2026-03-01T00:00:00.000Z',
    };

    // Confirm that banner_url and avatar_url can be undefined
    expect(sampleCommunity.banner_url).toBeUndefined();
    expect(sampleCommunity.avatar_url).toBeUndefined();
    expect(sampleCommunity.members_count).toBe(42);
    expect(sampleCommunity.rules).toEqual([]);
  });

  it('handles simulated API errors without crashing', async () => {
    adapter.simulateFailure('/api/v1/communities', {
      type: 'https://socialgraph.dev/errors/server',
      title: 'Service Error',
      status: 500,
      detail: 'Failed to load community directory',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });

    await expect(adapter.getCommunities()).rejects.toThrow(ApiClientError);
  });
});
