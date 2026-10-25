import { LayoutGrid, MessageSquare, Image, Bookmark } from 'lucide-react';
import type { ProfileTab } from '../../hooks/useProfile';

export interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  isSelf: boolean;
  counts?: {
    all: number;
    discussions: number;
    visual: number;
    saved?: number;
  };
  className?: string;
}

export function ProfileTabs({
  activeTab,
  onTabChange,
  isSelf,
  counts,
  className = '',
}: ProfileTabsProps) {
  const tabs = [
    { id: 'all' as ProfileTab, label: 'All', icon: LayoutGrid, count: counts?.all },
    { id: 'discussions' as ProfileTab, label: 'Discussions', icon: MessageSquare, count: counts?.discussions },
    { id: 'visual' as ProfileTab, label: 'Visual Pins', icon: Image, count: counts?.visual },
    ...(isSelf
      ? [{ id: 'saved' as ProfileTab, label: 'Saved', icon: Bookmark, count: counts?.saved }]
      : []),
  ];

  return (
    <div
      role="tablist"
      aria-label="User Profile Content Tabs"
      className={`flex items-center gap-1.5 sm:gap-2 p-1.5 bg-surface-card rounded-2xl border border-border shadow-xs overflow-x-auto no-scrollbar transition-colors ${className}`}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            id={`profile-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`profile-panel-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isActive
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-subtle'
            }`}
          >
            <Icon size={16} className={isActive ? 'text-white' : 'text-text-muted'} />
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`ml-0.5 text-[11px] px-1.5 py-0.2 rounded-full tabular-nums font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-subtle text-text-secondary border border-border/50'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
