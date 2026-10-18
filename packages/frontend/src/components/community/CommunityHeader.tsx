import type { Community } from '@socialgraph/shared';
import { Users, Check, Plus, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';

export interface CommunityHeaderProps {
  community: Community;
  onToggleMembership: () => void | Promise<void>;
  membershipPending?: boolean;
  membershipError?: Error | null;
  className?: string;
}

export function CommunityHeader({
  community,
  onToggleMembership,
  membershipPending = false,
  membershipError,
  className = '',
}: CommunityHeaderProps) {
  const isMember = community.is_member;
  const formattedMembers = new Intl.NumberFormat('en-US').format(community.members_count);

  // Parse creation year/month
  const formattedCreationDate = (() => {
    try {
      const d = new Date(community.created_at);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return 'Jan 2026';
    }
  })();

  return (
    <header
      data-testid="community-header"
      className={`rounded-2xl border border-[#E2E8F0] dark:border-[#2E3544] bg-white dark:bg-[#181B22] overflow-hidden shadow-xs mb-6 ${className}`}
    >
      {/* Community Banner Image */}
      <div className="relative h-32 sm:h-44 md:h-52 w-full bg-linear-to-r from-indigo-900 via-indigo-950 to-slate-900 overflow-hidden">
        {community.banner_url ? (
          <img
            src={community.banner_url}
            alt={`${community.name} banner`}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className="w-full h-full opacity-40 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:16px_16px]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      {/* Community Identity Bar */}
      <div className="px-4 sm:px-6 pb-5 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-3">
          {/* Avatar / Icon */}
          <div className="flex items-end gap-3 sm:gap-4">
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-2xl border-4 border-white dark:border-[#181B22] bg-white dark:bg-[#1E2330] shadow-md overflow-hidden shrink-0 flex items-center justify-center">
              {community.avatar_url ? (
                <img
                  src={community.avatar_url}
                  alt={community.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl sm:text-4xl font-extrabold text-primary uppercase">
                  {community.slug.slice(0, 2)}
                </span>
              )}
            </div>

            {/* Title & Slug */}
            <div className="min-w-0 pb-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] leading-tight truncate">
                {community.name}
              </h1>
              <span className="text-xs sm:text-sm font-semibold text-primary">
                {`c/${community.slug}`}
              </span>
            </div>
          </div>

          {/* Membership Action Button */}
          <div className="flex items-center gap-2 self-start sm:self-end">
            <Button
              variant={isMember ? 'secondary' : 'primary'}
              size="sm"
              onClick={onToggleMembership}
              disabled={membershipPending}
              isLoading={membershipPending}
              aria-pressed={isMember}
              className="h-9 px-4 font-semibold text-xs sm:text-sm rounded-full shadow-xs"
              leftIcon={
                isMember ? (
                  <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Plus size={16} />
                )
              }
            >
              <span>{isMember ? 'Joined' : 'Join Hub'}</span>
            </Button>
          </div>
        </div>

        {membershipError && (
          <p role="alert" className="mb-3 text-xs text-red-600 dark:text-red-400">
            {membershipError.message}
          </p>
        )}

        {/* Description */}
        <p className="text-sm text-[#475569] dark:text-[#CBD5E1] leading-relaxed max-w-3xl mb-3">
          {community.description}
        </p>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
          <div className="flex items-center gap-1.5 font-medium">
            <Users size={14} className="text-primary" />
            <span className="text-[#0F172A] dark:text-[#F8FAFC] font-semibold">
              {formattedMembers}
            </span>
            <span>members</span>
          </div>

          <span className="text-[#CBD5E1] dark:text-[#475569]">•</span>

          <div className="flex items-center gap-1.5 font-medium">
            <Calendar size={14} />
            <span>Created {formattedCreationDate}</span>
          </div>

          {community.rules && community.rules.length > 0 && (
            <>
              <span className="text-[#CBD5E1] dark:text-[#475569]">•</span>
              <span>{community.rules.length} rules</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
