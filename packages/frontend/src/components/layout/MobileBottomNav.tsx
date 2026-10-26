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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-surface-card/95 backdrop-blur-md border-t border-border px-2 flex items-center justify-around select-none transition-colors"
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
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isActive ? 'text-primary font-bold' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Icon size={22} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
            <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default MobileBottomNav;
