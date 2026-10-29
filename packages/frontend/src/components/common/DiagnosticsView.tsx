import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Server,
  Database,
  Zap,
  Radio,
  Clock,
  Cpu,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../api';
import type { HealthStatus } from '@socialgraph/shared';
import { Button } from '../ui/Button';

interface HealthLogEntry {
  id: string;
  timestamp: string;
  status: 'ok' | 'degraded' | 'error';
  mongoLatency?: number;
  redisLatency?: number;
}

export function DiagnosticsView() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<{
    uptime_seconds: number;
    node_version: string;
    memory?: { rss_mb: number; heap_used_mb: number; heap_total_mb: number };
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [latencyHistory, setLatencyHistory] = useState<HealthLogEntry[]>([]);

  const fetchHealthAndMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthData, metricsData] = await Promise.all([
        api.getHealth(),
        api.getMetrics().catch(() => null),
      ]);

      setHealth(healthData);
      if (metricsData) {
        setMetrics(metricsData);
      }
      const now = new Date();
      setLastChecked(now);

      // Add to rolling latency history (max 8 entries)
      setLatencyHistory((prev) => {
        const newEntry: HealthLogEntry = {
          id: `check_${Date.now()}`,
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          status: healthData.status,
          mongoLatency: healthData.services?.mongodb?.latency_ms,
          redisLatency: healthData.services?.redis?.latency_ms,
        };
        return [newEntry, ...prev.slice(0, 7)];
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHealthAndMetrics();
  }, [fetchHealthAndMetrics]);

  // Auto-refresh interval (every 10s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      void fetchHealthAndMetrics();
    }, 10_000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchHealthAndMetrics]);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const isMongoConnected = health?.services?.mongodb?.status === 'connected';
  const isRedisConnected = health?.services?.redis?.status === 'connected';
  const isDegraded = health?.status === 'degraded' || (!isRedisConnected && isMongoConnected);
  const isCritical = health?.status === 'error' || !isMongoConnected;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fade-in" data-testid="diagnostics-view">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-surface-card rounded-2xl sm:rounded-3xl border border-border shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary tracking-tight">
              Operational Health &amp; Diagnostics
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Real-time telemetry, live dependency latency, and infrastructure status
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              autoRefresh
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-surface-subtle border-border text-text-muted hover:text-text-primary'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-text-muted'}`} />
            Auto-refresh {autoRefresh ? '(10s)' : '(Off)'}
          </button>

          <Button
            onClick={() => void fetchHealthAndMetrics()}
            isLoading={loading}
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}
            className="text-xs font-semibold"
          >
            Refresh Now
          </Button>
        </div>
      </div>

      {/* 2. Top Overview Status Banner */}
      {health && (
        <div
          role="region"
          aria-label="Platform Status Summary"
          className={`p-5 rounded-2xl sm:rounded-3xl border transition-all ${
            isCritical
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
              : isDegraded
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {isCritical ? (
                <XCircle className="w-6 h-6 text-rose-500 shrink-0" />
              ) : isDegraded ? (
                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              )}
              <div>
                <h2 className="text-sm sm:text-base font-bold text-text-primary">
                  {isCritical
                    ? 'Critical Platform Incident Detected'
                    : isDegraded
                    ? 'Degraded Performance — Graceful Fallback Mode Active'
                    : 'All Core Platform Services Operational'}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {isCritical
                    ? 'Primary database connectivity lost. Immediate attention required.'
                    : isDegraded
                    ? 'Redis cache unavailable. Operating safely in in-memory degraded mode.'
                    : 'All backend APIs, MongoDB replica set, and Redis cache responding normally.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-text-muted shrink-0">
              <span className="flex items-center gap-1 font-mono">
                <Clock size={13} />
                {lastChecked ? `Checked ${lastChecked.toLocaleTimeString()}` : 'Checking...'}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  api.dataSource === 'mock'
                    ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                }`}
              >
                {api.dataSource} MODE
              </span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2.5">
          <XCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">Failed to retrieve diagnostics telemetry: {error}</span>
        </div>
      )}

      {/* 3. Primary Core Services Grid */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* Service 1: Fastify Node.js Backend */}
          <div className="p-5 rounded-2xl sm:rounded-3xl bg-surface-card border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" /> Fastify Backend
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ONLINE
              </span>
            </div>

            <div>
              <p className="text-2xl font-black text-text-primary tracking-tight font-mono">
                v{health.version}
              </p>
              <p className="text-xs text-text-muted mt-1 flex items-center gap-1.5 font-mono">
                <Cpu size={12} /> {metrics?.node_version || 'Node.js'} • Uptime: {formatUptime(health.uptime_seconds)}
              </p>
            </div>

            {metrics?.memory && (
              <div className="space-y-1.5 pt-2 border-t border-border/60">
                <div className="flex justify-between text-[11px] text-text-muted font-mono">
                  <span>Heap: {metrics.memory.heap_used_mb} MB</span>
                  <span>Total: {metrics.memory.heap_total_mb} MB</span>
                </div>
                <div className="h-1.5 w-full bg-surface-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.round((metrics.memory.heap_used_mb / metrics.memory.heap_total_mb) * 100))}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-text-muted font-mono">RSS Memory: {metrics.memory.rss_mb} MB</p>
              </div>
            )}
          </div>

          {/* Service 2: MongoDB Primary Replica Set */}
          <div className="p-5 rounded-2xl sm:rounded-3xl bg-surface-card border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-500" /> MongoDB Store
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isMongoConnected
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-rose-500/10 text-rose-500'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isMongoConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {isMongoConnected ? 'REPLICA SET rs0' : 'DISCONNECTED'}
              </span>
            </div>

            <div>
              <p className="text-2xl font-black text-text-primary tracking-tight font-mono">
                {health.services.mongodb.latency_ms !== undefined
                  ? `${health.services.mongodb.latency_ms} ms`
                  : 'N/A'}
              </p>
              <p className="text-xs text-text-muted mt-1">
                Ping Command Latency ({isMongoConnected ? 'Healthy <10ms' : 'Error'})
              </p>
            </div>

            <div className="pt-2 border-t border-border/60 text-xs text-text-muted space-y-1">
              <div className="flex justify-between">
                <span>Database:</span>
                <span className="font-mono font-bold text-text-primary">socialgraph</span>
              </div>
              <div className="flex justify-between">
                <span>Port:</span>
                <span className="font-mono text-text-secondary">27017 (Local)</span>
              </div>
              {health.services.mongodb.error && (
                <p className="text-[11px] text-rose-500 pt-1 font-mono">{health.services.mongodb.error}</p>
              )}
            </div>
          </div>

          {/* Service 3: Redis In-Memory Cache */}
          <div className="p-5 rounded-2xl sm:rounded-3xl bg-surface-card border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Redis Cache
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isRedisConnected
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-amber-500/10 text-amber-500'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isRedisConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {isRedisConnected ? 'CONNECTED' : 'DEGRADED FALLBACK'}
              </span>
            </div>

            <div>
              <p className="text-2xl font-black text-text-primary tracking-tight font-mono">
                {health.services.redis.latency_ms !== undefined
                  ? `${health.services.redis.latency_ms} ms`
                  : 'Fallback'}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {isRedisConnected ? 'Ping Command Latency' : 'In-memory fallback cache'}
              </p>
            </div>

            <div className="pt-2 border-t border-border/60 text-xs text-text-muted space-y-1">
              <div className="flex justify-between">
                <span>Port:</span>
                <span className="font-mono text-text-secondary">6379</span>
              </div>
              <div className="flex justify-between">
                <span>Mode:</span>
                <span className="font-mono text-text-secondary">
                  {isRedisConnected ? 'Primary Distributed Cache' : 'In-Memory Cache Guard'}
                </span>
              </div>
              {health.services.redis.error && (
                <p className="text-[11px] text-amber-500 pt-1 font-mono">{health.services.redis.error}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Realtime Transport & Security Architecture Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <div className="p-5 rounded-2xl sm:rounded-3xl bg-surface-card border border-border shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-wider">
            <Radio className="w-4 h-4 text-primary" /> Real-time Transport (SSE)
          </div>
          <div className="space-y-2 text-xs text-text-secondary">
            <p className="leading-relaxed">
              Real-time messaging, notifications, and timeline invalidations are delivered via Server-Sent Events (SSE) at endpoint <code className="px-1.5 py-0.5 rounded bg-surface-subtle font-mono text-primary">/api/v1/realtime/events</code>.
            </p>
            <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2.5 rounded-xl bg-surface-subtle border border-border/60">
                <span className="text-text-muted block">Keep-Alive Heartbeat:</span>
                <span className="font-bold text-text-primary">Every 20 seconds</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-subtle border border-border/60">
                <span className="text-text-muted block">Reconnection:</span>
                <span className="font-bold text-text-primary">Exponential backoff</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl sm:rounded-3xl bg-surface-card border border-border shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Session Security &amp; CSRF Defense
          </div>
          <div className="space-y-2 text-xs text-text-secondary">
            <p className="leading-relaxed">
              Direct state modifications are protected by session-bound CSRF tokens and cross-origin boundary enforcement.
            </p>
            <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2.5 rounded-xl bg-surface-subtle border border-border/60">
                <span className="text-text-muted block">Session Token:</span>
                <span className="font-bold text-text-primary">HttpOnly Cookie</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-subtle border border-border/60">
                <span className="text-text-muted block">CSRF Header:</span>
                <span className="font-bold text-text-primary">x-csrf-token (Verified)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Recent Ping History Log */}
      {latencyHistory.length > 0 && (
        <div className="p-5 rounded-2xl sm:rounded-3xl bg-surface-card border border-border shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Recent Health Check History
            </h3>
            <span className="text-[11px] text-text-muted font-mono">Last {latencyHistory.length} checks</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/60 text-text-muted font-mono text-[11px]">
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">MongoDB Ping</th>
                  <th className="py-2 px-3">Redis Ping</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 font-mono">
                {latencyHistory.map((entry) => (
                  <tr key={entry.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="py-2 px-3 text-text-secondary">{entry.timestamp}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          entry.status === 'ok'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : entry.status === 'degraded'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-rose-500/10 text-rose-500'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-text-primary">
                      {entry.mongoLatency !== undefined ? `${entry.mongoLatency} ms` : 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-text-primary">
                      {entry.redisLatency !== undefined ? `${entry.redisLatency} ms` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiagnosticsView;
