import { useEffect, useState } from 'react';
import type { Community } from '@socialgraph/shared';
import { ArrowUpRight } from 'lucide-react';
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
    { tag: '#CacheInvalidation', topic: 'Systems & Memory' },
    { tag: '#TAOArchitecture', topic: 'Data & Scale' },
    { tag: '#BrutalistCompute', topic: 'Design & UI' },
    { tag: '#ConsensusProtocols', topic: 'Distributed Networks' },
    { tag: '#DistributedState', topic: 'Database Engines' },
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
      <div className="py-2 px-1 transition-colors">
        <div className="flex items-center justify-between mb-3 pb-1">
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Trending Discussions
          </h2>
        </div>
        <div className="space-y-1">
          {trendingTopics.map((t, index) => (
            <Link
              key={t.tag}
              to={`/search?q=${encodeURIComponent(t.tag)}`}
              className="flex items-center justify-between p-2 -mx-1.5 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors group"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="text-xs font-mono font-bold text-text-muted/60 group-hover:text-text-primary transition-colors w-4 pt-0.5">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                    {t.tag}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">{t.topic}</p>
                </div>
              </div>
              <ArrowUpRight size={14} className="text-text-muted group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* 3. Suggested Creators to Follow */}
      <div className="py-2 px-1 transition-colors">
        <div className="flex items-center justify-between mb-3 pb-1">
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Suggested for you
          </h2>
        </div>
        <div className="space-y-2.5">
          {RECOMMENDED_CREATORS.map((creator) => (
            <div key={creator.username} className="flex items-center justify-between gap-2.5 p-1.5 -mx-1.5 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors">
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
                className="text-xs font-semibold text-primary hover:text-primary-hover shrink-0"
              >
                Follow
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Platform Legal & Settings Footer */}
      <footer className="px-1 text-[11px] text-text-muted/70 space-y-2 leading-relaxed pt-2 pb-6">
        <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[11px]">
          <Link to="/explore" className="hover:text-text-primary transition-colors">Discover</Link>
          <span>•</span>
          <Link to="/communities" className="hover:text-text-primary transition-colors">Communities</Link>
          <span>•</span>
          <Link to="/saved" className="hover:text-text-primary transition-colors">Saved</Link>
          <span>•</span>
          <Link to="/settings/appearance" className="hover:text-text-primary transition-colors">Appearance</Link>
        </div>
        <p className="text-[11px] text-text-muted/60">
          &copy; 2026 SOCIALGRAPH &bull; KNOWLEDGE &amp; FEED
        </p>
      </footer>
    </aside>
  );
}

export default RightRail;
