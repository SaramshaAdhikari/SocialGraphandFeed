import { Home, Compass, Users, Search, Bookmark, User, Palette, PlusCircle, Activity, ArrowRight, Network, MessageSquare, Bell } from 'lucide-react';
import { Link, useRouter } from '../../router/Router';
import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api';
import { BrandLogo } from '../brand/BrandLogo';

interface NavItem {
  label: string;
  to: string;
  icon: typeof Home;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Home Feed', to: '/', icon: Home, exact: true },
  { label: 'Discover', to: '/explore', icon: Compass },
  { label: 'Create Post', to: '/create', icon: PlusCircle },
  { label: 'Communities', to: '/communities', icon: Users },
  { label: 'Search', to: '/search', icon: Search },
  { label: 'Social Graph', to: '/graph', icon: Network },
  { label: 'Saved', to: '/saved', icon: Bookmark },
  { label: 'Diagnostics', to: '/diagnostics', icon: Activity },
  { label: 'Appearance', to: '/settings/appearance', icon: Palette },
];

export function SidebarNav() {
  const { currentPath } = useRouter();
  const { user, status } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);

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
  const items = user && status === 'authenticated'
    ? [
        ...navItems.slice(0, 3),
        { label: 'Messages', to: '/messages', icon: MessageSquare },
        { label: 'Notifications', to: '/notifications', icon: Bell },
        ...navItems.slice(3),
        { label: 'My Profile', to: `/u/${user.username}`, icon: User },
      ]
    : navItems;

  return (
    <aside
      className="hidden md:flex flex-col justify-between shrink-0 border-r border-border/40 bg-canvas transition-colors select-none md:w-18 lg:w-64 fixed top-0 bottom-0 left-0 z-30 h-screen overflow-y-auto no-scrollbar"
      aria-label="Main Navigation"
    >
      {/* Top Section: Brand + Navigation Items */}
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-18 flex items-center px-4 lg:px-6 pt-2">
          <Link
            to="/"
            className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary rounded-xl p-1 -m-1 group"
          >
            {/* Desktop Full Logo */}
            <div className="hidden lg:block">
              <BrandLogo size="md" showSubtitle />
            </div>
            {/* Tablet Compact Symbol */}
            <div className="lg:hidden flex justify-center w-full">
              <BrandLogo variant="symbol" size="md" />
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="py-3 px-2 lg:px-3 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? currentPath === item.to
              : item.to === '/'
              ? currentPath === '/'
              : item.to.startsWith('/settings')
              ? currentPath.startsWith('/settings')
              : currentPath.startsWith(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                exact={item.exact}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex items-center gap-4 px-3.5 py-3 rounded-xl text-[14px] transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary ${
                  isActive
                    ? 'text-text-primary font-bold bg-black/[0.04] dark:bg-white/[0.08]'
                    : 'text-text-secondary hover:text-text-primary hover:bg-black/[0.03] dark:hover:bg-white/[0.05] font-normal'
                }`}
              >
                <div className="relative shrink-0 flex items-center justify-center">
                  <Icon
                    size={22}
                    className={`transition-all duration-150 ${
                      isActive
                        ? 'text-text-primary stroke-[2.5px]'
                        : 'text-text-secondary group-hover:text-text-primary stroke-[1.8px] group-hover:scale-105'
                    }`}
                  />
                  {item.to === '/messages' && unreadMessages > 0 && (
                    <span className="lg:hidden absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-canvas" />
                  )}
                </div>

                <span className="hidden lg:inline truncate flex-1 tracking-tight">{item.label}</span>
                {item.to === '/messages' && unreadMessages > 0 && (
                  <span className="hidden lg:inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-500 text-white leading-none shadow-xs">
                    {unreadMessages}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Quick Glance (Desktop only) */}
      {user && status === 'authenticated' && (
        <div className="p-3 mb-2 hidden lg:block">
          <Link
            to={`/u/${user.username}`}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors group"
          >
            <div className="relative">
              <img
                src={user.avatar_url}
                alt={user.display_name}
                className="w-9 h-9 rounded-full object-cover ring-1 ring-border"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-canvas" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-text-primary truncate transition-colors">
                {user.display_name}
              </p>
              <p className="text-[11px] text-text-muted truncate font-mono">@{user.username}</p>
            </div>
            <ArrowRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>
      )}
    </aside>
  );
}

export default SidebarNav;
