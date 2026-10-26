import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { RouterProvider } from '../router/Router';
import { ThemeProvider } from '../theme/ThemeContext';
import { AuthProvider } from '../auth/AuthContext';
import { GraphPage } from '../pages/GraphPage';
import { MockAdapter } from '../api/mock/MockAdapter';
import { setApiForTesting } from '../api';

describe('Interactive Social Graph & Network Neighborhood Suite', () => {
  let mockApi: MockAdapter;

  beforeEach(() => {
    mockApi = new MockAdapter({ simulatedLatencyMs: 0 });
    setApiForTesting(mockApi);
  });

  it('1. MockAdapter resolves bounded neighborhood data with nodes, center, and edges', async () => {
    const data = await mockApi.getGraphNeighborhood(15);
    expect(data.center).toBeDefined();
    expect(data.center.username).toBe('alex_dev');
    expect(data.nodes.length).toBeGreaterThan(0);
    expect(data.edges.length).toBeGreaterThan(0);
    expect(data.edges[0]).toHaveProperty('source');
    expect(data.edges[0]).toHaveProperty('target');
  });

  it('2. GraphPage renders initial loading skeleton with role and aria attributes', () => {
    const html = renderToString(
      <ThemeProvider>
        <RouterProvider initialPath="/graph">
          <AuthProvider>
            <GraphPage />
          </AuthProvider>
        </RouterProvider>
      </ThemeProvider>
    );

    expect(html).toContain('Social Graph');
    expect(html).toContain('data-testid="graph-loading"');
    expect(html).toContain('aria-busy="true"');
  });

  it('3. Graph contracts correctly differentiate between mutual and directed relationships', async () => {
    const data = await mockApi.getGraphNeighborhood(20);
    const centerId = data.center.id;

    // Center has outbound and inbound edges
    const centerOut = data.edges.filter((e) => e.source === centerId);
    const centerIn = data.edges.filter((e) => e.target === centerId);

    expect(centerOut.length).toBeGreaterThan(0);
    expect(centerIn.length).toBeGreaterThan(0);

    // Some connections are mutual
    const outTargets = new Set(centerOut.map((e) => e.target));
    const mutuals = centerIn.filter((e) => outTargets.has(e.source));
    expect(mutuals.length).toBeGreaterThanOrEqual(1);
  });
});
