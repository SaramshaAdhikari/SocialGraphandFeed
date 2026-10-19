import { useEffect, useState } from 'react';
import type { UserProfile } from '@socialgraph/shared';
import { UserCheck, UserPlus, CheckCircle2 } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Link } from '../../router/Router';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';

export interface UserSearchResultCardProps {
  user: UserProfile;
  className?: string;
  onFollowToggle?: (userId: string, isFollowing: boolean) => void;
}

export function UserSearchResultCard({
  user,
  className = '',
  onFollowToggle,
}: UserSearchResultCardProps) {
  const [isFollowing, setIsFollowing] = useState(user.is_following);
  const [followersCount, setFollowersCount] = useState(user.followers_count);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user: viewer } = useAuth();

  useEffect(() => { setIsFollowing(user.is_following); setFollowersCount(user.followers_count); }, [user.id, user.is_following, user.followers_count]);

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!viewer || submitting) { setError('Sign in to follow accounts.'); return; }
    const nextState = !isFollowing;
    setSubmitting(true); setError('');
    try {
      const result = await api.toggleFollow(user.id, nextState);
      setIsFollowing(result.is_following);
      setFollowersCount(result.followers_count);
      onFollowToggle?.(user.id, result.is_following);
    } catch { setError('Could not update follow status. Please try again.'); }
    finally { setSubmitting(false); }
  };

  const formattedFollowers = new Intl.NumberFormat('en-US').format(followersCount);

  return (
    <article
      data-testid={`user-result-${user.username}`}
      className={`group bg-white dark:bg-[#181B22] border border-[#E2E8F0] dark:border-[#2E3544] rounded-2xl p-4 sm:p-5 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-xs hover:shadow-sm flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <Link
          to={`/u/${encodeURIComponent(user.username)}`}
          className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
        >
          <Avatar
            src={user.avatar_url}
            alt={user.display_name}
            size="md"
            className="ring-2 ring-transparent group-hover:ring-primary/20 transition-all"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              to={`/u/${encodeURIComponent(user.username)}`}
              className="font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC] hover:underline truncate"
            >
              {user.display_name}
            </Link>
            {user.is_verified && (
              <CheckCircle2
                size={14}
                className="text-primary fill-primary/10 shrink-0"
                aria-label="Verified user"
              />
            )}
          </div>
          <Link
            to={`/u/${encodeURIComponent(user.username)}`}
            className="text-xs text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white transition-colors block truncate"
          >
            {`@${user.username}`}
          </Link>

          {user.bio && (
            <p className="mt-2 text-xs text-[#334155] dark:text-[#CBD5E1] line-clamp-2 leading-relaxed">
              {user.bio}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#F1F5F9] dark:border-[#262B36] flex items-center justify-between gap-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
        <div className="flex items-center gap-3">
          <span>
            <strong className="text-[#0F172A] dark:text-[#F8FAFC]">{formattedFollowers}</strong>{' '}
            followers
          </span>
          {typeof user.following_count === 'number' && (
            <span>
              <strong className="text-[#0F172A] dark:text-[#F8FAFC]">{user.following_count}</strong>{' '}
              following
            </span>
          )}
        </div>

        <Button
          variant={isFollowing ? 'secondary' : 'primary'}
          size="sm"
          onClick={handleFollowClick}
          disabled={submitting || !viewer || user.id === viewer.id}
          aria-label={isFollowing ? `Unfollow ${user.display_name}` : `Follow ${user.display_name}`}
          className="text-xs font-semibold px-3 py-1 h-8 rounded-full"
        >
          {isFollowing ? (
            <>
              <UserCheck size={13} className="mr-1 text-slate-500" />
              <span>Following</span>
            </>
          ) : (
            <>
              <UserPlus size={13} className="mr-1" />
              <span>Follow</span>
            </>
          )}
        </Button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    </article>
  );
}
