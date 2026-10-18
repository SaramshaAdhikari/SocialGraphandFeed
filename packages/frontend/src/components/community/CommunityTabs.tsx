import type { FeedSort } from '@socialgraph/shared';
import { Flame, Sparkles, TrendingUp, Layers, MessageSquare, Image } from 'lucide-react';
import type { CommunityTab } from '../../hooks/useCommunity';

export interface CommunityTabsProps {
  activeTab: CommunityTab;
  onTabChange: (tab: CommunityTab) => void;
  sort: FeedSort;
  onSortChange: (sort: FeedSort) => void;
  counts?: {
    all: number;
    discussions: number;
    visual: number;
  };
  className?: string;
}

export function CommunityTabs({
  activeTab,
  onTabChange,
  sort,
  onSortChange,
  counts,
  className = '',
}: CommunityTabsProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#E2E8F0] dark:border-[#2E3544] ${className}`}
    >
      {/* Content Mode Tabs (All / Discussions / Visual Pins) */}
      <div
        role="tablist"
        aria-label="Community content views"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'all'}
          onClick={() => onTabChange('all')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
            activeTab === 'all'
              ? 'bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] shadow-xs'
              : 'bg-white dark:bg-[#181B22] text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white border border-[#E2E8F0] dark:border-[#2E3544]'
          }`}
        >
          <Layers size={14} />
          <span>All</span>
          {typeof counts?.all === 'number' && (
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'all'
                  ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#0F172A]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {counts.all}
            </span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'discussions'}
          onClick={() => onTabChange('discussions')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
            activeTab === 'discussions'
              ? 'bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] shadow-xs'
              : 'bg-white dark:bg-[#181B22] text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white border border-[#E2E8F0] dark:border-[#2E3544]'
          }`}
        >
          <MessageSquare size={14} />
          <span>Discussions</span>
          {typeof counts?.discussions === 'number' && (
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'discussions'
                  ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#0F172A]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {counts.discussions}
            </span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'visual'}
          onClick={() => onTabChange('visual')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
            activeTab === 'visual'
              ? 'bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] shadow-xs'
              : 'bg-white dark:bg-[#181B22] text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white border border-[#E2E8F0] dark:border-[#2E3544]'
          }`}
        >
          <Image size={14} />
          <span>Visual Pins</span>
          {typeof counts?.visual === 'number' && (
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'visual'
                  ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#0F172A]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {counts.visual}
            </span>
          )}
        </button>
      </div>

      {/* Scoped Sorting Controls (Hot / New / Top) */}
      <div
        role="radiogroup"
        aria-label="Community feed sorting"
        className="flex items-center gap-1 bg-white dark:bg-[#181B22] border border-[#E2E8F0] dark:border-[#2E3544] p-1 rounded-xl text-xs self-start sm:self-auto shrink-0 shadow-2xs"
      >
        <button
          type="button"
          role="radio"
          aria-checked={sort === 'hot'}
          onClick={() => onSortChange('hot')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-colors ${
            sort === 'hot'
              ? 'bg-primary/10 text-primary dark:bg-primary/20 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Flame size={13} className={sort === 'hot' ? 'text-primary' : ''} />
          <span>Hot</span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={sort === 'new'}
          onClick={() => onSortChange('new')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-colors ${
            sort === 'new'
              ? 'bg-primary/10 text-primary dark:bg-primary/20 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles size={13} className={sort === 'new' ? 'text-primary' : ''} />
          <span>New</span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={sort === 'top'}
          onClick={() => onSortChange('top')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-colors ${
            sort === 'top'
              ? 'bg-primary/10 text-primary dark:bg-primary/20 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp size={13} className={sort === 'top' ? 'text-primary' : ''} />
          <span>Top</span>
        </button>
      </div>
    </div>
  );
}
