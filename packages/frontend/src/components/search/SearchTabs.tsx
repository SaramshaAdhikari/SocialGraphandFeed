import type { SearchCategory, SearchSort } from '../../api/types';
import { Layers, MessageSquare, Image, Users, User, ArrowDownWideNarrow } from 'lucide-react';

export interface SearchTabsProps {
  activeCategory: SearchCategory;
  onCategoryChange: (cat: SearchCategory) => void;
  sort: SearchSort;
  onSortChange: (sort: SearchSort) => void;
  counts?: {
    all: number;
    discussions: number;
    visual: number;
    communities: number;
    people: number;
  };
  className?: string;
}

const TABS: { id: SearchCategory; label: string; icon: typeof Layers }[] = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'discussions', label: 'Discussions', icon: MessageSquare },
  { id: 'visual', label: 'Visual Pins', icon: Image },
  { id: 'communities', label: 'Communities', icon: Users },
  { id: 'people', label: 'People', icon: User },
];

export function SearchTabs({
  activeCategory,
  onCategoryChange,
  sort,
  onSortChange,
  counts,
  className = '',
}: SearchTabsProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-6 border-b border-border ${className}`}
    >
      {/* Category Tabs */}
      <div
        role="tablist"
        aria-label="Search result categories"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          const count = counts ? counts[tab.id] : undefined;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onCategoryChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-card text-text-muted hover:text-text-primary border border-border hover:border-border-strong'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {typeof count === 'number' && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-medium ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-surface-subtle text-text-secondary border border-border/50'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sorting Control */}
      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
        <label
          htmlFor="search-sort-select"
          className="text-xs font-medium text-text-muted flex items-center gap-1"
        >
          <ArrowDownWideNarrow size={13} />
          <span className="hidden sm:inline">Sort:</span>
        </label>
        <select
          id="search-sort-select"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SearchSort)}
          className="bg-surface-card border border-border text-text-primary text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-colors"
        >
          <option value="relevance">Relevance</option>
          <option value="top">Top Ranked</option>
          <option value="new">Newest First</option>
        </select>
      </div>
    </div>
  );
}

export default SearchTabs;
