import type { Community } from '@socialgraph/shared';
import { Link } from '../../router/Router';

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
    <div className="py-2 px-1 transition-colors">
      <div className="flex items-center justify-between mb-3 pb-1">
        <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Recommended Hubs
        </h2>
        <Link
          to="/communities"
          className="text-xs font-semibold text-text-primary hover:text-primary transition-colors"
        >
          See all
        </Link>
      </div>
      <div className="space-y-2.5">
        {communities.slice(0, 4).map((community) => (
          <div key={community.id} className="flex items-center justify-between gap-2 p-1.5 -mx-1.5 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors">
            <div className="min-w-0 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-surface-subtle border border-border/50 flex items-center justify-center text-xs font-bold text-text-secondary shrink-0">
                {community.slug.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <Link
                  to={`/c/${encodeURIComponent(community.slug)}`}
                  className="text-xs font-bold text-text-primary hover:underline block truncate"
                >
                  c/{community.slug}
                </Link>
                <span className="text-[11px] text-text-muted">
                  {community.members_count.toLocaleString()} members
                </span>
              </div>
            </div>
            <button
              type="button"
              disabled={pendingSlug !== null}
              aria-pressed={community.is_member}
              aria-label={community.is_member ? `Leave ${community.name}` : `Join ${community.name}`}
              onClick={() => onMembershipChange(community)}
              className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors cursor-pointer shrink-0 ${
                community.is_member
                  ? 'text-text-muted hover:text-rose-500 bg-surface-subtle'
                  : 'text-primary hover:text-primary-hover font-bold'
              }`}
            >
              {community.is_member ? 'Joined' : 'Join'}
            </button>
          </div>
        ))}
        {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
      </div>
    </div>
  );
}
export default RecommendedHubs;
