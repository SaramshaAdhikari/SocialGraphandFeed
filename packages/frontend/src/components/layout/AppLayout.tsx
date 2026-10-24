import React from 'react';
import { SidebarNav } from './SidebarNav';
import { TopHeader } from './TopHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { RightRail } from './RightRail';
import { PostModal } from '../post/PostModal';
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
  const isCreate = currentPath === '/create';
  const isCommunities = currentPath === '/communities';
  const isSaved = currentPath === '/saved';
  const isDedicatedCanvas = isCommunity || isPostDetail || isProfile || isSearch || isCommunities || isSaved;

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col w-full max-w-full transition-colors">
      <div className="flex flex-1 w-full max-w-full">
        {/* Left Navigation Rail (Desktop & Tablet) - Fixed in Viewport */}
        <SidebarNav />

        {/* Central Work Canvas - Padded on left to offset fixed navigation */}
        <div className="flex-1 flex flex-col min-w-0 max-w-full md:pl-18 lg:pl-64 pb-16 md:pb-0 transition-all bg-canvas">
          {/* Top Header - Anchored Sticky at Top */}
          <TopHeader />

          {/* Body Content */}
          <main
            className={`relative flex-1 flex justify-center w-full max-w-full bg-canvas ${
              isDiscover
                ? 'px-3 sm:px-6 lg:px-8 py-6'
                : isSettings || isCreate
                ? 'px-4 sm:px-6 lg:px-8 py-8'
                : 'px-4 sm:px-6 lg:px-8 py-6'
            }`}
          >
            <div className="relative z-10 w-full flex justify-center">
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
              ) : isSettings || isCreate ? (
                // Settings & Create Post Layout: Focused comfortable form layout
                <div className="w-full max-w-4xl mx-auto">{children}</div>
              ) : isDedicatedCanvas ? (
                // Dedicated Surface Canvas (Community Hub, Post Detail, Profile, Universal Search):
                // Full-width max-w-5xl xl:max-w-6xl without global RightRail bottleneck
                <div className="w-full max-w-5xl xl:max-w-6xl mx-auto">{children}</div>
              ) : (
                // Default / Home Feed Layout: Focused reading column + Right Rail
                <div className="w-full max-w-5xl xl:max-w-6xl flex justify-center gap-8">
                  <div className="flex-1 min-w-0 max-w-2xl xl:max-w-3xl overflow-x-hidden">{children}</div>
                  {showRightRail && (
                    <div className="hidden xl:block shrink-0">
                      <RightRail />
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Shared Instagram-Style Post & Comment Modal */}
      <PostModal />

      {/* Mobile Bottom Navigation (Hidden on Tablet and Desktop) */}
      <MobileBottomNav />
    </div>
  );
}

export default AppLayout;
