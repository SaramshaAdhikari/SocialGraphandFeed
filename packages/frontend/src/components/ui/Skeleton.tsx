import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rect' | 'circle' | 'text' | 'media';
  width?: string | number;
  height?: string | number;
  aspectRatio?: string | number;
}

export function Skeleton({
  variant = 'rect',
  width,
  height,
  aspectRatio,
  className = '',
  style,
  ...rest
}: SkeletonProps) {
  const variantClasses = {
    rect: 'rounded-md',
    circle: 'rounded-full',
    text: 'rounded h-4 w-full',
    media: 'rounded-xl w-full',
  }[variant];

  const inlineStyle: React.CSSProperties = {
    ...style,
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
    ...(aspectRatio !== undefined ? { aspectRatio } : {}),
  };

  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-surface-subtle ${variantClasses} ${className}`}
      style={inlineStyle}
      {...rest}
    />
  );
}

export function PostCardSkeleton() {
  return (
    <div className="bg-surface-card rounded-2xl border border-border p-4 sm:p-5 mb-4 shadow-xs">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="circle" width={36} height={36} />
        <div className="space-y-1.5 flex-1">
          <Skeleton variant="text" width="40%" height={14} />
          <Skeleton variant="text" width="25%" height={12} />
        </div>
      </div>
      <Skeleton variant="text" width="85%" height={18} className="mb-2.5" />
      <Skeleton variant="text" width="95%" height={14} className="mb-1.5" />
      <Skeleton variant="text" width="60%" height={14} className="mb-4" />
      <Skeleton variant="media" aspectRatio="16/9" className="mb-4" />
      <div className="flex items-center gap-4 pt-2 border-t border-border-subtle">
        <Skeleton variant="rect" width={80} height={28} className="rounded-full" />
        <Skeleton variant="rect" width={90} height={28} className="rounded-full" />
      </div>
    </div>
  );
}
