import { Image as ImageIcon, Users } from 'lucide-react';

export interface PinPreviewProps {
  imageUrl: string;
  title: string;
  caption: string;
  communityName?: string;
  tags: string[];
  imageAlt?: string;
}

export function PinPreview({
  imageUrl,
  title,
  caption,
  communityName,
  tags,
  imageAlt,
}: PinPreviewProps) {
  return (
    <article
      data-testid="pin-live-preview"
      className="overflow-hidden rounded-2xl border border-border bg-surface-card shadow-xs"
    >
      <div className="aspect-[4/3] bg-surface-subtle">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt || title || 'Visual pin preview'}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-text-muted">
            <ImageIcon size={28} />
            <span className="text-xs">Your image preview will appear here</span>
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h2 className="line-clamp-2 text-base font-bold text-text-primary">
            {title.trim() || 'Untitled visual pin'}
          </h2>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
            {caption.trim() || 'Add a caption to explain what this image communicates.'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Users size={13} />
          <span>{communityName || 'Personal profile'}</span>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
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
      </div>
    </article>
  );
}

