import React, { useState } from 'react';
import type { DiscussionPostCard as IDiscussionPostCard } from '@socialgraph/shared';
import { MessageSquare, Bookmark, Share2, Check } from 'lucide-react';
import { VoteControl } from '../ui/VoteControl';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Link } from '../../router/Router';
import { formatRelativeTime } from '../../utils/date';

export interface DiscussionPostCardProps {
  post: IDiscussionPostCard;
  onVote: (postId: string, direction: 1 | -1 | 0) => void;
  onToggleSave: (postId: string) => void;
  className?: string;
}

export function DiscussionPostCard({
  post,
  onVote,
  onToggleSave,
  className = '',
}: DiscussionPostCardProps) {
  const [copied, setCopied] = useState(false);

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
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSave(post.id);
  };

  return (
    <article
      data-testid={`post-discussion-${post.id}`}
      className={`bg-white dark:bg-[#181B22] rounded-xl border border-[#E2E8F0] dark:border-[#2E3544] p-4 shadow-sm hover:border-[#CBD5E1] dark:hover:border-[#3E475A] transition-all duration-150 ${className}`}
    >
      <div className="flex items-start gap-3">
        {/* Desktop Vertical Vote Rail (Reddit design pattern) */}
        <div className="hidden sm:block shrink-0">
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
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
            {post.community_slug ? (
              <>
                <Link
                  to={`/c/${post.community_slug}`}
                  className="font-bold text-[#0F172A] dark:text-[#F8FAFC] hover:text-primary hover:underline"
                >
                  c/{post.community_slug}
                </Link>
                <span className="text-[#CBD5E1] dark:text-[#475569]" aria-hidden="true">•</span>
              </>
            ) : null}

            <div className="flex items-center gap-1.5">
              <Avatar
                src={post.author.avatar_url}
                alt={post.author.display_name}
                size="xs"
              />
              <span>Posted by</span>
              <Link
                to={`/u/${post.author.username}`}
                className="font-medium text-[#475569] dark:text-[#CBD5E1] hover:text-primary hover:underline"
              >
                u/{post.author.username}
              </Link>
            </div>

            <span className="text-[#CBD5E1] dark:text-[#475569]" aria-hidden="true">•</span>
            <time dateTime={post.created_at} className="text-[#94A3B8]">
              {formatRelativeTime(post.created_at)}
            </time>

            {post.flair && (
              <Badge size="sm" variant="neutral" className="text-[11px] py-0.5 px-2 font-medium">
                {post.flair}
              </Badge>
            )}
          </div>

          {/* Post Title */}
          <Link to={`/post/${post.id}`} className="block group">
            <h2 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC] group-hover:text-primary transition-colors leading-snug mb-2">
              {post.title}
            </h2>
          </Link>

          {/* Discussion Markdown Body Excerpt */}
          <p className="text-sm text-[#334155] dark:text-[#CBD5E1] leading-relaxed line-clamp-3 mb-3">
            {post.content}
          </p>

          {/* Optional Media Attachments */}
          {post.media && post.media.length > 0 && (
            <div className="mb-3 rounded-lg overflow-hidden border border-[#E2E8F0] dark:border-[#2E3544] max-h-96 bg-slate-50 dark:bg-[#12141A] flex items-center justify-center">
              <img
                src={post.media[0].url}
                alt={post.media[0].alt_text || post.title}
                loading="lazy"
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>
          )}

          {/* Action Row & Mobile Vote Control */}
          <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] dark:border-[#262B36] text-xs text-[#64748B] dark:text-[#94A3B8]">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Mobile Horizontal Vote Control */}
              <div className="sm:hidden">
                <VoteControl
                  score={post.score}
                  userVote={post.user_vote}
                  onVote={(direction) => onVote(post.id, direction)}
                  orientation="horizontal"
                  size="sm"
                />
              </div>

              {/* Comments Button */}
              <Link to={`/post/${post.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white"
                  leftIcon={<MessageSquare size={15} />}
                >
                  <span>{post.comments_count} Comments</span>
                </Button>
              </Link>

              {/* Share Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="h-8 px-2 text-xs text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white"
                leftIcon={copied ? <Check size={15} className="text-emerald-600" /> : <Share2 size={15} />}
              >
                <span>{copied ? 'Copied' : 'Share'}</span>
              </Button>
            </div>

            {/* Save / Bookmark Button */}
            <Button
              variant={post.is_saved ? 'secondary' : 'ghost'}
              size="sm"
              onClick={handleSave}
              className={`h-8 px-2.5 text-xs transition-colors ${
                post.is_saved
                  ? 'text-primary bg-primary/10 font-semibold'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
              }`}
              leftIcon={
                <Bookmark
                  size={15}
                  className={post.is_saved ? 'fill-current text-primary' : ''}
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
