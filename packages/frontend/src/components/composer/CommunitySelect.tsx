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
        className="block text-xs font-semibold text-[#0F172A] dark:text-[#CBD5E1] uppercase tracking-wider mb-1.5"
      >
        Select Destination Community
      </label>

      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">
          <Users size={16} />
        </div>

        <select
          id="community-select"
          data-testid="community-select"
          value={selectedCommunityId}
          onChange={(e) => onSelect(e.target.value)}
          disabled={loading}
          className={`w-full h-11 pl-10 pr-10 text-sm bg-white dark:bg-[#181B22] text-[#0F172A] dark:text-[#F8FAFC] border rounded-xl appearance-none cursor-pointer transition-all ` +
            `focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ` +
            `disabled:bg-[#F4F4F5] dark:disabled:bg-[#12141A] disabled:text-[#94A3B8] disabled:cursor-not-allowed ` +
            `${error ? 'border-red-500' : 'border-[#E2E8F0] dark:border-[#2E3544] hover:border-[#CBD5E1] dark:hover:border-[#3E475A]'}`}
        >
          <option value="">Post to personal profile only (Global feed)</option>
          {communities.map((c) => (
            <option key={c.id} value={c.id}>
              {`c/${c.slug} — ${c.name} (${c.members_count.toLocaleString()} members)`}
            </option>
          ))}
        </select>

        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">
          <ChevronDown size={16} />
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-red-500 font-medium">
          {error}
        </p>
      ) : (
        <p className="mt-1 text-[11px] text-[#94A3B8]">
          Choosing a community indexes your post inside that hub and surfaces it to subscribers.
        </p>
      )}
    </div>
  );
}
