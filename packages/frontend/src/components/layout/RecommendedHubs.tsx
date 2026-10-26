import type { Community } from '@socialgraph/shared';
import { Check, Plus, Users } from 'lucide-react';
import { Link } from '../../router/Router';
import { Button } from '../ui/Button';

interface RecommendedHubsProps {
  communities: Community[];
  pendingSlug?: string | null;
  error?: string | null;
  onMembershipChange: (community: Community) => void;
}

/** Renders membership state directly from the API community representation. */
export function RecommendedHubs({
  communities,
  pendingSlug = null,
  error,
  onMembershipChange,
}: RecommendedHubsProps) {
  return (
    <div className="bg-surface-card rounded-2xl border border-border p-4 shadow-xs transition-colors">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/60">
        <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Users size={14} />
        </div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary">
          Recommended Hubs
        </h2>
      </div>
      <div className="space-y-3">
        {communities.slice(0, 4).map((community) => (
          <div key={community.id} className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <Link
                to={`/c/${encodeURIComponent(community.slug)}`}
                className="text-xs font-bold text-text-primary hover:text-primary transition-colors block truncate"
              >
                c/{community.slug}
              </Link>
              <span className="text-[11px] text-text-muted">
                {community.members_count.toLocaleString()} members
              </span>
            </div>
            <Button
              size="sm"
              variant={community.is_member ? 'secondary' : 'outline'}
              className="h-8 px-3 min-w-[80px] text-xs rounded-full font-semibold shrink-0"
              disabled={pendingSlug !== null}
              isLoading={pendingSlug === community.slug}
              aria-pressed={community.is_member}
              aria-label={community.is_member ? `Leave ${community.name}` : `Join ${community.name}`}
              onClick={() => onMembershipChange(community)}
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
        ))}
        {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
      </div>
      <div className="mt-3 pt-2.5 border-t border-border/60">
        <Link
          to="/communities"
          className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
        >
          Browse all communities →
        </Link>
      </div>
    </div>
  );
}
export default RecommendedHubs;
