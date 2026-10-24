import React, { useEffect, useRef, useState } from 'react';
import type { UserProfile } from '@socialgraph/shared';
import { Calendar, Link2, Settings, UserPlus, UserCheck, Share2, Check, X } from 'lucide-react';
import { Avatar, Button } from '../ui';
import { Link } from '../../router/Router';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import type { FollowListResponse } from '@socialgraph/shared';

export interface ProfileHeaderProps {
  profile: UserProfile;
  isSelf: boolean;
  onToggleFollow: () => Promise<void>;
  onProfileRefresh?: () => Promise<void>;
  className?: string;
}

export function ProfileHeader({
  profile,
  isSelf,
  onToggleFollow,
  onProfileRefresh,
  className = '',
}: ProfileHeaderProps) {
  const [followSubmitting, setFollowSubmitting] = useState(false);
  const [followError, setFollowError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  const [listType, setListType] = useState<'followers' | 'following' | null>(null);
  const [list, setList] = useState<FollowListResponse | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [listBusy, setListBusy] = useState<string | null>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!listType) return;
    let active = true;
    setListLoading(true);
    setListError('');
    setList(null);
    const load = listType === 'followers' ? api.getFollowers : api.getFollowing;
    load.call(api, profile.username, null, 20)
      .then((result) => {
        if (active) setList(result);
      })
      .catch(() => {
        if (active) setListError('Could not load this list. Please try again.');
      })
      .finally(() => {
        if (active) setListLoading(false);
      });
    return () => {
      active = false;
    };
  }, [listType, profile.username]);

  useEffect(() => {
    if (!listType) return;
    dialogRef.current?.querySelector<HTMLElement>('button, a[href]')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setListType(null);
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
        )
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      openerRef.current?.focus();
    };
  }, [listType]);

  const openList = (type: 'followers' | 'following', event: React.MouseEvent<HTMLButtonElement>) => {
    openerRef.current = event.currentTarget;
    setListType(type);
  };

  const loadMore = async () => {
    if (!listType || !list?.next_cursor || listLoading) return;
    setListLoading(true);
    setListError('');
    try {
      const next =
        listType === 'followers'
          ? await api.getFollowers(profile.username, list.next_cursor, 20)
          : await api.getFollowing(profile.username, list.next_cursor, 20);
      setList((previous) => (previous ? { ...next, data: [...previous.data, ...next.data] } : next));
    } catch {
      setListError('Could not load more accounts. Please try again.');
    } finally {
      setListLoading(false);
    }
  };

  const toggleListedUser = async (id: string, isFollowing: boolean) => {
    setListBusy(id);
    setListError('');
    try {
      const result = await api.toggleFollow(id, !isFollowing);
      setList((previous) =>
        previous
          ? {
              ...previous,
              data: previous.data.map((entry) =>
                entry.id === id ? { ...entry, is_following: result.is_following } : entry
              ),
            }
          : previous
      );
      try {
        const refreshed =
          listType === 'followers'
            ? await api.getFollowers(profile.username)
            : await api.getFollowing(profile.username);
        setList(refreshed);
      } catch {
        setListError('Follow status updated, but this list could not be refreshed. Please reopen it to retry.');
      }
      try {
        await onProfileRefresh?.();
      } catch {
        setListError('Follow status updated, but profile counts could not be refreshed. Please reload the profile.');
      }
    } catch {
      setListError('The follow change failed. Please try again.');
    } finally {
      setListBusy(null);
    }
  };

  const handleFollowClick = async () => {
    if (followSubmitting) return;
    setFollowSubmitting(true);
    setFollowError('');
    try {
      await onToggleFollow();
    } catch {
      setFollowError('Could not update follow status. Please try again.');
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
  const cleanWebsiteUrl = profile.website?.startsWith('/')
    ? profile.website.replace(/^\//, '').replace(/\/$/, '')
    : profile.website?.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <div
      data-testid="profile-header"
      className={`bg-surface-card rounded-3xl border border-border overflow-hidden shadow-xs transition-colors ${className}`}
    >
      {/* Optional Creator Profile Banner */}
      {profile.banner_url && !bannerError ? (
        <div className="relative w-full h-36 sm:h-48 md:h-56 bg-surface-subtle overflow-hidden">
          <img
            src={profile.banner_url}
            alt={`${profile.display_name} cover banner`}
            onError={() => setBannerError(true)}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        </div>
      ) : (
        <div className="w-full h-28 sm:h-36 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent" />
      )}

      {/* Profile Identity Body */}
      <div className="px-4 sm:px-8 pb-6 sm:pb-8 pt-0 relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-4">
          {/* Avatar with Ring Border */}
          <div className="relative shrink-0">
            <div className="p-1 rounded-full bg-surface-card shadow-md inline-block">
              <Avatar
                src={profile.avatar_url}
                alt={profile.display_name}
                size="xl"
                className="w-24 h-24 sm:w-28 sm:h-28 ring-2 ring-primary/20"
              />
            </div>
            {profile.is_verified && (
              <span
                title="Verified Creator"
                className="absolute bottom-1 right-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold ring-2 ring-surface-card shadow-xs"
              >
                ✓
              </span>
            )}
          </div>
          {followError && <p role="alert" className="text-xs text-rose-600">{followError}</p>}

          {/* Action Row: Follow / Edit Profile & Share */}
          <div className="flex items-center gap-2.5 sm:mb-2 self-start sm:self-end">
            {isSelf ? (
              <Link
                to="/settings"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-border text-text-primary hover:bg-surface-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer shadow-xs"
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
                className="min-w-[108px] font-bold rounded-xl"
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
              className="p-2 sm:p-2.5 rounded-xl border border-border text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2">
              <span>{profile.display_name}</span>
            </h1>
            <p className="text-xs sm:text-sm font-medium text-text-muted">
              @{profile.username}
            </p>
          </div>

          {/* Biography */}
          {profile.bio && (
            <p className="text-sm text-text-secondary max-w-2xl leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          )}

          {/* Metadata Row: Website & Joined Date */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-muted pt-0.5">
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-primary hover:underline font-semibold"
              >
                <Link2 size={14} className="shrink-0" />
                <span>{cleanWebsiteUrl || profile.website}</span>
              </a>
            )}

            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="shrink-0" />
              <span>Joined {formattedJoinedDate}</span>
            </div>
          </div>

          {/* Metric Stats Counters (Posts / Followers / Following) */}
          <div className="flex items-center gap-6 sm:gap-8 pt-3 border-t border-border/60 text-xs sm:text-sm">
            <div>
              <span className="font-bold text-text-primary tabular-nums font-mono">
                {profile.posts_count.toLocaleString()}
              </span>{' '}
              <span className="text-text-muted">Posts</span>
            </div>

            <button
              type="button"
              data-testid="profile-stat-followers"
              onClick={(event) => openList('followers', event)}
              className="text-left hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded cursor-pointer"
            >
              <span className="font-bold text-text-primary tabular-nums font-mono">
                {profile.followers_count.toLocaleString()}
              </span>{' '}
              <span className="text-text-muted">Followers</span>
            </button>

            <button
              type="button"
              data-testid="profile-stat-following"
              onClick={(event) => openList('following', event)}
              className="text-left hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded cursor-pointer"
            >
              <span className="font-bold text-text-primary tabular-nums font-mono">
                {profile.following_count.toLocaleString()}
              </span>{' '}
              <span className="text-text-muted">Following</span>
            </button>
          </div>
        </div>
      </div>

      {/* Followers / Following Modal Dialog */}
      {listType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setListType(null);
          }}
        >
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="follow-list-title"
            tabIndex={-1}
            className="w-full max-w-md max-h-[80vh] overflow-hidden rounded-3xl bg-surface-card shadow-2xl border border-border flex flex-col animate-scale-in"
          >
            <header className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <h2 id="follow-list-title" className="font-bold text-base text-text-primary capitalize">
                {listType === 'followers' ? 'Followers' : 'Following'}
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setListType(null)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-subtle cursor-pointer"
              >
                <X size={18} />
              </button>
            </header>
            <div className="overflow-y-auto p-4 space-y-3">
              {listLoading && !list && <p role="status" className="text-xs text-text-muted">Loading accounts…</p>}
              {listError && <p role="alert" className="text-sm text-rose-600">{listError}</p>}
              {!listLoading && list?.data.length === 0 && (
                <p className="py-8 text-center text-sm text-text-muted">No {listType} yet.</p>
              )}
              {list?.data.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3">
                  <Link
                    to={`/u/${encodeURIComponent(entry.username)}`}
                    onClick={() => setListType(null)}
                    className="flex min-w-0 flex-1 items-center gap-3 group"
                  >
                    <Avatar src={entry.avatar_url} alt={entry.display_name} size="sm" />
                    <span className="min-w-0">
                      <strong className="block truncate text-sm text-text-primary group-hover:text-primary">
                        {entry.display_name}
                      </strong>
                      <span className="block truncate text-xs text-text-muted">@{entry.username}</span>
                    </span>
                  </Link>
                  {user && user.id !== entry.id && (
                    <Button
                      size="sm"
                      variant={entry.is_following ? 'secondary' : 'primary'}
                      disabled={listBusy === entry.id}
                      onClick={() => void toggleListedUser(entry.id, entry.is_following)}
                      className="font-semibold text-xs rounded-full"
                    >
                      {entry.is_following ? 'Following' : 'Follow'}
                    </Button>
                  )}
                </div>
              ))}
              {list?.has_more && (
                <Button
                  variant="secondary"
                  disabled={listLoading}
                  onClick={() => void loadMore()}
                  className="w-full font-semibold"
                >
                  {listLoading ? 'Loading…' : 'Load more'}
                </Button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
export default ProfileHeader;
