import type { CommentNode } from '@socialgraph/shared';
import { MessageSquare, Flame, Sparkles, Clock } from 'lucide-react';
import type { CommentSortOrder } from '../../hooks/usePostDetail';
import { CommentNodeItem } from './CommentNodeItem';
import { CommentComposer } from './CommentComposer';

export interface CommentTreeProps {
  comments: CommentNode[];
  sortOrder: CommentSortOrder;
  onSortChange: (order: CommentSortOrder) => void;
  onAddComment: (content: string, parentId?: string | null) => Promise<CommentNode | null>;
  onVoteComment: (commentId: string, direction: 1 | -1 | 0) => void;
  loading?: boolean;
  totalCount?: number;
  className?: string;
}

export function CommentTree({
  comments,
  sortOrder,
  onSortChange,
  onAddComment,
  onVoteComment,
  loading = false,
  totalCount,
  className = '',
}: CommentTreeProps) {
  const count = typeof totalCount === 'number' ? totalCount : comments.length;

  return (
    <section aria-label="Discussion comments" className={`space-y-6 ${className}`}>
      {/* Top Header & Sort Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-primary" />
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <span>Comments</span>
            <span className="text-sm font-normal text-text-muted">({count})</span>
            <span
              className="text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full"
              title="Comment votes are tracked in local session state pending backend persistence contract"
            >
              Votes: Session-Only
            </span>
          </h3>
        </div>

        {/* Predictable Comment Sort Pills (Top / New / Old) */}
        <div
          role="radiogroup"
          aria-label="Comment sorting"
          className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg text-xs"
        >
          <button
            type="button"
            role="radio"
            aria-checked={sortOrder === 'top'}
            onClick={() => onSortChange('top')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-colors ${
              sortOrder === 'top'
                ? 'bg-white dark:bg-slate-700 text-primary shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Flame size={12} />
            <span>Top</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={sortOrder === 'new'}
            onClick={() => onSortChange('new')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-colors ${
              sortOrder === 'new'
                ? 'bg-white dark:bg-slate-700 text-primary shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles size={12} />
            <span>New</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={sortOrder === 'old'}
            onClick={() => onSortChange('old')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-colors ${
              sortOrder === 'old'
                ? 'bg-white dark:bg-slate-700 text-primary shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock size={12} />
            <span>Old</span>
          </button>
        </div>
      </div>

      {/* Top-Level Comment Composer */}
      <div>
        <CommentComposer
          placeholder="Share your perspective or ask a technical question..."
          submitLabel="Comment"
          onSubmit={async (content) => {
            await onAddComment(content, null);
          }}
        />
      </div>

      {/* Comments List / Loading / Empty States */}
      {loading ? (
        <div className="space-y-4 pt-2" aria-label="Loading comments">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="w-24 h-3 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="w-12 h-3 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="w-full h-12 rounded bg-slate-200 dark:bg-slate-800 pl-8" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div
          data-testid="comments-empty-state"
          className="text-center py-10 px-4 rounded-xl border border-dashed border-border bg-surface-subtle/50"
        >
          <MessageSquare size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No comments yet
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Be the first to share your thoughts, benchmarks, or war stories on this post.
          </p>
        </div>
      ) : (
        <div className="space-y-4 pt-1 divide-y divide-slate-100 dark:divide-slate-800/60">
          {comments.map((comment) => (
            <div key={comment.id} className="pt-3 first:pt-0">
              <CommentNodeItem
                comment={comment}
                onAddReply={async (content, parentId) => {
                  await onAddComment(content, parentId);
                }}
                onVoteComment={onVoteComment}
                depth={0}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
