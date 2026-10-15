import React from 'react';
import { SidebarNav } from './SidebarNav';
import { TopHeader } from './TopHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { RightRail } from './RightRail';

export interface AppLayoutProps {
  children: React.ReactNode;
  showRightRail?: boolean;
}

export function AppLayout({ children, showRightRail = true }: AppLayoutProps) {
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
          <main className="flex-1 flex justify-center px-4 sm:px-6 lg:px-8 py-6 w-full max-w-full overflow-x-hidden">
            <div className="w-full max-w-4xl flex justify-center gap-8">
              <div className="flex-1 min-w-0 max-w-2xl">{children}</div>
              {showRightRail && <RightRail />}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation (Hidden on Tablet and Desktop) */}
      <MobileBottomNav />
    </div>
  );
}
