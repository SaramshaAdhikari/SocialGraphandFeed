import { useState } from 'react';
import type { Community } from '@socialgraph/shared';
import { Users, Check, Plus } from 'lucide-react';
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
  const [bannerError, setBannerError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const isMember = community.is_member;
  const formattedMembers = new Intl.NumberFormat('en-US').format(community.members_count);

  return (
    <header
      data-testid="community-header"
      className={`rounded-3xl border border-border bg-surface-card overflow-hidden shadow-xs mb-6 transition-colors ${className}`}
    >
      {/* Community Banner Image with Deep Radial Backing */}
      <div className="relative h-32 sm:h-44 md:h-52 w-full bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 overflow-hidden">
        {community.banner_url && !bannerError ? (
          <img
            src={community.banner_url}
            alt={`${community.name} banner`}
            onError={() => setBannerError(true)}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className="w-full h-full opacity-30 bg-[radial-gradient(rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:16px_16px]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Community Identity Bar */}
      <div className="px-4 sm:px-6 pb-5 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-3">
          {/* Avatar / Icon */}
          <div className="flex items-end gap-3 sm:gap-4">
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-2xl border-4 border-surface-card bg-surface-card shadow-md overflow-hidden shrink-0 flex items-center justify-center">
              {community.avatar_url && !avatarError ? (
                <img
                  src={community.avatar_url}
                  alt={community.name}
                  onError={() => setAvatarError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl sm:text-4xl font-extrabold text-primary uppercase font-mono">
                  {community.slug.slice(0, 2)}
                </span>
              )}
            </div>

            {/* Title & Slug */}
            <div className="min-w-0 pb-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-text-primary leading-tight truncate">
                {community.name}
              </h1>
              <span className="text-xs sm:text-sm font-bold text-primary">
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
              className="h-9 px-4 font-bold text-xs sm:text-sm rounded-full shadow-xs"
              leftIcon={
                isMember ? (
                  <Check size={16} className="text-emerald-500" />
                ) : (
                  <Plus size={16} />
                )
              }
            >
              <span>{isMember ? 'Joined' : 'Join Hub'}</span>
            </Button>
          </div>
        </div>

        {/* Short Description & Counts */}
        <div className="space-y-2">
          {community.description && (
            <p className="text-xs sm:text-sm text-text-secondary max-w-3xl leading-relaxed">
              {community.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-text-muted pt-1">
            <div className="flex items-center gap-1.5 font-medium">
              <Users size={14} className="text-primary" />
              <span className="font-bold text-text-primary font-mono">{formattedMembers}</span>
              <span>members</span>
            </div>
            {membershipError && (
              <span role="alert" className="text-xs text-rose-500 font-medium">
                {membershipError.message || 'Membership update failed.'}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
export default CommunityHeader;
