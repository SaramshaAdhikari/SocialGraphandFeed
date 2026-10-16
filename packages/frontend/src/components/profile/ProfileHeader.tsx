import React, { useState } from 'react';
import type { UserProfile } from '@socialgraph/shared';
import { Calendar, Link2, Settings, UserPlus, UserCheck, Share2, Check } from 'lucide-react';
import { Avatar, Button } from '../ui';
import { Link } from '../../router/Router';

export interface ProfileHeaderProps {
  profile: UserProfile;
  isSelf: boolean;
  onToggleFollow: () => Promise<void>;
  className?: string;
}

export function ProfileHeader({
  profile,
  isSelf,
  onToggleFollow,
  className = '',
}: ProfileHeaderProps) {
  const [followSubmitting, setFollowSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleFollowClick = async () => {
    if (followSubmitting) return;
    setFollowSubmitting(true);
    try {
      await onToggleFollow();
    } catch {
      // Error handled by hook rollback
    } finally {
      setFollowSubmitting(false);
    }
  };

  const handleShareProfile = async () => {
    try {
      const profileUrl = `${window.location.origin}/u/${profile.username}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(profileUrl);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Format joined date (e.g., "Joined January 2026")
  const formattedJoinedDate = React.useMemo(() => {
    try {
      const d = new Date(profile.created_at);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return '2026';
    }
  }, [profile.created_at]);

  // Clean website URL display
  const cleanWebsiteUrl = profile.website?.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <div
      data-testid="profile-header"
      className={`bg-white dark:bg-[#181B22] rounded-3xl border border-[#E2E8F0] dark:border-[#2E3544] overflow-hidden shadow-xs transition-colors ${className}`}
    >
      {/* Optional Creator Profile Banner */}
      {profile.banner_url ? (
        <div className="relative w-full h-36 sm:h-48 md:h-56 bg-slate-100 dark:bg-[#12141A] overflow-hidden">
          <img
            src={profile.banner_url}
            alt={`${profile.display_name} cover banner`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        </div>
      ) : (
        <div className="w-full h-24 sm:h-32 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10" />
      )}

      {/* Profile Identity Body */}
      <div className="px-4 sm:px-8 pb-6 sm:pb-8 pt-0 relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-4">
          {/* Avatar with Ring Border */}
          <div className="relative shrink-0">
            <div className="p-1 rounded-full bg-white dark:bg-[#181B22] shadow-md inline-block">
              <Avatar
                src={profile.avatar_url}
                alt={profile.display_name}
                size="xl"
                className="w-24 h-24 sm:w-28 sm:h-28 ring-2 ring-primary/20 dark:ring-primary/40"
              />
            </div>
            {profile.is_verified && (
              <span
                title="Verified Creator"
                className="absolute bottom-1 right-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold ring-2 ring-white dark:ring-[#181B22] shadow-sm"
              >
                ✓
              </span>
            )}
          </div>

          {/* Action Row: Follow / Edit Profile & Share */}
          <div className="flex items-center gap-2.5 sm:mb-2 self-start sm:self-end">
            {isSelf ? (
              <Link
                to="/settings"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-[#CBD5E1] dark:border-[#3E475A] text-[#0F172A] dark:text-[#F8FAFC] hover:bg-[#F4F4F5] dark:hover:bg-[#262B36] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer shadow-xs"
              >
                <Settings size={15} />
                <span>Edit Profile</span>
              </Link>
            ) : (
              <Button
                variant={profile.is_following ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleFollowClick}
                disabled={followSubmitting}
                className="min-w-[108px] font-semibold"
                aria-pressed={profile.is_following}
              >
                {profile.is_following ? (
                  <>
                    <UserCheck size={16} />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Follow</span>
                  </>
                )}
              </Button>
            )}

            {/* Share Profile Button */}
            <button
              type="button"
              onClick={handleShareProfile}
              aria-label="Share profile link"
              className="p-2 sm:p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#3E475A] text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F4F4F5] dark:hover:bg-[#262B36] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              title="Copy profile link"
            >
              {copiedLink ? (
                <Check size={16} className="text-emerald-500" />
              ) : (
                <Share2 size={16} />
              )}
            </button>
          </div>
        </div>

        {/* Identity & Bio Information */}
        <div className="space-y-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight flex items-center gap-2">
              <span>{profile.display_name}</span>
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#64748B] dark:text-[#94A3B8]">
              @{profile.username}
            </p>
          </div>

          {/* Biography */}
          {profile.bio && (
            <p className="text-sm text-[#334155] dark:text-[#CBD5E1] max-w-2xl leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          )}

          {/* Metadata Row: Website & Joined Date */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#64748B] dark:text-[#94A3B8] pt-0.5">
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-primary hover:underline font-medium"
              >
                <Link2 size={14} className="shrink-0" />
                <span>{cleanWebsiteUrl || profile.website}</span>
              </a>
            )}

            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="shrink-0 text-[#94A3B8]" />
              <span>Joined {formattedJoinedDate}</span>
            </div>
          </div>

          {/* Metric Stats Counters (Posts / Followers / Following) */}
          <div className="flex items-center gap-6 sm:gap-8 pt-3 border-t border-[#F1F5F9] dark:border-[#262B36] text-xs sm:text-sm">
            <div>
              <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC] tabular-nums">
                {profile.posts_count.toLocaleString()}
              </span>{' '}
              <span className="text-[#64748B] dark:text-[#94A3B8]">Posts</span>
            </div>

            <div data-testid="profile-stat-followers">
              <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC] tabular-nums">
                {profile.followers_count.toLocaleString()}
              </span>{' '}
              <span className="text-[#64748B] dark:text-[#94A3B8]">Followers</span>
            </div>

            <div>
              <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC] tabular-nums">
                {profile.following_count.toLocaleString()}
              </span>{' '}
              <span className="text-[#64748B] dark:text-[#94A3B8]">Following</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
