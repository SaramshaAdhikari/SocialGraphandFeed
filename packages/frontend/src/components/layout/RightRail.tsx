import { TrendingUp, Users, Activity } from 'lucide-react';
import { Link } from '../../router/Router';
import { Button } from '../ui/Button';

export function RightRail() {
  const suggestedCommunities = [
    { id: 'c_systems', name: 'systems', members: '14.2k' },
    { id: 'c_algorithms', name: 'algorithms', members: '28.5k' },
    { id: 'c_hardware', name: 'hardware', members: '9.1k' },
  ];

  const trendingTopics = [
    { tag: '#CacheInvalidation', posts: '1.2k posts' },
    { tag: '#TAOArchitecture', posts: '840 posts' },
    { tag: '#ShardedMongoDB', posts: '430 posts' },
  ];

  return (
    <aside
      className="hidden xl:block w-80 shrink-0 p-6 space-y-6 select-none"
      aria-label="Contextual Sidebar"
    >
      {/* Suggested Communities */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#F1F5F9]">
          <Users size={16} className="text-[#2563EB]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
            Recommended Hubs
          </h2>
        </div>
        <div className="space-y-3">
          {suggestedCommunities.map((c) => (
            <div key={c.id} className="flex items-center justify-between">
              <div>
                <Link
                  to={`/c/${c.name}`}
                  className="text-xs font-semibold text-[#0F172A] hover:text-[#2563EB] transition-colors block"
                >
                  c/{c.name}
                </Link>
                <span className="text-[11px] text-[#94A3B8]">{c.members} members</span>
              </div>
              <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs">
                Join
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Topics */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#F1F5F9]">
          <TrendingUp size={16} className="text-[#F97316]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
            Trending Discussions
          </h2>
        </div>
        <div className="space-y-2.5">
          {trendingTopics.map((t) => (
            <Link
              key={t.tag}
              to={`/search?q=${encodeURIComponent(t.tag)}`}
              className="block group p-1 -mx-1 rounded-md hover:bg-[#F4F4F5] transition-colors"
            >
              <p className="text-xs font-semibold text-[#0F172A] group-hover:text-[#2563EB]">
                {t.tag}
              </p>
              <p className="text-[11px] text-[#94A3B8]">{t.posts}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Diagnostics Quick Access */}
      <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-[#475569] flex items-center gap-1.5">
            <Activity size={14} className="text-[#2563EB]" /> Foundation Health
          </span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <p className="text-[#64748B] text-[11px] mb-2">
          Fastify 5, MongoDB 7, and Redis 7 connection status.
        </p>
        <Link
          to="/diagnostics"
          className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1"
        >
          Open Diagnostics View →
        </Link>
      </div>
    </aside>
  );
}
