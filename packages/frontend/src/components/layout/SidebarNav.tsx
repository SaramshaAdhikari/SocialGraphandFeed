import { Home, Compass, Users, Search, Bookmark, User, Activity, Palette, PlusCircle, Network } from 'lucide-react';
import { Link, useRouter } from '../../router/Router';
import { useAuth } from '../../auth/AuthContext';

interface NavItem {
  label: string;
  to: string;
  icon: typeof Home;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Home Feed', to: '/', icon: Home, exact: true },
  { label: 'Discover', to: '/explore', icon: Compass },
  { label: 'Create', to: '/create', icon: PlusCircle },
  { label: 'Communities', to: '/communities', icon: Users },
  { label: 'Search', to: '/search', icon: Search },
  { label: 'Social Graph', to: '/graph', icon: Network },
  { label: 'Saved', to: '/saved', icon: Bookmark },
  { label: 'Appearance', to: '/settings/appearance', icon: Palette },
  { label: 'Diagnostics', to: '/diagnostics', icon: Activity },
];

export function SidebarNav() {
  const { currentPath } = useRouter();
  const { user, status } = useAuth();
  const items = user && status === 'authenticated' ? [...navItems, { label: 'Profile', to: `/u/${user.username}`, icon: User }] : navItems;

  return (
    <aside
      className="hidden md:flex flex-col shrink-0 border-r border-[#E2E8F0] dark:border-[#2E3544] bg-white dark:bg-[#181B22] transition-colors select-none md:w-18 lg:w-60 min-h-screen sticky top-0"
      aria-label="Main Navigation"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 lg:px-6 border-b border-[#F1F5F9] dark:border-[#262B36]">
        <Link to="/" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1">
          <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg tracking-tight shrink-0 shadow-sm">
            SG
          </div>
          <span className="hidden lg:inline-block font-bold text-base text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
            SocialGraph
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-2 lg:px-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? currentPath === item.to
            : item.to === '/'
            ? currentPath === '/'
            : currentPath.startsWith(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              exact={item.exact}
              className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isActive
                  ? 'bg-primary text-white shadow-sm font-semibold'
                  : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F4F4F5] dark:hover:bg-[#262B36]'
              }`}
            >
              <Icon
                size={20}
                className={`shrink-0 transition-transform group-hover:scale-105 ${
                  isActive ? 'text-white' : 'text-[#64748B] dark:text-[#94A3B8]'
                }`}
                aria-hidden="true"
              />
              <span className="hidden lg:inline-block truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 lg:p-4 border-t border-[#F1F5F9] dark:border-[#262B36] hidden lg:block text-xs text-[#94A3B8] dark:text-[#64748B]">
        <p className="font-medium text-[#64748B] dark:text-[#94A3B8]">SocialGraph Platform</p>
        <p className="mt-0.5">High-Scale Feed Engine</p>
      </div>
    </aside>
  );
}
