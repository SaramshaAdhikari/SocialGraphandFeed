import { useState, useEffect } from 'react';
import { Activity, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Server, Database, Zap } from 'lucide-react';
import { api } from '../../api';
import type { HealthStatus } from '@socialgraph/shared';
import { Button } from '../ui/Button';

export function DiagnosticsView() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchHealth();
  }, []);

  return (
    <section className="bg-surface-card rounded-2xl border border-border shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Core Foundation Diagnostics</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-text-muted">Real-time connectivity to Fastify, MongoDB, and Redis</p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  api.dataSource === 'mock'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                }`}
              >
                Data Source: {api.dataSource.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <Button
          onClick={() => void fetchHealth()}
          isLoading={loading}
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw size={14} />}
        >
          Refresh Status
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2 mb-6">
          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {health && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fastify Backend */}
          <div className="p-4 rounded-xl bg-surface-subtle border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-4 h-4 text-text-secondary" /> Fastify Backend
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xl font-bold text-text-primary">v{health.version}</p>
            <p className="text-xs text-text-muted mt-1">Uptime: {health.uptime_seconds}s</p>
          </div>

          {/* MongoDB */}
          <div className="p-4 rounded-xl bg-surface-subtle border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-500" /> MongoDB Store
              </span>
              {health.services.mongodb.status === 'connected' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
            <p className="text-xl font-bold capitalize text-text-primary">
              {health.services.mongodb.status}
            </p>
            <p className="text-xs text-text-muted mt-1">
              Latency: {health.services.mongodb.latency_ms ?? 'N/A'} ms
            </p>
          </div>

          {/* Redis */}
          <div className="p-4 rounded-xl bg-surface-subtle border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" /> Redis Cache
              </span>
              {health.services.redis.status === 'connected' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <p className="text-xl font-bold capitalize text-text-primary">
              {health.services.redis.status}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {health.services.redis.status === 'connected'
                ? `Latency: ${health.services.redis.latency_ms ?? 'N/A'} ms`
                : 'Degraded Fallback Active'}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default DiagnosticsView;
