import { Flame, Sparkles, Trophy, Compass, UserCheck, Users } from 'lucide-react';
import type { FeedSort } from '@socialgraph/shared';
import type { FeedScope } from '../../hooks/useFeed';
import { Pill } from '../ui/Badge';

export interface FeedSortBarProps {
  scope: FeedScope;
  sort: FeedSort;
  onScopeChange: (scope: FeedScope) => void;
  onSortChange: (sort: FeedSort) => void;
  disabled?: boolean;
  className?: string;
}

export function FeedSortBar({
  scope,
  sort,
  onScopeChange,
  onSortChange,
  disabled = false,
  className = '',
}: FeedSortBarProps) {
  const scopes: { id: FeedScope; label: string; icon: typeof Compass }[] = [
    { id: 'all', label: 'For You', icon: Compass },
    { id: 'following', label: 'Following', icon: UserCheck },
    { id: 'communities', label: 'Communities', icon: Users },
  ];

  const sorts: { id: FeedSort; label: string; icon: typeof Flame; color: string }[] = [
    { id: 'hot', label: 'Hot', icon: Flame, color: 'text-[#F97316]' },
    { id: 'new', label: 'New', icon: Sparkles, color: 'text-[#2563EB]' },
    { id: 'top', label: 'Top', icon: Trophy, color: 'text-amber-500' },
  ];

  return (
    <div
      className={`bg-white rounded-xl border border-[#E2E8F0] shadow-sm divide-y divide-[#F1F5F9] ${className}`}
    >
      {/* Feed Scope Navigation (Segmented Tabs) */}
      <div
        role="tablist"
        aria-label="Feed Scopes"
        className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 pt-1 sm:pt-1.5 overflow-x-auto scrollbar-none"
      >
        {scopes.map((s) => {
          const Icon = s.icon;
          const isActive = scope === s.id;
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={isActive}
              aria-controls="feed-content"
              disabled={disabled}
              onClick={() => onScopeChange(s.id)}
              className={`flex items-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                isActive
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1]'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Icon size={16} className={isActive ? 'text-[#2563EB]' : 'text-[#94A3B8]'} />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Feed Sort Filter Bar */}
      <div
        role="toolbar"
        aria-label="Sort Options"
        className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-[#FAFAFA] rounded-b-xl"
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mr-1 hidden sm:inline-block">
            Sort:
          </span>
          {sorts.map((st) => {
            const Icon = st.icon;
            const isSelected = sort === st.id;
            return (
              <Pill
                key={st.id}
                size="sm"
                selected={isSelected}
                disabled={disabled}
                onClick={() => onSortChange(st.id)}
                className="cursor-pointer"
              >
                <Icon
                  size={13}
                  className={`mr-1 ${isSelected ? 'text-white' : st.color}`}
                />
                <span>{st.label}</span>
              </Pill>
            );
          })}
        </div>

        <span className="text-[11px] text-[#94A3B8] hidden md:inline-block">
          Active: <strong className="text-[#475569] capitalize">{scope}</strong> • <strong className="text-[#475569] capitalize">{sort}</strong>
        </span>
      </div>
    </div>
  );
}
