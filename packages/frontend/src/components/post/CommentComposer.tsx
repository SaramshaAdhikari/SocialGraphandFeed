import React, { useState } from 'react';
import { Send, CornerDownRight } from 'lucide-react';
import { Button } from '../ui/Button';

export interface CommentComposerProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
  className?: string;
  isNestedReply?: boolean;
}

export function CommentComposer({
  onSubmit,
  onCancel,
  placeholder = 'What are your thoughts?',
  submitLabel = 'Comment',
  autoFocus = false,
  className = '',
  isNestedReply = false,
}: CommentComposerProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      setContent('');
      onCancel?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd+Enter or Ctrl+Enter submits
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="comment-composer"
      className={`rounded-xl border border-border bg-surface-card p-3 shadow-xs focus-within:border-primary/60 transition-colors ${className}`}
    >
      <div className="flex items-start gap-2">
        {isNestedReply && (
          <CornerDownRight size={16} className="text-text-muted shrink-0 mt-2" aria-hidden="true" />
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={isNestedReply ? 2 : 3}
          aria-label={placeholder}
          disabled={isSubmitting}
          className="w-full resize-y bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none min-h-[50px] leading-relaxed"
        />
      </div>

      {error && (
        <p className="mt-1 text-xs text-rose-500 font-medium" role="alert">
          {error}
        </p>
      )}

      <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between gap-2">
        <span className="text-[11px] text-text-muted hidden sm:inline-block">
          Press <kbd className="px-1.5 py-0.5 rounded bg-surface-subtle text-text-secondary text-[10px] font-mono border border-border">{isMac ? '⌘+Enter' : 'Ctrl+Enter'}</kbd> to send
        </span>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
              className="text-xs text-text-muted hover:text-text-primary"
            >
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!content.trim() || isSubmitting}
            isLoading={isSubmitting}
            leftIcon={!isSubmitting ? <Send size={13} /> : undefined}
            className="text-xs font-semibold px-3"
          >
            {isSubmitting ? 'Posting...' : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
