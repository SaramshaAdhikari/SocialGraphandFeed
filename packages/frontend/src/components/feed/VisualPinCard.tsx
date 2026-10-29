import React, { useState } from 'react';
import type { VisualPinCard as IVisualPinCard } from '@socialgraph/shared';
import { Heart, MessageSquare, Bookmark, Share2, Check, ImageOff, Layers } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Link } from '../../router/Router';
import { formatRelativeTime } from '../../utils/date';
import { usePostModal } from '../../context/PostModalContext';
import { PostActionMenu } from './PostActionMenu';

export interface VisualPinCardProps {
  post: IVisualPinCard;
  onVote: (postId: string, direction: 1 | -1 | 0) => void;
  onToggleSave: (postId: string) => void;
  onPostClick?: (post: IVisualPinCard) => void;
  className?: string;
}

export function VisualPinCard({
  post,
  onVote,
  onToggleSave,
  onPostClick,
  className = '',
}: VisualPinCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [copied, setCopied] = useState(false);
  const { openPostModal } = usePostModal();

  const handleOpenModal = (e: React.MouseEvent) => {
    if (onPostClick) {
      e.preventDefault();
      onPostClick(post);
    } else if (!e.metaKey && !e.ctrlKey && e.button === 0) {
      e.preventDefault();
      openPostModal(post.id);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, textarea, [role="button"]')) return;
    openPostModal(post.id);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVote(post.id, post.user_vote === 1 ? 0 : 1);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSave(post.id);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const shareUrl = `${window.location.origin}/post/${post.id}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <article
      data-testid={`post-visual-${post.id}`}
      onClick={handleCardClick}
      className={`bg-surface-card rounded-2xl border border-border/50 shadow-xs hover:border-border transition-all duration-150 overflow-hidden cursor-pointer ${className}`}
    >
      {/* Author & Context Header */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 border-b border-border/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            to={`/u/${post.author.username}`}
            className="flex items-center gap-2.5 min-w-0 group/author focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-lg p-0.5 -m-0.5"
          >
            <Avatar
              src={post.author.avatar_url}
              alt={post.author.display_name}
              size="sm"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs sm:text-sm text-text-primary group-hover/author:text-primary truncate">
                  {post.author.display_name}
                </span>
                {post.author.is_verified && (
                  <span
                    title="Verified Creator"
                    className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-primary text-white text-[9px] font-bold"
                  >
                    ✓
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-text-muted">
                <span>@{post.author.username}</span>
                <span>•</span>
                <time dateTime={post.created_at}>
                  {formatRelativeTime(post.created_at)}
                </time>
              </div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {post.community_slug && (
            <Link
              to={`/c/${post.community_slug}`}
              className="text-xs font-bold text-text-secondary hover:text-primary bg-surface-subtle border border-border/60 px-2.5 py-0.5 rounded-full transition-colors"
            >
              c/{post.community_slug}
            </Link>
          )}
          <PostActionMenu post={post} />
        </div>
      </div>

      {/* Media Box with CLS Aspect Ratio Reservation */}
      <div
        className="relative group bg-surface-subtle overflow-hidden"
        style={{
          aspectRatio: post.media.aspect_ratio || 1.33,
          backgroundColor: post.dominant_color || undefined,
        }}
      >
        <Link
          to={`/post/${post.id}`}
          onClick={handleOpenModal}
          className="block w-full h-full cursor-pointer"
        >
          {!imageError ? (
            <img
              src={post.media.url}
              alt={post.media.alt_text || post.title || 'Visual pin'}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.015] ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-text-muted bg-surface-subtle">
              <ImageOff size={28} className="mb-1.5 opacity-60" />
              <span className="text-xs font-medium text-text-muted">Image preview unavailable</span>
            </div>
          )}
        </Link>

        {/* Album Indicator Badge */}
        {post.media_list && post.media_list.length > 1 && (
          <div
            data-testid="album-indicator"
            className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-black/70 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1.5 shadow-xs pointer-events-none"
          >
            <Layers size={13} />
            <span>1/{post.media_list.length}</span>
          </div>
        )}

        {/* Floating Quick Save Button */}
        <button
          type="button"
          onClick={handleSave}
          aria-label={post.is_saved ? 'Unsave pin' : 'Save pin'}
          aria-pressed={post.is_saved}
          className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold shadow-md transition-all duration-150 cursor-pointer ${
            post.is_saved
              ? 'bg-ink-button text-white hover:bg-ink-button-hover opacity-100'
              : 'bg-primary text-white hover:bg-primary-hover opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100'
          }`}
        >
          {post.is_saved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* Post Details & Captions */}
      <div className="p-3.5 sm:p-4">
        {post.title && (
          <Link to={`/post/${post.id}`} onClick={handleOpenModal}>
            <h2 className="text-sm sm:text-base font-bold text-text-primary hover:text-primary transition-colors mb-1 leading-snug">
              {post.title}
            </h2>
          </Link>
        )}

        {post.caption && (
          <p className="text-xs sm:text-sm text-text-secondary line-clamp-2 leading-relaxed mb-3">
            {post.caption}
          </p>
        )}

        {/* Action Row */}
        <div className="flex items-center justify-between pt-2.5 border-t border-border/60 text-xs text-text-muted">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Heart / Like Button */}
            <button
              type="button"
              onClick={handleLike}
              aria-label="Like pin"
              aria-pressed={post.user_vote === 1}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                post.user_vote === 1
                  ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 font-bold'
                  : 'hover:text-rose-600 hover:bg-rose-500/10'
              }`}
            >
              <Heart
                size={16}
                className={post.user_vote === 1 ? 'fill-rose-600 text-rose-600' : ''}
              />
              <span className="tabular-nums font-mono">{post.score}</span>
            </button>

            {/* Comments */}
            <Link
              to={`/post/${post.id}`}
              onClick={handleOpenModal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors"
            >
              <MessageSquare size={16} />
              <span className="tabular-nums font-mono">{post.comments_count}</span>
            </Link>

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share pin"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
            >
              {copied ? (
                <Check size={16} className="text-emerald-500" />
              ) : (
                <Share2 size={16} />
              )}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>

          {/* Bookmark */}
          <button
            type="button"
            onClick={handleSave}
            aria-label={post.is_saved ? 'Unsave pin' : 'Save pin'}
            aria-pressed={post.is_saved}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              post.is_saved
                ? 'text-text-primary bg-black/[0.05] dark:bg-white/[0.1]'
                : 'text-text-muted hover:text-text-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.08]'
            }`}
          >
            <Bookmark
              size={16}
              className={post.is_saved ? 'fill-current text-text-primary' : ''}
            />
          </button>
        </div>
      </div>
    </article>
  );
}
export default VisualPinCard;
