import { useState } from 'react';
import type { UserProfile } from '@socialgraph/shared';
import { CheckCircle2 } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Link } from '../../router/Router';
import { useAuth } from '../../auth/AuthContext';

export interface UserSearchResultCardProps {
  user: UserProfile;
  onFollowToggle?: (userId: string, shouldFollow: boolean) => Promise<void>;
  className?: string;
}

export function UserSearchResultCard({
  user,
  onFollowToggle,
  className = '',
}: UserSearchResultCardProps) {
  const { user: viewer } = useAuth();
  const [isFollowing, setIsFollowing] = useState(Boolean(user.is_following));
  const [submitting, setSubmitting] = useState(false);

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onFollowToggle || submitting) return;

    setSubmitting(true);
    const nextState = !isFollowing;
    setIsFollowing(nextState);

    try {
      await onFollowToggle(user.id, nextState);
    } catch {
      // Rollback on network failure
      setIsFollowing(!nextState);
    } finally {
      setSubmitting(false);
    }
  };

  const formattedFollowers = user.followers_count >= 1000
    ? `${(user.followers_count / 1000).toFixed(1)}k`
    : user.followers_count.toString();

  return (
    <article
      data-testid={`user-result-${user.username}`}
      className={`group bg-surface-card border border-border rounded-2xl p-4 sm:p-5 hover:border-border-strong transition-all shadow-xs hover:shadow-sm flex flex-col justify-between ${className}`}
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
              className="font-bold text-sm text-text-primary hover:underline truncate"
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
            className="text-xs text-text-muted hover:text-text-primary transition-colors block truncate"
          >
            {`@${user.username}`}
          </Link>

          {user.bio && (
            <p className="mt-2 text-xs text-text-secondary line-clamp-2 leading-relaxed">
              {user.bio}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-3 text-xs text-text-muted">
        <div className="flex items-center gap-3">
          <span>
            <strong className="text-text-primary">{formattedFollowers}</strong>{' '}
            followers
          </span>
          {typeof user.following_count === 'number' && (
            <span>
              <strong className="text-text-primary">{user.following_count}</strong>{' '}
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
          {isFollowing ? 'Following' : 'Follow'}
        </Button>
      </div>
    </article>
  );
}

export default UserSearchResultCard;
