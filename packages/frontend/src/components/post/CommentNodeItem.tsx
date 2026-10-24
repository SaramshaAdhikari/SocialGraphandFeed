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
      : 'ml-2 sm:ml-8';

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
            aria-expanded={!isCollapsed}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleCollapse();
              }
            }}
            className="w-4 shrink-0 flex justify-center cursor-pointer group/line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            <div className="w-[2px] h-full bg-border-strong/40 rounded-full group-hover/line:bg-primary transition-colors" />
          </div>
        )}

        {/* Comment Body & Header Container */}
        <div className="flex-1 min-w-0 py-1.5">
          {/* Header Metadata Row */}
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Link
              to={`/u/${comment.author.username}`}
              className="flex items-center gap-1.5 font-medium text-text-primary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
            >
              <Avatar
                src={comment.author.avatar_url}
                alt={comment.author.display_name}
                size="xs"
              />
              <span className="font-bold text-text-primary">{comment.author.display_name}</span>
              <span className="text-text-muted font-normal">@{comment.author.username}</span>
            </Link>

            {comment.author.is_verified && (
              <span
                title="Verified"
                className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-primary text-white text-[9px] font-bold"
              >
                ✓
              </span>
            )}

            <span className="text-border-strong" aria-hidden="true">•</span>
            <time dateTime={comment.created_at} className="text-text-muted">
              {formatRelativeTime(comment.created_at)}
            </time>

            {/* Collapse / Expand Toggle Button */}
            <button
              type="button"
              onClick={toggleCollapse}
              aria-label={isCollapsed ? 'Expand comment thread' : 'Collapse comment thread'}
              aria-expanded={!isCollapsed}
              className="ml-auto flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-surface-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
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
              <div className="mt-1.5 text-sm text-text-secondary leading-relaxed break-words whitespace-pre-wrap pl-6 sm:pl-7">
                {comment.content}
              </div>

              {/* Actions Row: Vote + Reply */}
              <div className="mt-2.5 flex items-center gap-3 pl-6 sm:pl-7 text-xs text-text-muted">
                {/* Compact Vote Controls (Session-only pending backend contract) */}
                <div
                  className="flex items-center gap-0.5 rounded-full bg-surface-subtle border border-border/60 px-1.5 py-0.5"
                  title="Comment voting is active in local session memory (backend persistence contract pending)"
                >
                  <button
                    type="button"
                    onClick={handleUpvote}
                    aria-label="Upvote comment"
                    title="Upvote comment (held in local session memory)"
                    aria-pressed={comment.user_vote === 1}
                    className={`p-1 rounded-full hover:bg-surface-card transition-colors cursor-pointer ${
                      comment.user_vote === 1 ? 'text-upvote' : 'text-text-muted hover:text-upvote'
                    }`}
                  >
                    <ArrowBigUp
                      size={15}
                      className={comment.user_vote === 1 ? 'fill-current text-upvote' : ''}
                    />
                  </button>
                  <span
                    className={`text-xs font-mono font-bold px-1 min-w-[1.2rem] text-center ${
                      comment.user_vote === 1
                        ? 'text-upvote'
                        : comment.user_vote === -1
                        ? 'text-downvote'
                        : 'text-text-primary'
                    }`}
                  >
                    {comment.score}
                  </span>
                  <button
                    type="button"
                    onClick={handleDownvote}
                    aria-label="Downvote comment"
                    title="Downvote comment (held in local session memory)"
                    aria-pressed={comment.user_vote === -1}
                    className={`p-1 rounded-full hover:bg-surface-card transition-colors cursor-pointer ${
                      comment.user_vote === -1
                        ? 'text-downvote'
                        : 'text-text-muted hover:text-downvote'
                    }`}
                  >
                    <ArrowBigDown
                      size={15}
                      className={comment.user_vote === -1 ? 'fill-current text-downvote' : ''}
                    />
                  </button>
                </div>

                {/* Reply Button */}
                <button
                  type="button"
                  onClick={() => setIsReplying(!isReplying)}
                  aria-expanded={isReplying}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-surface-subtle text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  <MessageSquare size={13} />
                  <span className="font-semibold">Reply</span>
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
export default CommentNodeItem;
