import { useState } from 'react';
import type { Community } from '@socialgraph/shared';
import { Users, Check, Plus, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';
import { Link } from '../../router/Router';

export interface CommunitySearchResultCardProps {
  community: Community;
  className?: string;
  onMembershipChange?: (communitySlug: string, isMember: boolean) => Promise<void>;
}

export function CommunitySearchResultCard({
  community,
  className = '',
  onMembershipChange,
}: CommunitySearchResultCardProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoinClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onMembershipChange || pending) return;
    setPending(true);
    setError(null);
    try {
      await onMembershipChange(community.slug, !community.is_member);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update hub membership.');
    } finally {
      setPending(false);
    }
  };

  const formattedMembers = new Intl.NumberFormat('en-US').format(community.members_count);

  return (
    <article
      data-testid={`community-result-${community.slug}`}
      className={`group bg-white dark:bg-[#181B22] border border-[#E2E8F0] dark:border-[#2E3544] rounded-2xl overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-xs hover:shadow-sm flex flex-col justify-between ${className}`}
    >
      {/* Banner Strip */}
      <div className="h-16 w-full relative bg-linear-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
        {community.banner_url && (
          <img
            src={community.banner_url}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
      </div>

      <div className="p-4 sm:p-5 pt-0 flex-1 flex flex-col justify-between">
        <div>
          {/* Avatar and Identity */}
          <div className="flex items-end justify-between -mt-6 mb-3">
            <Link
              to={`/c/${encodeURIComponent(community.slug)}`}
              className="relative z-10 block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#181B22] p-1 shadow-xs border border-[#E2E8F0] dark:border-[#2E3544]">
                {community.avatar_url ? (
                  <img
                    src={community.avatar_url}
                    alt={community.name}
                    className="w-full h-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {community.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            </Link>

            <Button
              variant={community.is_member ? 'secondary' : 'primary'}
              size="sm"
              onClick={(event) => void handleJoinClick(event)}
              disabled={!onMembershipChange}
              isLoading={pending}
              aria-pressed={community.is_member}
              aria-label={community.is_member ? `Leave ${community.name}` : `Join ${community.name}`}
              className="text-xs font-semibold px-3 py-1 h-8 rounded-full"
            >
              {community.is_member ? (
                <>
                  <Check size={13} className="mr-1 text-slate-500" />
                  <span>Joined</span>
                </>
              ) : (
                <>
                  <Plus size={13} className="mr-1" />
                  <span>Join</span>
                </>
              )}
            </Button>
          </div>

          <Link
            to={`/c/${encodeURIComponent(community.slug)}`}
            className="block group-hover:text-primary transition-colors"
          >
            <h3 className="font-bold text-base text-[#0F172A] dark:text-[#F8FAFC]">
              {community.name}
            </h3>
            <p className="text-xs text-primary font-semibold mt-0.5">
              c/{community.slug}
            </p>
          </Link>

          {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}

          <p className="mt-2 text-xs text-[#475569] dark:text-[#94A3B8] line-clamp-2 leading-relaxed">
            {community.description}
          </p>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-[#F1F5F9] dark:border-[#262B36] flex items-center justify-between text-xs text-[#64748B] dark:text-[#94A3B8]">
          <div className="flex items-center gap-1.5">
            <Users size={13} className="text-slate-400" />
            <span>
              <strong className="text-[#0F172A] dark:text-[#F8FAFC]">{formattedMembers}</strong>{' '}
              members
            </span>
          </div>

          <Link
            to={`/c/${encodeURIComponent(community.slug)}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#0F172A] dark:hover:text-white transition-colors"
          >
            <span>Visit hub</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>
    </article>
  );
}
