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
      className={`group bg-surface-card border border-border rounded-2xl overflow-hidden hover:border-border-strong transition-all shadow-xs hover:shadow-sm flex flex-col justify-between ${className}`}
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
              <div className="w-12 h-12 rounded-xl bg-surface-card p-1 shadow-xs border border-border">
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
              className="h-8 px-3 min-w-[80px] text-xs font-semibold rounded-full shrink-0"
              leftIcon={
                community.is_member ? (
                  <Check size={14} className="text-emerald-500 shrink-0" />
                ) : (
                  <Plus size={14} className="shrink-0" />
                )
              }
            >
              {community.is_member ? 'Joined' : 'Join'}
            </Button>
          </div>

          <Link
            to={`/c/${encodeURIComponent(community.slug)}`}
            className="block group-hover:text-primary transition-colors"
          >
            <h3 className="font-bold text-base text-text-primary">
              {community.name}
            </h3>
            <p className="text-xs text-primary font-semibold mt-0.5">
              c/{community.slug}
            </p>
          </Link>

          {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}

          <p className="mt-2 text-xs text-text-muted line-clamp-2 leading-relaxed">
            {community.description}
          </p>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-1.5">
            <Users size={13} className="text-slate-400" />
            <span>
              <strong className="text-text-primary">{formattedMembers}</strong>{' '}
              members
            </span>
          </div>

          <Link
            to={`/c/${encodeURIComponent(community.slug)}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
          >
            <span>Visit hub</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>
    </article>
  );
}
