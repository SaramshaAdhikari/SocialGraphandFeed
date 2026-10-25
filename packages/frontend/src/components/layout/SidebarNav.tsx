import { Home, Compass, Users, Search, Bookmark, User, Palette, PlusCircle, Activity, ArrowRight, Network } from 'lucide-react';
import { Link, useRouter } from '../../router/Router';
import { useAuth } from '../../auth/AuthContext';
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
  const items = user && status === 'authenticated'
    ? [...navItems, { label: 'My Profile', to: `/u/${user.username}`, icon: User }]
    : navItems;

  return (
    <aside
      className="hidden md:flex flex-col justify-between shrink-0 border-r border-border bg-canvas transition-colors select-none md:w-18 lg:w-64 fixed top-0 bottom-0 left-0 z-30 h-screen overflow-y-auto no-scrollbar"
      aria-label="Main Navigation"
    >
      {/* Top Section: Brand + Navigation Items */}
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-3.5 lg:px-6 border-b border-border/60">
          <Link
            to="/"
            className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1 -m-1 group"
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
        <nav className="py-4 px-2 lg:px-3 space-y-1.5">
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
                className={`relative flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? 'bg-primary-soft text-primary font-bold shadow-xs'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle font-medium'
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  size={19}
                  className={`shrink-0 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-primary'
                  }`}
                  aria-hidden="true"
                />
                <span className="hidden lg:inline-block truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Promo & Platform Badge */}
      <div className="p-3 lg:p-4 border-t border-border/60 hidden lg:block space-y-3">
        {/* Network Invitation Card */}
        <div className="relative overflow-hidden rounded-2xl p-3.5 bg-gradient-to-br from-surface-subtle to-surface-card border border-border">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/15 via-secondary/10 to-transparent rounded-full blur-xl pointer-events-none" />
          <p className="text-xs font-semibold text-text-primary leading-snug">
            A more connected world for deeper ideas.
          </p>
          <Link
            to="/explore"
            className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover transition-colors group/cta"
          >
            <span>Explore Network</span>
            <ArrowRight size={13} className="transition-transform group-hover/cta:translate-x-0.5" />
          </Link>
        </div>

        {/* Footer Brand Pillars & High-Scale Badge */}
        <div className="text-center pt-1 text-[11px] text-text-muted">
          <p className="font-medium tracking-tight">SocialGraph &bull; Build &bull; Explore &bull; Belong</p>
          <p className="text-[10px] mt-0.5 text-text-muted/80">High-Scale Feed Architecture</p>
        </div>
      </div>
    </aside>
  );
}

export default SidebarNav;
