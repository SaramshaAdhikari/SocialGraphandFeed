import { useEffect, useState } from 'react';
import { api, ApiClientError } from '../../api';
import type { HealthStatus } from '@socialgraph/shared';
import { Activity, Database, Server, Zap, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

export function DiagnosticsView() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        setError(`${err.problem.code}: ${err.problem.detail}`);
      } else {
        setError(err?.message || 'Failed to connect to backend.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <section className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9] mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-[#2563EB]" />
          <div>
            <h1 className="text-lg font-semibold text-[#0F172A]">Core Foundation Diagnostics</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-[#64748B]">Real-time connectivity to Fastify, MongoDB, and Redis</p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  api.dataSource === 'mock'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                Data Source: {api.dataSource.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <Button
          onClick={fetchHealth}
          isLoading={loading}
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw size={14} />}
        >
          Refresh Status
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 mb-6">
          <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {health && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fastify Backend */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-4 h-4 text-slate-700" /> Fastify Backend
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl font-bold text-[#0F172A]">v{health.version}</p>
            <p className="text-xs text-[#64748B] mt-1">Uptime: {health.uptime_seconds}s</p>
          </div>

          {/* MongoDB */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-700" /> MongoDB Store
              </span>
              {health.services.mongodb.status === 'connected' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
            </div>
            <p className="text-xl font-bold capitalize text-[#0F172A]">
              {health.services.mongodb.status}
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              Latency: {health.services.mongodb.latency_ms ?? 'N/A'} ms
            </p>
          </div>

          {/* Redis */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-600" /> Redis Cache
              </span>
              {health.services.redis.status === 'connected' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <p className="text-xl font-bold capitalize text-[#0F172A]">
              {health.services.redis.status}
            </p>
            <p className="text-xs text-[#64748B] mt-1">
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
