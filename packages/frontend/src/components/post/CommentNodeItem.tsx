import { useState } from 'react';
import type { CommentNode } from '@socialgraph/shared';
import { ChevronDown, ChevronRight, MessageSquare, ArrowBigUp, ArrowBigDown } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Link } from '../../router/Router';
import { formatRelativeTime } from '../../utils/date';
import { CommentComposer } from './CommentComposer';

export interface CommentNodeItemProps {
  comment: CommentNode;
  onAddReply: (content: string, parentId: string) => Promise<void>;
  onVoteComment: (commentId: string, direction: 1 | -1 | 0) => void;
  depth?: number;
}

export function CommentNodeItem({
  comment,
  onAddReply,
  onVoteComment,
  depth = 0,
}: CommentNodeItemProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  const hasReplies = comment.replies && comment.replies.length > 0;

  // Total descendant reply count for collapsed label
  const totalDescendantCount = (node: CommentNode): number => {
    let count = node.replies.length;
    for (const r of node.replies) {
      count += totalDescendantCount(r);
    }
    return count;
  };
  const repliesCount = hasReplies ? totalDescendantCount(comment) : 0;

  const handleUpvote = () => {
    onVoteComment(comment.id, comment.user_vote === 1 ? 0 : 1);
  };

  const handleDownvote = () => {
    onVoteComment(comment.id, comment.user_vote === -1 ? 0 : -1);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Indentation capping on mobile (max depth 3 on mobile, depth 6 on desktop)
  const indentClass =
    depth === 0
      ? ''
      : depth === 1
      ? 'ml-2 sm:ml-4'
      : depth === 2
      ? 'ml-3 sm:ml-6'
      : depth === 3
      ? 'ml-3 sm:ml-8'
      : 'ml-2 sm:ml-8'; // Capped on narrow viewports to avoid squeezing text

  return (
    <div
      data-testid={`comment-node-${comment.id}`}
      className={`relative transition-colors ${indentClass}`}
    >
      <div className="group/node flex gap-2">
        {/* Clickable Vertical Thread Guide Line (Reddit Pattern) */}
        {depth > 0 && (
          <div
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expand thread' : 'Collapse thread'}
            aria-label={isCollapsed ? 'Expand thread' : 'Collapse thread'}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleCollapse();
              }
            }}
            className="w-4 shrink-0 flex justify-center cursor-pointer group/line focus:outline-none"
          >
            <div className="w-[2px] h-full bg-slate-200 dark:bg-slate-700/60 rounded-full group-hover/line:bg-primary transition-colors" />
          </div>
        )}

        {/* Comment Body & Header Container */}
        <div className="flex-1 min-w-0 py-1.5">
          {/* Header Metadata Row */}
          <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
            <Link
              to={`/u/${comment.author.username}`}
              className="flex items-center gap-1.5 font-medium text-[#0F172A] dark:text-[#F8FAFC] hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
            >
              <Avatar
                src={comment.author.avatar_url}
                alt={comment.author.display_name}
                size="xs"
              />
              <span className="font-semibold">{comment.author.display_name}</span>
              <span className="text-[#94A3B8] font-normal">@{comment.author.username}</span>
            </Link>

            {comment.author.is_verified && (
              <span
                title="Verified"
                className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-primary text-white text-[9px] font-bold"
              >
                ✓
              </span>
            )}

            <span className="text-[#CBD5E1] dark:text-[#475569]" aria-hidden="true">•</span>
            <time dateTime={comment.created_at} className="text-[#94A3B8]">
              {formatRelativeTime(comment.created_at)}
            </time>

            {/* Collapse / Expand Toggle Button */}
            <button
              type="button"
              onClick={toggleCollapse}
              aria-label={isCollapsed ? 'Expand comment thread' : 'Collapse comment thread'}
              className="ml-auto flex items-center gap-1 text-[11px] text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isCollapsed ? (
                <>
                  <ChevronRight size={14} />
                  <span className="font-semibold text-primary">
                    +{repliesCount + 1} collapsed
                  </span>
                </>
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
          </div>

          {/* Comment Content (Hidden when collapsed) */}
          {!isCollapsed && (
            <>
              <div className="mt-1 text-sm text-[#334155] dark:text-[#CBD5E1] leading-relaxed break-words whitespace-pre-wrap pl-6 sm:pl-7">
                {comment.content}
              </div>

              {/* Actions Row: Vote + Reply */}
              <div className="mt-2 flex items-center gap-3 pl-6 sm:pl-7 text-xs text-[#64748B] dark:text-[#94A3B8]">
                {/* Compact Vote Controls */}
                <div className="flex items-center gap-0.5 rounded-full bg-slate-100 dark:bg-slate-800/80 px-1 py-0.5">
                  <button
                    type="button"
                    onClick={handleUpvote}
                    aria-label="Upvote comment"
                    aria-pressed={comment.user_vote === 1}
                    className={`p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
                      comment.user_vote === 1 ? 'text-[#F97316]' : 'text-slate-500 hover:text-[#F97316]'
                    }`}
                  >
                    <ArrowBigUp
                      size={15}
                      className={comment.user_vote === 1 ? 'fill-[#F97316]' : ''}
                    />
                  </button>
                  <span
                    className={`text-xs font-bold px-1 min-w-[1.2rem] text-center ${
                      comment.user_vote === 1
                        ? 'text-[#F97316]'
                        : comment.user_vote === -1
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {comment.score}
                  </span>
                  <button
                    type="button"
                    onClick={handleDownvote}
                    aria-label="Downvote comment"
                    aria-pressed={comment.user_vote === -1}
                    className={`p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
                      comment.user_vote === -1
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-500 hover:text-indigo-600'
                    }`}
                  >
                    <ArrowBigDown
                      size={15}
                      className={comment.user_vote === -1 ? 'fill-current' : ''}
                    />
                  </button>
                </div>

                {/* Reply Button */}
                <button
                  type="button"
                  onClick={() => setIsReplying(!isReplying)}
                  aria-expanded={isReplying}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <MessageSquare size={13} />
                  <span>Reply</span>
                </button>
              </div>

              {/* Inline Reply Composer */}
              {isReplying && (
                <div className="mt-3 pl-6 sm:pl-7">
                  <CommentComposer
                    placeholder={`Reply to @${comment.author.username}...`}
                    submitLabel="Reply"
                    autoFocus
                    isNestedReply
                    onSubmit={async (content) => {
                      await onAddReply(content, comment.id);
                      setIsReplying(false);
                    }}
                    onCancel={() => setIsReplying(false)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Recursive Child Replies */}
      {!isCollapsed && hasReplies && (
        <div className="mt-1 space-y-1">
          {comment.replies.map((reply) => (
            <CommentNodeItem
              key={reply.id}
              comment={reply}
              onAddReply={onAddReply}
              onVoteComment={onVoteComment}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
