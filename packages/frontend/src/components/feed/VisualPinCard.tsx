import React, { useState } from 'react';
import type { VisualPinCard as IVisualPinCard } from '@socialgraph/shared';
import { Heart, MessageSquare, Bookmark, Share2, Check } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Link } from '../../router/Router';
import { formatRelativeTime } from '../../utils/date';

export interface VisualPinCardProps {
  post: IVisualPinCard;
  onVote: (postId: string, direction: 1 | -1 | 0) => void;
  onToggleSave: (postId: string) => void;
  className?: string;
}

export function VisualPinCard({
  post,
  onVote,
  onToggleSave,
  className = '',
}: VisualPinCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

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
      className={`bg-white rounded-xl border border-[#E2E8F0] shadow-sm hover:border-[#CBD5E1] transition-all duration-150 overflow-hidden ${className}`}
    >
      {/* Author & Context Header */}
      <div className="p-3 sm:p-4 flex items-center justify-between gap-3 border-b border-[#F8FAFC]">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar
            src={post.author.avatar_url}
            alt={post.author.display_name}
            size="sm"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Link
                to={`/u/${post.author.username}`}
                className="font-semibold text-xs sm:text-sm text-[#0F172A] hover:text-[#2563EB] truncate"
              >
                {post.author.display_name}
              </Link>
              {post.author.is_verified && (
                <span
                  title="Verified Creator"
                  className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#2563EB] text-white text-[9px] font-bold"
                >
                  ✓
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#94A3B8]">
              <span>@{post.author.username}</span>
              <span>•</span>
              <time dateTime={post.created_at}>
                {formatRelativeTime(post.created_at)}
              </time>
            </div>
          </div>
        </div>

        {post.community_slug && (
          <Link
            to={`/c/${post.community_slug}`}
            className="text-xs font-semibold text-[#475569] hover:text-[#2563EB] bg-[#F1F5F9] hover:bg-[#E2E8F0] px-2 py-0.5 rounded-full transition-colors shrink-0"
          >
            c/{post.community_slug}
          </Link>
        )}
      </div>

      {/* Media Box with CLS Aspect Ratio Reservation */}
      <div
        className="relative group bg-slate-100 overflow-hidden"
        style={{
          aspectRatio: post.media.aspect_ratio || 1.33,
          backgroundColor: post.dominant_color || '#F1F5F9',
        }}
      >
        <Link to={`/post/${post.id}`} className="block w-full h-full cursor-pointer">
          <img
            src={post.media.url}
            alt={post.media.alt_text || post.title || 'Visual pin'}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 group-hover:scale-[1.01] ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </Link>

        {/* Floating Quick Save Button (Pinterest style) */}
        <button
          type="button"
          onClick={handleSave}
          aria-label={post.is_saved ? 'Unsave pin' : 'Save pin'}
          className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold shadow-md transition-transform duration-150 cursor-pointer ${
            post.is_saved
              ? 'bg-[#0F172A] text-white hover:bg-black'
              : 'bg-[#E60023] text-white hover:bg-[#ad081b] opacity-0 group-hover:opacity-100 focus:opacity-100'
          }`}
        >
          {post.is_saved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* Post Details & Captions */}
      <div className="p-3 sm:p-4">
        {post.title && (
          <Link to={`/post/${post.id}`}>
            <h2 className="text-sm sm:text-base font-bold text-[#0F172A] hover:text-[#2563EB] transition-colors mb-1 leading-snug">
              {post.title}
            </h2>
          </Link>
        )}

        {post.caption && (
          <p className="text-xs sm:text-sm text-[#475569] line-clamp-2 leading-relaxed mb-3">
            {post.caption}
          </p>
        )}

        {/* Action Row */}
        <div className="flex items-center justify-between pt-2 border-t border-[#F8FAFC] text-xs text-[#64748B]">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Heart / Like Button */}
            <button
              type="button"
              onClick={handleLike}
              aria-label="Like pin"
              aria-pressed={post.user_vote === 1}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors cursor-pointer ${
                post.user_vote === 1
                  ? 'text-[#E11D48] bg-[#FFE4E6] font-semibold'
                  : 'hover:text-[#E11D48] hover:bg-[#F8FAFC]'
              }`}
            >
              <Heart
                size={16}
                className={post.user_vote === 1 ? 'fill-[#E11D48]' : ''}
              />
              <span className="tabular-nums">{post.score}</span>
            </button>

            {/* Comments */}
            <Link
              to={`/post/${post.id}`}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
            >
              <MessageSquare size={16} />
              <span className="tabular-nums">{post.comments_count}</span>
            </Link>

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share pin"
              className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            >
              {copied ? (
                <Check size={16} className="text-emerald-600" />
              ) : (
                <Share2 size={16} />
              )}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>

          {/* Bookmark */}
          <button
            type="button"
            onClick={handleSave}
            aria-label="Save pin"
            aria-pressed={post.is_saved}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              post.is_saved
                ? 'text-[#2563EB] bg-[#EFF6FF]'
                : 'hover:text-[#0F172A] hover:bg-[#F8FAFC]'
            }`}
          >
            <Bookmark
              size={16}
              className={post.is_saved ? 'fill-current' : ''}
            />
          </button>
        </div>
      </div>
    </article>
  );
}
