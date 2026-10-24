import type { Community } from '@socialgraph/shared';
import { Users, ChevronDown } from 'lucide-react';

export interface CommunitySelectProps {
  communities: Community[];
  selectedCommunityId: string;
  onSelect: (id: string) => void;
  loading?: boolean;
  error?: string;
}

export function CommunitySelect({
  communities,
  selectedCommunityId,
  onSelect,
  loading = false,
  error,
}: CommunitySelectProps) {
  return (
    <div className="w-full text-left">
      <label
        htmlFor="community-select"
        className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5"
      >
        Select Destination Community
      </label>

      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
          <Users size={16} />
        </div>

        <select
          id="community-select"
          data-testid="community-select"
          value={selectedCommunityId}
          onChange={(e) => onSelect(e.target.value)}
          disabled={loading}
          className={`w-full h-11 pl-10 pr-10 text-sm bg-surface-card text-text-primary border rounded-xl appearance-none cursor-pointer transition-all ` +
            `focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ` +
            `disabled:bg-surface-subtle disabled:text-text-muted disabled:cursor-not-allowed ` +
            `${error ? 'border-red-500' : 'border-border hover:border-border-strong'}`}
        >
          <option value="">Post to personal profile only (Global feed)</option>
          {communities.map((c) => (
            <option key={c.id} value={c.id}>
              {`c/${c.slug} — ${c.name} (${c.members_count.toLocaleString()} members)`}
            </option>
          ))}
        </select>

        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
          <ChevronDown size={16} />
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-red-500 font-medium">
          {error}
        </p>
      ) : (
        <p className="mt-1 text-[11px] text-text-muted">
          Choosing a community indexes your post inside that hub and surfaces it to subscribers.
        </p>
      )}
    </div>
  );
}
