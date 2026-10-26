import { MessageSquareText, Users } from 'lucide-react';

export interface DiscussionPreviewProps {
  title: string;
  content: string;
  communityName?: string;
  tags: string[];
}

export function DiscussionPreview({
  title,
  content,
  communityName,
  tags,
}: DiscussionPreviewProps) {
  return (
    <article
      data-testid="discussion-live-preview"
      className="rounded-2xl border border-border bg-surface-card p-5 shadow-xs"
    >
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
        <MessageSquareText size={15} />
        Discussion preview
      </div>
      <h2 className="text-lg font-bold text-text-primary">
        {title.trim() || 'Your discussion title'}
      </h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
        {content.trim() || 'Your discussion body will appear here as you write.'}
      </p>
      <div className="mt-5 flex items-center gap-1.5 text-xs text-text-muted">
        <Users size={13} />
        <span>{communityName || 'Personal profile'}</span>
      </div>
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

