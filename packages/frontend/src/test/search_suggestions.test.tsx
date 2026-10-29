import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { SearchSuggestionsOverlay } from '../components/search/SearchSuggestionsOverlay';
import { RouterProvider } from '../router/Router';
import { ThemeProvider } from '../theme/ThemeContext';
import { AuthProvider } from '../auth/AuthContext';
import { MockAdapter } from '../api/mock/MockAdapter';

function renderOverlay(query: string, isOpen: boolean) {
  return renderToString(
    <AuthProvider initialUser={null}>
      <ThemeProvider>
        <RouterProvider initialPath="/">
          <SearchSuggestionsOverlay
            query={query}
            isOpen={isOpen}
            onClose={() => {}}
            onSelect={() => {}}
          />
        </RouterProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

describe('Phase E6: Search Suggestions Overlay', () => {
  let mockApi: MockAdapter;

  beforeEach(() => {
    mockApi = new MockAdapter({ simulatedLatencyMs: 0 });
  });

  it('does not render overlay when query length is less than 2', () => {
    const html = renderOverlay('a', true);
    expect(html).toBe('');
  });

  it('does not render overlay when isOpen is false', () => {
    const html = renderOverlay('alex', false);
    expect(html).toBe('');
  });

  it('renders search suggestions overlay with accessibility attributes when open', () => {
    const html = renderOverlay('alex', true);
    expect(html).toContain('data-testid="search-suggestions-overlay"');
    expect(html).toContain('role="listbox"');
  });

  it('MockAdapter search returns categorized results for queries', async () => {
    const results = await mockApi.search({ q: 'dev', limit: 5 });
    expect(results.query).toBe('dev');
    expect(results.users).toBeDefined();
    expect(results.communities).toBeDefined();
    expect(results.discussions).toBeDefined();
    expect(results.visuals).toBeDefined();
    expect(typeof results.total_count).toBe('number');
  });
});
