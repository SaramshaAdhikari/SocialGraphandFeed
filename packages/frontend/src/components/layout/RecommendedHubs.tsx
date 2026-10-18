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
export function RecommendedHubs({ communities, pendingSlug = null, error, onMembershipChange }: RecommendedHubsProps) {
  return (
    <div className="bg-white dark:bg-[#181B22] rounded-xl border border-[#E2E8F0] dark:border-[#2E3544] p-4 shadow-sm transition-colors">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#F1F5F9] dark:border-[#262B36]">
        <Users size={16} className="text-primary" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#F8FAFC]">Recommended Hubs</h2>
      </div>
      <div className="space-y-3">
        {communities.slice(0, 3).map((community) => (
          <div key={community.id} className="flex items-center justify-between gap-2">
            <div>
              <Link to={`/c/${encodeURIComponent(community.slug)}`} className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] hover:text-primary transition-colors block">
                c/{community.slug}
              </Link>
              <span className="text-[11px] text-[#94A3B8]">{community.members_count.toLocaleString()} members</span>
            </div>
            <Button size="sm" variant={community.is_member ? 'secondary' : 'outline'} className="h-7 px-2.5 text-xs"
              disabled={pendingSlug !== null} isLoading={pendingSlug === community.slug}
              aria-pressed={community.is_member}
              aria-label={community.is_member ? `Leave ${community.name}` : `Join ${community.name}`}
              onClick={() => onMembershipChange(community)}>
              {community.is_member ? <><Check size={12} /> Joined</> : <><Plus size={12} /> Join</>}
            </Button>
          </div>
        ))}
        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
