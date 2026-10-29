import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, User, Bookmark, Palette, Settings, ChevronDown, Search, MessageSquare, LogOut } from 'lucide-react';
import { useRouter, Link } from '../../router/Router';
import { SearchBar, Avatar } from '../ui';
import { useTheme } from '../../theme';
import type { AppearanceMode } from '../../theme/types';
import { useAuth } from '../../auth/AuthContext';
import { BrandLogo } from '../brand/BrandLogo';
import { NotificationBell } from '../notifications/NotificationBell';
import { SearchSuggestionsOverlay } from '../search/SearchSuggestionsOverlay';
import { api } from '../../api';

export function TopHeader() {
  const { navigate, query, currentPath } = useRouter();
  const [searchVal, setSearchVal] = useState(query.q || '');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme, setMode } = useTheme();
  const { user, status, logout, logoutError } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const isAuthPage = currentPath === '/login' || currentPath === '/register';

  // Synchronize unread messages count
  useEffect(() => {
    if (status !== 'authenticated' || !user) {
      setUnreadMessages(0);
      return;
    }
    const updateCount = () => {
      api.getUnreadMessagesCount().then(setUnreadMessages).catch(() => {});
    };
    updateCount();
    const handleRealtime = (e: any) => {
      const type = e?.detail?.type;
      if (type === 'message.created' || type === 'message.read') {
        updateCount();
      }
    };
    window.addEventListener('socialgraph:realtime' as any, handleRealtime);
    return () => window.removeEventListener('socialgraph:realtime' as any, handleRealtime);
  }, [status, user]);

  const handleSearchSubmit = (val: string) => {
    if (val.trim()) {
      navigate(`/search?q=${encodeURIComponent(val.trim())}`);
    }
  };

  const handleQuickThemeToggle = () => {
    const nextMode: AppearanceMode = resolvedTheme === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
  };

  const handleLogout = async () => {
    if (await logout()) {
      setProfileMenuOpen(false);
      navigate('/login', { replace: true });
    } else {
      setProfileMenuOpen(true);
    }
  };

  // Sync search input with router query if URL query changes
  useEffect(() => {
    if (query.q !== undefined) {
      setSearchVal(query.q);
    }
  }, [query.q]);

  // Close search overlay on outside click
  useEffect(() => {
    if (!searchOverlayOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOverlayOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOverlayOpen]);

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
    <header className="sticky top-0 z-30 h-16 bg-canvas/80 backdrop-blur-md border-b border-border/40 px-4 lg:px-8 flex items-center justify-between gap-4 transition-colors">
      {/* Mobile Brand Mark */}
      <div className="flex items-center gap-2.5 md:hidden">
        <Link
          to="/"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary rounded-xl p-1 -m-1"
        >
          <BrandLogo size="sm" />
        </Link>
      </div>

      {/* Global Universal Search Bar */}
      <div className="flex-1 max-w-md mx-auto hidden sm:block relative" ref={searchContainerRef}>
        <SearchBar
          value={searchVal}
          onChange={(val) => {
            setSearchVal(val);
            setSearchOverlayOpen(val.trim().length >= 2);
          }}
          onSubmit={(val) => {
            setSearchOverlayOpen(false);
            handleSearchSubmit(val);
          }}
          placeholder="Search posts, communities, users..."
        />
        <SearchSuggestionsOverlay
          query={searchVal}
          isOpen={searchOverlayOpen}
          onClose={() => setSearchOverlayOpen(false)}
          onSelect={() => setSearchOverlayOpen(false)}
        />
      </div>

      {/* Right Controls: Quick Light/Dark Toggle & Profile Account Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Mobile Quick Search Link (<640px) */}
        <Link
          to="/search"
          aria-label="Search posts, communities, and users"
          title="Search"
          className="sm:hidden p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary min-w-[38px] min-h-[38px] flex items-center justify-center"
        >
          <Search size={18} />
        </Link>

        {/* Quick Appearance Toggle (Compact Sun/Moon) */}
        <button
          type="button"
          onClick={handleQuickThemeToggle}
          aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 sm:p-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary min-w-[38px] min-h-[38px] flex items-center justify-center"
        >
          {resolvedTheme === 'dark' ? (
            <Sun size={19} className="text-text-primary hover:rotate-45 transition-transform" />
          ) : (
            <Moon size={19} className="text-text-primary hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Direct Messages Quick Entry */}
        {status === 'authenticated' && user && !isAuthPage && (
          <Link
            to="/messages"
            aria-label={unreadMessages > 0 ? `Direct Messages (${unreadMessages} unread)` : 'Direct Messages'}
            title="Direct Messages"
            className={`relative p-2 sm:p-2.5 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary min-w-[38px] min-h-[38px] flex items-center justify-center ${
              currentPath.startsWith('/messages')
                ? 'bg-black/[0.05] dark:bg-white/[0.10] text-text-primary font-bold'
                : 'text-text-secondary hover:text-text-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.08]'
            }`}
          >
            <MessageSquare size={19} className={currentPath.startsWith('/messages') ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
            {unreadMessages > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs ring-2 ring-canvas leading-none">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            )}
          </Link>
        )}

        {/* Notification Bell */}
        <NotificationBell />

        {/* Account controls */}
        {status === 'authenticated' && user && !isAuthPage ? (
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              aria-label={`User account menu for ${user.display_name}`}
              aria-haspopup="menu"
              aria-expanded={profileMenuOpen}
              className="flex items-center gap-2 p-1 sm:p-1.5 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary"
            >
              <Avatar src={user.avatar_url} alt={user.display_name} size="sm" />
              <span className="hidden xl:inline-block text-xs font-semibold text-text-primary">
                u/{user.username}
              </span>
              <ChevronDown
                size={14}
                className={`text-text-muted transition-transform duration-150 ${
                  profileMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {profileMenuOpen && (
              <div
                role="menu"
                aria-label="User Account Options"
                className="absolute right-0 top-full mt-2 w-56 bg-surface-card/95 backdrop-blur-md rounded-2xl border border-border/60 shadow-xl p-1.5 z-50 animate-scale-in"
              >
                {/* User Identity Header */}
                <div className="px-3 py-2.5 border-b border-border/40 mb-1">
                  <p className="text-xs font-bold text-text-primary">{user.display_name}</p>
                  <p className="text-[11px] text-text-muted">u/{user.username}</p>
                </div>
                {logoutError && (
                  <p role="alert" className="px-3 py-2 text-xs text-rose-600">
                    {logoutError}
                  </p>
                )}

                {/* Menu Links */}
                <Link
                  to={`/u/${user.username}`}
                  role="menuitem"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors"
                >
                  <User size={15} className="text-text-muted" />
                  <span>Your Profile</span>
                </Link>

                <Link
                  to="/saved"
                  role="menuitem"
                  onClick={() => setProfileMenuOpen(false)}
                  className="inline-flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors"
                >
                  <Bookmark size={15} className="text-text-muted shrink-0" />
                  <span>Saved Collections</span>
                </Link>

                <Link
                  to="/settings/appearance"
                  role="menuitem"
                  onClick={() => setProfileMenuOpen(false)}
                  className="inline-flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors"
                >
                  <Palette size={15} className="text-text-muted shrink-0" />
                  <span>Appearance &amp; Themes</span>
                </Link>

                <div className="border-t border-border/60 my-1" />

                <Link
                  to="/settings"
                  role="menuitem"
                  onClick={() => setProfileMenuOpen(false)}
                  className="inline-flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors"
                >
                  <Settings size={15} className="text-text-muted shrink-0" />
                  <span>Settings</span>
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void handleLogout()}
                  className="inline-flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer group"
                >
                  <LogOut size={15} className="text-text-muted group-hover:text-rose-600 shrink-0" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        ) : status === 'unauthenticated' ? (
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold">
            <Link
              to="/login"
              className="text-text-secondary hover:text-text-primary transition-colors px-2 py-1.5 rounded-lg"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-primary hover:bg-primary-hover px-3.5 py-1.5 text-white transition-colors shadow-xs font-bold"
            >
              Sign up
            </Link>
          </div>
        ) : status === 'loading' ? (
          <span role="status" className="text-xs text-text-muted">
            Checking session…
          </span>
        ) : isAuthPage ? (
          <Link to="/" className="text-xs sm:text-sm font-semibold text-primary hover:underline">
            Continue to app
          </Link>
        ) : null}
      </div>
    </header>
  );
}
export default TopHeader;