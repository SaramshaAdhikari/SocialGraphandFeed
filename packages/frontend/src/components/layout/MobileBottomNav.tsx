import { Home, Compass, PlusCircle, Search, User, LogIn } from 'lucide-react';
import { Link, useRouter } from '../../router/Router';
import { useAuth } from '../../auth/AuthContext';

export function MobileBottomNav() {
  const { currentPath } = useRouter();
  const { user, status } = useAuth();

  const items = [
    { label: 'Home', to: '/', icon: Home, exact: true },
    { label: 'Discover', to: '/explore', icon: Compass },
    { label: 'Create', to: '/create', icon: PlusCircle },
    { label: 'Search', to: '/search', icon: Search },
    ...(user && status === 'authenticated'
      ? [{ label: 'Profile', to: `/u/${user.username}`, icon: User }]
      : [{ label: 'Sign In', to: '/login', icon: LogIn }]),
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-canvas/90 backdrop-blur-lg border-t border-border/40 px-2 pb-[env(safe-area-inset-bottom)] flex items-center justify-around select-none transition-colors"
      aria-label="Mobile Navigation"
    >
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
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center min-w-[48px] min-h-[44px] px-2 py-1 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary ${
              isActive
                ? 'text-text-primary font-bold'
                : 'text-text-muted hover:text-text-primary active:scale-95'
            }`}
          >
            <Icon size={21} className={isActive ? 'stroke-[2.5px] text-text-primary' : 'stroke-[1.8px] text-text-muted'} />
            <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default MobileBottomNav;
