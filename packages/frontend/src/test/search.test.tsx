import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MockAdapter } from '../api/mock/MockAdapter';
import { mockUsers, mockCommunities } from '../api/mock/fixtures';
import {
  SearchHeader,
  SearchTabs,
  UserSearchResultCard,
  CommunitySearchResultCard,
  SearchEmptyState,
  SearchSkeleton,
} from '../components/search';
import { SearchPage } from '../pages/SearchPage';
import { RouterProvider } from '../router/Router';
import { ThemeProvider } from '../theme/ThemeContext';

describe('Screen 6 — Universal Search: API Contracts & Data Layer', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({ simulatedLatencyMs: 0 });
  });

  it('returns empty result set when query is blank or whitespace', async () => {
    const res = await adapter.search({ q: '' });
    expect(res.total_count).toBe(0);
    expect(res.discussions).toHaveLength(0);
    expect(res.visuals).toHaveLength(0);
    expect(res.communities).toHaveLength(0);
    expect(res.users).toHaveLength(0);

    const spaceRes = await adapter.search({ q: '   ' });
    expect(spaceRes.total_count).toBe(0);
  });

  it('matches across discussions, communities, and people for multi-entity term "systems"', async () => {
    const res = await adapter.search({ q: 'systems', category: 'all' });
    expect(res.total_count).toBeGreaterThan(0);

    // Should find the "Distributed Systems" community
    const foundCommunity = res.communities.find((c) => c.slug === 'systems');
    expect(foundCommunity).toBeDefined();
    expect(foundCommunity?.name).toBe('Distributed Systems');

    // Should find users with systems in bio (e.g. Lucas Thorne)
    const foundUser = res.users.find((u) => u.username === 'lucas_t');
    expect(foundUser).toBeDefined();

    // Should find discussion posts discussing distributed systems
    expect(res.discussions.length).toBeGreaterThan(0);
  });

  it('correctly filters to discussions only when category="discussions"', async () => {
    const res = await adapter.search({ q: 'cache', category: 'discussions' });
    expect(res.discussions.length).toBeGreaterThan(0);
    expect(res.visuals).toHaveLength(0);
    expect(res.communities).toHaveLength(0);
    expect(res.users).toHaveLength(0);
    expect(res.total_count).toBe(res.discussions.length);
  });

  it('correctly filters to visual pins only when category="visual"', async () => {
    const res = await adapter.search({ q: 'concrete', category: 'visual' });
    expect(res.visuals.length).toBeGreaterThan(0);
    expect(res.discussions).toHaveLength(0);
    expect(res.communities).toHaveLength(0);
    expect(res.users).toHaveLength(0);
    expect(res.total_count).toBe(res.visuals.length);
  });

  it('correctly filters to communities only when category="communities"', async () => {
    const res = await adapter.search({ q: 'algorithms', category: 'communities' });
    expect(res.communities.length).toBeGreaterThan(0);
    expect(res.discussions).toHaveLength(0);
    expect(res.visuals).toHaveLength(0);
    expect(res.users).toHaveLength(0);
    expect(res.communities[0].slug).toBe('algorithms');
  });

  it('correctly filters to people only when category="people"', async () => {
    const res = await adapter.search({ q: 'elena', category: 'people' });
    expect(res.users.length).toBeGreaterThan(0);
    expect(res.discussions).toHaveLength(0);
    expect(res.visuals).toHaveLength(0);
    expect(res.communities).toHaveLength(0);
    expect(res.users[0].username).toBe('elena_arch');
  });

  it('sorts discussions by top score descending when sort="top"', async () => {
    const res = await adapter.search({ q: 'invalidation', category: 'discussions', sort: 'top' });
    expect(res.discussions.length).toBeGreaterThan(1);
    for (let i = 1; i < res.discussions.length; i++) {
      expect(res.discussions[i - 1].score).toBeGreaterThanOrEqual(res.discussions[i].score);
    }
  });

  it('sorts discussions by newest date descending when sort="new"', async () => {
    const res = await adapter.search({ q: 'invalidation', category: 'discussions', sort: 'new' });
    expect(res.discussions.length).toBeGreaterThan(1);
    for (let i = 1; i < res.discussions.length; i++) {
      const prevDate = new Date(res.discussions[i - 1].created_at).getTime();
      const currDate = new Date(res.discussions[i].created_at).getTime();
      expect(prevDate).toBeGreaterThanOrEqual(currDate);
    }
  });

  it('prioritizes exact title/name matches over body matches when sort="relevance"', async () => {
    const res = await adapter.search({ q: 'Distributed Systems', category: 'communities', sort: 'relevance' });
    expect(res.communities.length).toBeGreaterThan(0);
    expect(res.communities[0].name).toBe('Distributed Systems');
  });
});

