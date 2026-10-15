import { useState } from 'react';
import { Palette, Sun, Moon } from 'lucide-react';
import { useRouter, Link } from '../../router/Router';
import { SearchBar, Avatar } from '../ui';
import { useTheme } from '../../theme';
import { AppearancePopover } from '../theme/AppearancePopover';

export function TopHeader() {
  const { navigate, query } = useRouter();
  const [searchVal, setSearchVal] = useState(query.q || '');
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const { resolvedTheme } = useTheme();

  const handleSearchSubmit = (val: string) => {
    if (val.trim()) {
      navigate(`/search?q=${encodeURIComponent(val.trim())}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#181B22]/95 backdrop-blur-sm border-b border-[#E2E8F0] dark:border-[#2E3544] px-4 lg:px-8 flex items-center justify-between gap-4 transition-colors">
        {/* Mobile Brand Mark */}
        <div className="flex items-center gap-2.5 md:hidden">
          <Link to="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-0.5">
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

        {/* Right Controls: Appearance & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Appearance / Theme Selector Trigger Button */}
          <button
            type="button"
            onClick={() => setAppearanceOpen(true)}
            aria-label="Customize appearance and color palette"
            title="Customize appearance and color palette"
            aria-haspopup="dialog"
            aria-expanded={appearanceOpen}
            className="flex items-center gap-1.5 p-2 rounded-xl text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F4F4F5] dark:hover:bg-[#262B36] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {resolvedTheme === 'dark' ? (
              <Moon size={18} className="text-primary" />
            ) : (
              <Sun size={18} className="text-primary" />
            )}
            <Palette size={16} className="hidden sm:inline-block" />
          </button>

          {/* User Profile Quick Access */}
          <Link
            to="/u/alex_dev"
            className="flex items-center gap-2 p-1.5 rounded-full hover:bg-[#F4F4F5] dark:hover:bg-[#262B36] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="View user profile"
          >
            <Avatar alt="Alex Dev" size="sm" />
            <span className="hidden xl:inline-block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
              u/alex_dev
            </span>
          </Link>
        </div>
      </header>

      {/* Global Appearance Popover / Dialog */}
      <AppearancePopover
        isOpen={appearanceOpen}
        onClose={() => setAppearanceOpen(false)}
      />
    </>
  );
}
