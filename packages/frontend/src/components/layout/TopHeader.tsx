import { useState } from 'react';
import { Sun, Moon, Settings } from 'lucide-react';
import { useRouter, Link } from '../../router/Router';
import { SearchBar, Avatar } from '../ui';
import { useTheme } from '../../theme';
import type { AppearanceMode } from '../../theme/types';

export function TopHeader() {
  const { navigate, query } = useRouter();
  const [searchVal, setSearchVal] = useState(query.q || '');
  const { resolvedTheme, setMode } = useTheme();

  const handleSearchSubmit = (val: string) => {
    if (val.trim()) {
      navigate(`/search?q=${encodeURIComponent(val.trim())}`);
    }
  };

  const handleQuickThemeToggle = () => {
    const nextMode: AppearanceMode = resolvedTheme === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#181B22]/95 backdrop-blur-sm border-b border-[#E2E8F0] dark:border-[#2E3544] px-4 lg:px-8 flex items-center justify-between gap-4 transition-colors">
      {/* Mobile Brand Mark */}
      <div className="flex items-center gap-2.5 md:hidden">
        <Link
          to="/"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-0.5"
        >
          <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
            SG
          </div>
          <span className="font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC]">SocialGraph</span>
        </Link>
      </div>

      {/* Global Universal Search Bar */}
      <div className="flex-1 max-w-md mx-auto hidden sm:block">
        <SearchBar
          value={searchVal}
          onChange={setSearchVal}
          onSubmit={handleSearchSubmit}
          placeholder="Search posts, communities, users..."
        />
      </div>

      {/* Right Controls: Quick Appearance Toggle, Settings, & User Profile */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Quick Appearance Toggle (Compact Sun/Moon) */}
        <button
          type="button"
          onClick={handleQuickThemeToggle}
          aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 sm:p-2.5 rounded-xl text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F4F4F5] dark:hover:bg-[#262B36] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {resolvedTheme === 'dark' ? (
            <Sun size={19} className="text-primary hover:rotate-45 transition-transform" />
          ) : (
            <Moon size={19} className="text-primary hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Appearance Settings Link */}
        <Link
          to="/settings/appearance"
          aria-label="Theme & Appearance Settings"
          title="Theme & Appearance Settings"
          className="p-2 sm:p-2.5 rounded-xl text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F4F4F5] dark:hover:bg-[#262B36] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Settings size={19} className="hover:rotate-45 transition-transform" />
        </Link>

        {/* User Profile Quick Access */}
        <Link
          to="/u/alex_dev"
          className="flex items-center gap-2 p-1 sm:p-1.5 rounded-full hover:bg-[#F4F4F5] dark:hover:bg-[#262B36] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ml-1"
          aria-label="View user profile"
        >
          <Avatar alt="Alex Dev" size="sm" />
          <span className="hidden xl:inline-block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
            u/alex_dev
          </span>
        </Link>
      </div>
    </header>
  );
}
