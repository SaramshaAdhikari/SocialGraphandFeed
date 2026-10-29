import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DiagnosticsView } from '../components/common/DiagnosticsView';
import { ThemeProvider } from '../theme/ThemeContext';
import { AuthProvider } from '../auth/AuthContext';
import { RouterProvider } from '../router/Router';
import { MockAdapter } from '../api/mock/MockAdapter';

function renderDiagnostics() {
  return renderToString(
    <AuthProvider initialUser={null}>
      <ThemeProvider>
        <RouterProvider initialPath="/diagnostics">
          <DiagnosticsView />
        </RouterProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

describe('Phase E5: Diagnostics & Operational Truth Dashboard', () => {
  let mockApi: MockAdapter;

  beforeEach(() => {
    mockApi = new MockAdapter({ simulatedLatencyMs: 0 });
  });

  it('renders diagnostics view with operational heading and auto-refresh control', () => {
    const html = renderDiagnostics();
    expect(html).toContain('data-testid="diagnostics-view"');
    expect(html).toContain('Operational Health &amp; Diagnostics');
    expect(html).toContain('Auto-refresh');
    expect(html).toContain('Refresh Now');
  });

  it('MockAdapter getHealth returns structured dependency telemetry', async () => {
    const health = await mockApi.getHealth();
    expect(health.status).toBeDefined();
    expect(health.version).toContain('0.1.0');
    expect(health.services.mongodb).toBeDefined();
    expect(health.services.mongodb.status).toBe('connected');
    expect(typeof health.services.mongodb.latency_ms).toBe('number');
    expect(health.services.redis).toBeDefined();
  });

  it('MockAdapter getMetrics returns uptime and memory breakdown', async () => {
    const metrics = await mockApi.getMetrics();
    expect(typeof metrics.uptime_seconds).toBe('number');
    expect(metrics.node_version).toBeDefined();
    expect(metrics.memory).toBeDefined();
    expect(metrics.memory?.rss_mb).toBeGreaterThan(0);
    expect(metrics.memory?.heap_used_mb).toBeGreaterThan(0);
  });
});
