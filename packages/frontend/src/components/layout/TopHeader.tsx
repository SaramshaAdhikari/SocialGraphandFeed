import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, User, Bookmark, Palette, Settings, ChevronDown } from 'lucide-react';
import { useRouter, Link } from '../../router/Router';
import { SearchBar, Avatar } from '../ui';
import { useTheme } from '../../theme';
import type { AppearanceMode } from '../../theme/types';

export function TopHeader() {
  const { navigate, query } = useRouter();
  const [searchVal, setSearchVal] = useState(query.q || '');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
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

  // Sync search input with router query if URL query changes
  useEffect(() => {
    if (query.q !== undefined) {
      setSearchVal(query.q);
    }
  }, [query.q]);

  // Close profile dropdown on outside click or Escape key
  useEffect(() => {
    if (!profileMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileMenuOpen]);

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

      {/* Right Controls: Quick Light/Dark Toggle & Profile Account Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Appearance Toggle (Compact Sun/Moon) */}
        <button
          type="button"
          onClick={handleQuickThemeToggle}
          aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 sm:p-2.5 rounded-xl text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F4F4F5] dark:hover:bg-[#262B36] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-w-[40px] min-h-[40px] flex items-center justify-center"
        >
          {resolvedTheme === 'dark' ? (
            <Sun size={19} className="text-primary hover:rotate-45 transition-transform" />
          ) : (
            <Moon size={19} className="text-primary hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* User Account / Profile Menu */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            aria-label="User account menu for Alex Rivera"
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
            className="flex items-center gap-2 p-1 sm:p-1.5 rounded-full hover:bg-[#F4F4F5] dark:hover:bg-[#262B36] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Avatar src="/avatars/alex-dev.svg" alt="Alex Rivera" size="sm" />
            <span className="hidden xl:inline-block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
              u/alex_dev
            </span>
            <ChevronDown
              size={14}
              className={`text-[#94A3B8] transition-transform duration-150 ${
                profileMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {profileMenuOpen && (
            <div
              role="menu"
              aria-label="User Account Options"
              className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#181B22] rounded-2xl border border-[#E2E8F0] dark:border-[#2E3544] shadow-xl p-1.5 z-50 animate-scale-in"
            >
              {/* User Identity Header */}
              <div className="px-3 py-2.5 border-b border-[#F1F5F9] dark:border-[#262B36] mb-1">
                <p className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">Alex Rivera</p>
                <p className="text-[11px] text-[#94A3B8]">u/alex_dev</p>
              </div>

              {/* Menu Links */}
              <Link
                to="/u/alex_dev"
                role="menuitem"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#475569] dark:text-[#CBD5E1] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F4F4F5] dark:hover:bg-[#262B36] transition-colors"
              >
                <User size={15} className="text-[#64748B] dark:text-[#94A3B8]" />
                <span>Your Profile</span>
              </Link>

              <Link
                to="/saved"
                role="menuitem"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#475569] dark:text-[#CBD5E1] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F4F4F5] dark:hover:bg-[#262B36] transition-colors"
              >
                <Bookmark size={15} className="text-[#64748B] dark:text-[#94A3B8]" />
                <span>Saved Collections</span>
              </Link>

              <Link
                to="/settings/appearance"
                role="menuitem"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#475569] dark:text-[#CBD5E1] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F4F4F5] dark:hover:bg-[#262B36] transition-colors"
              >
                <Palette size={15} className="text-[#64748B] dark:text-[#94A3B8]" />
                <span>Appearance &amp; Themes</span>
              </Link>

              <div className="border-t border-[#F1F5F9] dark:border-[#262B36] my-1" />

              <Link
                to="/settings"
                role="menuitem"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#475569] dark:text-[#CBD5E1] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F4F4F5] dark:hover:bg-[#262B36] transition-colors"
              >
                <Settings size={15} className="text-[#64748B] dark:text-[#94A3B8]" />
                <span>Settings</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
