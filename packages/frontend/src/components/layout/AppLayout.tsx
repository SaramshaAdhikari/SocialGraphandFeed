import React from 'react';
import { SidebarNav } from './SidebarNav';
import { TopHeader } from './TopHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { RightRail } from './RightRail';
import { PostModal } from '../post/PostModal';
import { useRouter } from '../../router/Router';
import { BrandLogo } from '../brand/BrandLogo';
import { useRealtimeEvents } from '../../hooks/useRealtimeEvents';
import { useAuth } from '../../auth/AuthContext';
import { ArrowLeft } from 'lucide-react';

export interface AppLayoutProps {
  children: React.ReactNode;
  showRightRail?: boolean;
}

export function AppLayout({ children, showRightRail = true }: AppLayoutProps) {
  const { currentPath, navigate } = useRouter();
  const { user, status } = useAuth();
  useRealtimeEvents(undefined, { enabled: status === 'authenticated' && !!user });

  const isAuth = currentPath === '/login' || currentPath === '/register';
  const isDiscover = currentPath === '/explore';
  const isMessages = currentPath.startsWith('/messages');
  const isSettings = currentPath.startsWith('/settings');
  const isCommunity = currentPath.startsWith('/c/');
  const isPostDetail = currentPath.startsWith('/post/');
  const isProfile = currentPath.startsWith('/u/');
  const isSearch = currentPath === '/search';
  const isCreate = currentPath === '/create';
  const isCommunities = currentPath === '/communities';
  const isSaved = currentPath === '/saved';
  const isGraph = currentPath === '/graph';
  const isNotifications = currentPath.startsWith('/notifications');
  const isDedicatedCanvas =
    isCommunity || isPostDetail || isProfile || isSearch || isCommunities || isSaved || isGraph || isNotifications;

  // Focused Authentication Layout: clean distraction-free card with clear return navigation
  if (isAuth) {
    return (
      <div className="min-h-screen bg-canvas text-text-primary flex flex-col justify-between w-full transition-colors">
        <header className="px-6 py-4 flex items-center justify-between border-b border-border/40 bg-surface-card/60 backdrop-blur-md">
          <BrandLogo size="md" />
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs font-semibold text-text-muted hover:text-text-primary flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to feed
          </button>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">{children}</div>
        </main>
        <footer className="py-4 px-4 text-center text-xs text-text-muted border-t border-border/30">
          SocialGraph &copy; 2026 &bull; Technical Community &amp; Knowledge Network
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col w-full max-w-full transition-colors">
      <div className="flex flex-1 w-full max-w-full">
        {/* Left Navigation Rail (Desktop & Tablet) - Fixed in Viewport */}
        <SidebarNav />

        {/* Central Work Canvas - Padded on left to offset fixed navigation */}
        <div className={`flex-1 flex flex-col min-w-0 max-w-full md:pl-18 lg:pl-64 transition-all bg-canvas ${isMessages ? 'pb-16 md:pb-0 h-screen overflow-hidden' : 'pb-20 md:pb-6'}`}>
          {/* Top Header - Anchored Sticky at Top */}
          <TopHeader />

          {/* Body Content */}
          <main
            className={`relative flex-1 flex justify-center w-full max-w-full bg-canvas ${
              isDiscover
                ? 'px-3 sm:px-6 lg:px-8 py-6'
                : isMessages
                ? 'p-0 overflow-hidden h-[calc(100dvh-4rem-4rem)] md:h-[calc(100vh-4rem)]'
                : isSettings || isCreate
                ? 'px-4 sm:px-6 lg:px-8 py-8'
                : 'px-4 sm:px-6 lg:px-8 py-6'
            }`}
          >
            <div className={`relative z-10 w-full flex justify-center ${isMessages ? 'h-full' : ''}`}>
              {isMessages ? (
                // Full-Page Integrated Messaging Workspace (Two-Pane Desktop, Responsive Mobile)
                <div className="w-full h-full flex flex-col min-w-0">{children}</div>
              ) : isDiscover ? (
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
                // Dedicated Surface Canvas (Community Hub, Post Detail, Profile, Universal Search, Social Graph):
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
