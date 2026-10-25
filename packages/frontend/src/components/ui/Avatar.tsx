import { useState } from 'react';
import { User } from 'lucide-react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: AvatarSize;
  className?: string;
}

const sizeMap: Record<AvatarSize, { dimension: string; text: string; icon: number }> = {
  xs: { dimension: 'w-6 h-6 min-w-[24px] min-h-[24px]', text: 'text-[10px]', icon: 12 },
  sm: { dimension: 'w-8 h-8 min-w-[32px] min-h-[32px]', text: 'text-xs', icon: 16 },
  md: { dimension: 'w-10 h-10 min-w-[40px] min-h-[40px]', text: 'text-sm', icon: 20 },
  lg: { dimension: 'w-12 h-12 min-w-[48px] min-h-[48px]', text: 'text-base', icon: 24 },
  xl: { dimension: 'w-18 h-18 min-w-[72px] min-h-[72px]', text: 'text-xl', icon: 36 },
  '2xl': { dimension: 'w-28 h-28 min-w-[112px] min-h-[112px] md:w-32 md:h-32 md:min-w-[128px]', text: 'text-3xl', icon: 56 },
};

export function Avatar({ src, alt, size = 'md', className = '' }: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const { dimension, text, icon } = sizeMap[size];

  const getInitials = (name?: string) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return '';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(alt);

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-surface-subtle border border-border overflow-hidden select-none shrink-0 ${dimension} ${className}`}
      role="img"
      aria-label={alt}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover rounded-full"
          loading="lazy"
        />
      ) : initials ? (
        <span className={`font-semibold text-[#475569] dark:text-[#CBD5E1] ${text}`}>{initials}</span>
      ) : (
        <User size={icon} className="text-[#94A3B8]" aria-hidden="true" />
      )}
    </div>
  );
}
