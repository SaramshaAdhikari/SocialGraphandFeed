import { Flame, Sparkles, Trophy, Compass, UserCheck, Users } from 'lucide-react';
import type { FeedSort } from '@socialgraph/shared';
import type { FeedScope } from '../../hooks/useFeed';

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
    { id: 'hot', label: 'Hot', icon: Flame, color: 'text-upvote' },
    { id: 'new', label: 'New', icon: Sparkles, color: 'text-primary' },
    { id: 'top', label: 'Top', icon: Trophy, color: 'text-amber-500' },
  ];

  return (
    <div className={`space-y-3 transition-colors ${className}`}>
      {/* 1. Feed Scope Tabs (Instagram-style high-contrast underline tabs) */}
      <div className="border-b border-border/40 pb-0">
        <div
          role="tablist"
          aria-label="Feed Scopes"
          className="flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar"
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
                className={`relative flex items-center gap-2 py-3 text-sm transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary ${
                  isActive
                    ? 'text-text-primary font-bold'
                    : 'text-text-muted hover:text-text-primary font-medium'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Icon
                  size={16}
                  className={isActive ? 'text-text-primary stroke-[2.5px]' : 'text-text-muted stroke-[1.8px]'}
                />
                <span>{s.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Feed Sort Filter Bar */}
      <div
        role="toolbar"
        aria-label="Sort Options"
        className="flex items-center justify-between gap-2 px-1 text-xs"
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-text-muted mr-1">
            Sort by:
          </span>
          {sorts.map((st) => {
            const Icon = st.icon;
            const isSelected = sort === st.id;
            return (
              <button
                key={st.id}
                type="button"
                aria-pressed={isSelected}
                disabled={disabled}
                onClick={() => onSortChange(st.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary ${
                  isSelected
                    ? 'bg-text-primary text-canvas font-bold shadow-xs'
                    : 'bg-surface-subtle text-text-secondary hover:text-text-primary hover:bg-black/[0.05] dark:hover:bg-white/[0.1] font-medium'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Icon
                  size={13}
                  className={isSelected ? 'text-canvas' : 'text-text-muted'}
                />
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FeedSortBar;
