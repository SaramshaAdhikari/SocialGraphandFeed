import React, { useState } from 'react';
import type { DiscussionPostCard as IDiscussionPostCard } from '@socialgraph/shared';
import { MessageSquare, Bookmark, Share2, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { VoteControl } from '../ui/VoteControl';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Link } from '../../router/Router';
import { formatRelativeTime } from '../../utils/date';
import { usePostModal } from '../../context/PostModalContext';

export interface DiscussionPostCardProps {
  post: IDiscussionPostCard;
  onVote: (postId: string, direction: 1 | -1 | 0) => void;
  onToggleSave: (postId: string) => void;
  onPostClick?: (post: IDiscussionPostCard) => void;
  className?: string;
}

export function DiscussionPostCard({
  post,
  onVote,
  onToggleSave,
  onPostClick,
  className = '',
}: DiscussionPostCardProps) {
  const [copied, setCopied] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);
  const { openPostModal } = usePostModal();

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

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSave(post.id);
  };

  const isTechnicalFlair = post.flair && (
    post.flair.toLowerCase().includes('deep dive') ||
    post.flair.toLowerCase().includes('technical') ||
    post.flair.toLowerCase().includes('system') ||
    post.flair.toLowerCase().includes('architecture') ||
    post.flair.toLowerCase().includes('benchmark')
  );

  return (
    <article
      data-testid={`post-discussion-${post.id}`}
      className={`bg-surface-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs hover:border-border-strong transition-all duration-150 ${className}`}
    >
      <div className="flex items-start gap-3.5">
        {/* Desktop Vertical Vote Rail (Reddit-inspired pattern) */}
        <div className="hidden sm:block shrink-0 pt-0.5">
          <VoteControl
            score={post.score}
            userVote={post.user_vote}
            onVote={(direction) => onVote(post.id, direction)}
            orientation="vertical"
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {/* Metadata Header */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 text-xs text-text-muted">
            {post.community_slug ? (
              <>
                <Link
                  to={`/c/${post.community_slug}`}
                  className="font-bold text-text-primary hover:text-primary transition-colors bg-surface-subtle px-2.5 py-0.5 rounded-full border border-border/60"
                >
                  c/{post.community_slug}
                </Link>
                <span className="text-border-strong" aria-hidden="true">•</span>
              </>
            ) : null}

            <div className="flex items-center gap-1.5">
              <Link
                to={`/u/${post.author.username}`}
                className="flex items-center gap-1.5 font-medium text-text-secondary hover:text-primary group/author focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-md"
              >
                <Avatar
                  src={post.author.avatar_url}
                  alt={post.author.display_name}
                  size="xs"
                />
                <span className="text-text-muted font-normal">Posted by</span>
                <span className="font-semibold text-text-primary group-hover/author:text-primary group-hover/author:underline">
                  u/{post.author.username}
                </span>
              </Link>
            </div>

            <span className="text-border-strong" aria-hidden="true">•</span>
            <time dateTime={post.created_at} className="text-text-muted">
              {formatRelativeTime(post.created_at)}
            </time>

            {post.flair && (
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-colors ${
                  isTechnicalFlair
                    ? 'bg-secondary-soft text-secondary border-secondary/30'
                    : 'bg-primary-soft text-primary border-primary/30'
                }`}
              >
                {post.flair}
              </span>
            )}
          </div>

          {/* Post Title */}
          <Link
            to={`/post/${post.id}`}
            onClick={(e) => {
              if (onPostClick) {
                e.preventDefault();
                onPostClick(post);
              } else if (!e.metaKey && !e.ctrlKey && e.button === 0) {
                e.preventDefault();
                openPostModal(post.id);
              }
            }}
            className="block group"
          >
            <h2 className="text-base sm:text-lg font-bold text-text-primary group-hover:text-primary transition-colors leading-snug mb-2">
              {post.title}
            </h2>
          </Link>

          {/* Discussion Markdown Body Excerpt */}
          <p className="text-sm text-text-secondary leading-relaxed line-clamp-3 mb-3.5">
            {post.content}
          </p>

          {/* Media Attachments with Multi-Image Carousel Support */}
          {post.media && post.media.length > 0 && (
            <div className="relative mb-3.5 rounded-xl overflow-hidden border border-border max-h-96 bg-surface-subtle flex items-center justify-center group/carousel">
              <img
                src={post.media[mediaIndex]?.url || post.media[0].url}
                alt={post.media[mediaIndex]?.alt_text || post.title}
                loading="lazy"
                className="w-full h-auto max-h-96 object-contain"
              />

              {/* Carousel Navigation Arrows if multiple media items */}
              {post.media.length > 1 && (
                <>
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[11px] font-mono text-white pointer-events-none">
                    {mediaIndex + 1} / {post.media.length}
                  </div>
                  <button
                    type="button"
                    aria-label="Previous image"
                    disabled={mediaIndex === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMediaIndex((i) => Math.max(0, i - 1));
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white disabled:opacity-20 disabled:cursor-not-allowed opacity-0 group-hover/carousel:opacity-100 transition-opacity cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    disabled={!post.media || mediaIndex === post.media.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      const maxIdx = (post.media?.length ?? 1) - 1;
                      setMediaIndex((i) => Math.min(maxIdx, i + 1));
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white disabled:opacity-20 disabled:cursor-not-allowed opacity-0 group-hover/carousel:opacity-100 transition-opacity cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Action Row & Mobile Vote Control */}
          <div className="flex items-center justify-between pt-2.5 border-t border-border/60 text-xs text-text-muted gap-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              {/* Mobile Horizontal Vote Control */}
              <div className="sm:hidden shrink-0">
                <VoteControl
                  score={post.score}
                  userVote={post.user_vote}
                  onVote={(direction) => onVote(post.id, direction)}
                  orientation="horizontal"
                  size="sm"
                />
              </div>

              {/* Comments Button */}
              <Link
                to={`/post/${post.id}`}
                onClick={(e) => {
                  if (onPostClick) {
                    e.preventDefault();
                    onPostClick(post);
                  } else if (!e.metaKey && !e.ctrlKey && e.button === 0) {
                    e.preventDefault();
                    openPostModal(post.id);
                  }
                }}
                className="shrink-0"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 sm:px-2.5 text-xs text-text-muted hover:text-text-primary"
                  leftIcon={<MessageSquare size={15} />}
                  aria-label={`${post.comments_count} comments`}
                >
                  <span>{post.comments_count}</span>
                  <span className="hidden sm:inline ml-1">Comments</span>
                </Button>
              </Link>

              {/* Share Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="h-8 px-2 sm:px-2.5 text-xs text-text-muted hover:text-text-primary shrink-0"
                leftIcon={copied ? <Check size={15} className="text-emerald-500" /> : <Share2 size={15} />}
                aria-label={copied ? 'Link copied to clipboard' : 'Share post'}
              >
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
              </Button>
            </div>

            {/* Save / Bookmark Button */}
            <Button
              variant={post.is_saved ? 'secondary' : 'ghost'}
              size="sm"
              onClick={handleSave}
              className={`h-8 px-2 sm:px-2.5 text-xs transition-all duration-150 active:scale-95 shrink-0 ${
                post.is_saved
                  ? 'text-primary bg-primary-soft font-bold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              aria-label={post.is_saved ? 'Remove saved post' : 'Save post'}
              leftIcon={
                <Bookmark
                  size={15}
                  className={`transition-transform duration-150 ${post.is_saved ? 'fill-current text-primary scale-110' : 'group-hover:scale-105'}`}
                />
              }
            >
              <span>{post.is_saved ? 'Saved' : 'Save'}</span>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default DiscussionPostCard;
