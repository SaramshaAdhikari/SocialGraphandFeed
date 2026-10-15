import { useState } from 'react';
import { useRouter, Link } from '../../router/Router';
import { SearchBar, Avatar } from '../ui';

export function TopHeader() {
  const { navigate, query } = useRouter();
  const [searchVal, setSearchVal] = useState(query.q || '');

  const handleSearchSubmit = (val: string) => {
    if (val.trim()) {
      navigate(`/search?q=${encodeURIComponent(val.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-sm border-b border-[#E2E8F0] px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Mobile Brand Mark */}
      <div className="flex items-center gap-2.5 md:hidden">
        <Link to="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-lg p-0.5">
          <div className="w-8 h-8 rounded-lg bg-[#0F172A] text-white flex items-center justify-center font-bold text-sm shrink-0">
            SG
          </div>
          <span className="font-bold text-sm text-[#0F172A]">SocialGraph</span>
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

      {/* Right Controls: User Profile Quick Access */}
      <div className="flex items-center gap-3">
        <Link
          to="/u/alex_dev"
          className="flex items-center gap-2 p-1.5 rounded-full hover:bg-[#F4F4F5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          aria-label="View user profile"
        >
          <Avatar alt="Alex Dev" size="sm" />
          <span className="hidden xl:inline-block text-xs font-semibold text-[#0F172A]">
            u/alex_dev
          </span>
        </Link>
      </div>
    </header>
  );
}
