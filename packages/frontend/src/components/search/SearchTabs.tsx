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
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-6 border-b border-[#E2E8F0] dark:border-[#2E3544] ${className}`}
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
                isActive
                  ? 'bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] shadow-xs'
                  : 'bg-white dark:bg-[#181B22] text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white border border-[#E2E8F0] dark:border-[#2E3544]'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {typeof count === 'number' && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-medium ${
                    isActive
                      ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#0F172A]'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
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
          className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1"
        >
          <ArrowDownWideNarrow size={13} />
          <span className="hidden sm:inline">Sort:</span>
        </label>
        <select
          id="search-sort-select"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SearchSort)}
          className="bg-white dark:bg-[#181B22] border border-[#E2E8F0] dark:border-[#2E3544] text-[#0F172A] dark:text-[#F8FAFC] text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-colors"
        >
          <option value="relevance">Relevance</option>
          <option value="top">Top Ranked</option>
          <option value="new">Newest First</option>
        </select>
      </div>
    </div>
  );
}
