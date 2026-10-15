import { Home, Compass, Users, Search, User } from 'lucide-react';
import { Link, useRouter } from '../../router/Router';

export function MobileBottomNav() {
  const { currentPath } = useRouter();

  const items = [
    { label: 'Home', to: '/', icon: Home, exact: true },
    { label: 'Discover', to: '/explore', icon: Compass },
    { label: 'Search', to: '/search', icon: Search },
    { label: 'Communities', to: '/communities', icon: Users },
    { label: 'Profile', to: '/u/alex_dev', icon: User },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] px-2 flex items-center justify-around select-none"
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
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
              isActive ? 'text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'
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
