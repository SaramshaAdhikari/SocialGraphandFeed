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
    <div
      className={`bg-surface-card rounded-2xl border border-border shadow-xs transition-colors overflow-hidden ${className}`}
    >
      {/* 1. Feed Scope Navigation (Segmented Pill Bar) */}
      <div className="p-2 sm:p-2.5 border-b border-border/60">
        <div
          role="tablist"
          aria-label="Feed Scopes"
          className="flex items-center gap-1.5 p-1 bg-surface-subtle rounded-xl border border-border/60 overflow-x-auto no-scrollbar"
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
                className={`flex-1 min-w-[90px] flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm rounded-lg transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? 'bg-surface-card text-text-primary shadow-xs font-bold border border-border/80'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-card/40 font-medium'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Icon
                  size={15}
                  className={`transition-colors ${isActive ? 'text-primary' : 'text-text-muted'}`}
                />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Feed Sort Filter Bar */}
      <div
        role="toolbar"
        aria-label="Sort Options"
        className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-surface-subtle/50 text-xs"
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted mr-1">
            Sort:
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
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'bg-primary-soft border border-primary text-primary shadow-xs font-bold'
                    : 'bg-surface-card border border-border text-text-secondary hover:text-text-primary hover:border-border-strong font-medium'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Icon
                  size={13}
                  className={isSelected ? 'text-primary' : st.color}
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
