import React from 'react';
import { SidebarNav } from './SidebarNav';
import { TopHeader } from './TopHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { RightRail } from './RightRail';
import { useRouter } from '../../router/Router';

export interface AppLayoutProps {
  children: React.ReactNode;
  showRightRail?: boolean;
}

export function AppLayout({ children, showRightRail = true }: AppLayoutProps) {
  const { currentPath } = useRouter();

  const isDiscover = currentPath === '/explore';
  const isSettings = currentPath.startsWith('/settings');
  const isCommunity = currentPath.startsWith('/c/');
  const isPostDetail = currentPath.startsWith('/post/');
  const isProfile = currentPath.startsWith('/u/');
  const isSearch = currentPath === '/search';
  const isDedicatedCanvas = isCommunity || isPostDetail || isProfile || isSearch;

  return (
    <div className="min-h-screen bg-canvas dark:bg-[#0F1117] text-[#0F172A] dark:text-[#F8FAFC] flex flex-col w-full max-w-full overflow-x-hidden transition-colors">
      <div className="flex flex-1 w-full max-w-full">
        {/* Left Navigation Rail (Desktop & Tablet) */}
        <SidebarNav />

        {/* Central Work Canvas */}
        <div className="flex-1 flex flex-col min-w-0 max-w-full pb-16 md:pb-0">
          {/* Top Header */}
          <TopHeader />

          {/* Body Content */}
          <main
            className={`flex-1 flex justify-center w-full max-w-full overflow-x-hidden ${
              isDiscover
                ? 'px-3 sm:px-6 lg:px-8 py-6'
                : isSettings
                ? 'px-4 sm:px-6 lg:px-8 py-8'
                : 'px-4 sm:px-6 lg:px-8 py-6'
            }`}
          >
            {isDiscover ? (
              // Discover Layout: Expands to full desktop width without artificial max-w-2xl bottleneck
              <div className="w-full max-w-[1750px] flex justify-center gap-6 2xl:gap-8">
                <div className="flex-1 min-w-0 w-full">{children}</div>
                {/* On Discover, RightRail collapses at intermediate widths and only displays on 2xl+ */}
                {showRightRail && (
                  <div className="hidden 2xl:block shrink-0">
                    <RightRail />
                  </div>
                )}
              </div>
            ) : isSettings ? (
              // Settings Layout: Focused comfortable form layout
              <div className="w-full max-w-4xl mx-auto">{children}</div>
            ) : isDedicatedCanvas ? (
              // Dedicated Surface Canvas (Community Hub, Post Detail, Profile, Universal Search):
              // Full-width max-w-5xl xl:max-w-6xl without global RightRail bottleneck
              <div className="w-full max-w-5xl xl:max-w-6xl mx-auto">{children}</div>
            ) : (
              // Default / Home Feed Layout: Focused reading column + Right Rail
              <div className="w-full max-w-5xl xl:max-w-6xl flex justify-center gap-8">
                <div className="flex-1 min-w-0 max-w-2xl xl:max-w-3xl">{children}</div>
                {showRightRail && (
                  <div className="hidden xl:block shrink-0">
                    <RightRail />
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation (Hidden on Tablet and Desktop) */}
      <MobileBottomNav />
    </div>
  );
}
