import { useEffect, useState } from 'react';
import type { Community } from '@socialgraph/shared';
import { TrendingUp, Sparkles, ArrowUpRight } from 'lucide-react';
import { Link } from '../../router/Router';
import { api } from '../../api';
import { RecommendedHubs } from './RecommendedHubs';
import { Avatar } from '../ui/Avatar';

interface RecommendedCreator {
  username: string;
  displayName: string;
  avatarUrl: string;
  bioSnippet: string;
  isVerified?: boolean;
}

const RECOMMENDED_CREATORS: RecommendedCreator[] = [
  {
    username: 'elena_arch',
    displayName: 'Elena Rostova',
    avatarUrl: '/avatars/elena-arch.svg',
    bioSnippet: 'Brutalist architecture & systems photography',
    isVerified: true,
  },
  {
    username: 'lucas_t',
    displayName: 'Lucas Thorne',
    avatarUrl: '/avatars/lucas-t.svg',
    bioSnippet: 'Distributed systems & consensus protocols',
    isVerified: true,
  },
  {
    username: 'alec_m',
    displayName: 'Alec Mercer',
    avatarUrl: '/avatars/alec-m.svg',
    bioSnippet: 'Linux kernel, SRE & cache invalidation',
    isVerified: true,
  },
];

export function RightRail() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [membershipError, setMembershipError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void api.getCommunities().then((items) => {
      if (active) setCommunities(items);
    }).catch(() => {
      if (active) setCommunities([]);
    });
    return () => { active = false; };
  }, []);

  const setMembership = async (community: Community) => {
    setPendingSlug(community.slug);
    setMembershipError(null);
    try {
      const result = await api.setCommunityMembership(community.slug, !community.is_member);
      setCommunities((items) => items.map((item) => item.id === result.community_id
        ? { ...item, is_member: result.is_member, members_count: result.members_count }
        : item));
    } catch (error) {
      setMembershipError(error instanceof Error ? error.message : 'Could not update hub membership.');
    } finally {
      setPendingSlug(null);
    }
  };

  const trendingTopics = [
    { tag: '#CacheInvalidation', posts: '1.2k discussions' },
    { tag: '#TAOArchitecture', posts: '840 discussions' },
    { tag: '#BrutalistCompute', posts: '520 pins' },
    { tag: '#ConsensusProtocols', posts: '390 discussions' },
    { tag: '#DistributedState', posts: '280 discussions' },
  ];

  return (
    <aside
      className="hidden xl:block w-80 shrink-0 space-y-5 select-none sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar pr-1"
      aria-label="Contextual Sidebar"
    >
      {/* 1. Recommended Communities */}
      <RecommendedHubs
        communities={communities}
        pendingSlug={pendingSlug}
        error={membershipError}
        onMembershipChange={(community) => void setMembership(community)}
      />

      {/* 2. Trending Discussions */}
      <div className="bg-surface-card rounded-2xl border border-border p-4 shadow-xs transition-colors">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/60">
          <div className="w-6 h-6 rounded-lg bg-orange-500/10 text-upvote flex items-center justify-center">
            <TrendingUp size={14} />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary">
            Trending Discussions
          </h2>
        </div>
        <div className="space-y-1.5">
          {trendingTopics.map((t, index) => (
            <Link
              key={t.tag}
              to={`/search?q=${encodeURIComponent(t.tag)}`}
              className="flex items-center justify-between p-2 -mx-1 rounded-xl hover:bg-surface-subtle transition-colors group"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="text-xs font-mono font-bold text-text-muted/70 group-hover:text-primary transition-colors w-4 pt-0.5">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                    {t.tag}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">{t.posts}</p>
                </div>
              </div>
              <ArrowUpRight size={14} className="text-text-muted group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* 3. Suggested Creators to Follow */}
      <div className="bg-surface-card rounded-2xl border border-border p-4 shadow-xs transition-colors">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/60">
          <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles size={14} />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary">
            Featured Creators
          </h2>
        </div>
        <div className="space-y-3">
          {RECOMMENDED_CREATORS.map((creator) => (
            <div key={creator.username} className="flex items-center justify-between gap-2.5">
              <Link
                to={`/u/${creator.username}`}
                className="flex items-center gap-2.5 min-w-0 group/creator"
              >
                <Avatar src={creator.avatarUrl} alt={creator.displayName} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-text-primary group-hover/creator:text-primary truncate">
                      {creator.displayName}
                    </span>
                    {creator.isVerified && (
                      <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-primary text-white text-[8px] font-bold shrink-0">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-muted truncate">@{creator.username}</p>
                </div>
              </Link>
              <Link
                to={`/u/${creator.username}`}
                className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-surface-subtle border border-border text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors shrink-0"
              >
                View
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Platform Legal & Settings Footer */}
      <footer className="px-2 text-[11px] text-text-muted space-y-1.5 leading-relaxed pb-4">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <Link to="/explore" className="hover:text-text-primary hover:underline">Discover</Link>
          <Link to="/communities" className="hover:text-text-primary hover:underline">Communities</Link>
          <Link to="/saved" className="hover:text-text-primary hover:underline">Saved</Link>
          <Link to="/settings/appearance" className="hover:text-text-primary hover:underline">Appearance</Link>
        </div>
        <p className="text-[10px] text-text-muted/80">
          SocialGraph &amp; Feed Engineering &copy; 2026. All rights reserved.
        </p>
      </footer>
    </aside>
  );
}

export default RightRail;