describe('Screen 6 — Universal Search: UI Components & States', () => {
  it('renders SearchHeader with input, search button, and trending topics', () => {
    const html = renderToString(
      <SearchHeader
        query="consensus"
        onQueryChange={() => {}}
        onSubmit={() => {}}
      />
    );

    expect(html).toContain('consensus');
    expect(html).toContain('Search');
    expect(html).toContain('Trending:');
    expect(html).toContain('Distributed Systems');
    expect(html).toContain('Cache Invalidation');
  });

  it('renders SearchTabs with category pills, live counts, and sort selector', () => {
    const html = renderToString(
      <SearchTabs
        activeCategory="discussions"
        onCategoryChange={() => {}}
        sort="top"
        onSortChange={() => {}}
        counts={{
          all: 10,
          discussions: 4,
          visual: 2,
          communities: 2,
          people: 2,
        }}
      />
    );

    expect(html).toContain('Discussions');
    expect(html).toContain('Visual Pins');
    expect(html).toContain('Communities');
    expect(html).toContain('People');
    expect(html).toContain('4');
    expect(html).toContain('Top Ranked');
    expect(html).toContain('aria-selected="true"');
  });

  it('renders UserSearchResultCard with profile link, handle, bio, and follow button', () => {
    const user = mockUsers.usr_1;
    const html = renderToString(
      <RouterProvider initialPath="/search">
        <UserSearchResultCard user={user} />
      </RouterProvider>
    );

    expect(html).toContain('Lucas Thorne');
    expect(html).toContain('@lucas_t');
    expect(html).toContain('href="/u/lucas_t"');
    expect(html).toContain('followers');
    expect(html).toContain('Following');
  });

  it('renders CommunitySearchResultCard with slug, member count, and visit link', () => {
    const comm = mockCommunities.systems;
    const html = renderToString(
      <RouterProvider initialPath="/search">
        <CommunitySearchResultCard community={comm} />
      </RouterProvider>
    );

    expect(html).toContain('Distributed Systems');
    expect(html).toContain('c/systems');
    expect(html).toContain('href="/c/systems"');
    expect(html).toContain('members');
    expect(html).toContain('Visit hub');
  });

  it('renders SearchEmptyState with clear button and helpful exploration chips', () => {
    const html = renderToString(
      <SearchEmptyState
        query="nonexistent_xyz"
        category="all"
        onClear={() => {}}
        onSuggestionClick={() => {}}
      />
    );

    expect(html).toContain('No results found for');
    expect(html).toContain('nonexistent_xyz');
    expect(html).toContain('Clear search');
    expect(html).toContain('Try searching for:');
  });

  it('renders SearchSkeleton with aria-busy="true"', () => {
    const html = renderToString(<SearchSkeleton category="all" />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('Loading search results');
  });
});

describe('Screen 6 — Universal Search: Page Integration & Routing', () => {
  it('renders initial exploration canvas when visited without a query', () => {
    const html = renderToString(
      <ThemeProvider>
        <RouterProvider initialPath="/search">
          <SearchPage />
        </RouterProvider>
      </ThemeProvider>
    );

    expect(html).toContain('Search across SocialGraph');
    expect(html).toContain('Universal Discovery');
    expect(html).toContain('Suggested Searches');
    expect(html).toContain('Distributed Systems');
    expect(html).toContain('search-initial-state');
  });

  it('renders search results layout when visited with ?q=systems in URL', () => {
    const html = renderToString(
      <ThemeProvider>
        <RouterProvider initialPath="/search?q=systems">
          <SearchPage />
        </RouterProvider>
      </ThemeProvider>
    );

    expect(html).toContain('search-sort-select');
    expect(html).toContain('Discussions');
    expect(html).toContain('Communities');
    expect(html).toContain('People');
  });

  it('renders discussions tab view when visited with ?q=systems&category=discussions', () => {
    const html = renderToString(
      <ThemeProvider>
        <RouterProvider initialPath="/search?q=systems&category=discussions">
          <SearchPage />
        </RouterProvider>
      </ThemeProvider>
    );

    expect(html).toContain('Discussions');
    expect(html).toContain('aria-selected="true"');
  });
});
