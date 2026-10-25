import React, { useState } from 'react';
import type { VisualPinCard } from '@socialgraph/shared';
import { Heart, Bookmark, Share2, Check, ImageOff } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Link } from '../../router/Router';
import { usePostModal } from '../../context/PostModalContext';

export interface DiscoveryPinCardProps {
  pin: VisualPinCard;
  onVote: (pinId: string, direction: 1 | -1 | 0) => void;
  onToggleSave: (pinId: string) => void;
  onPinClick?: (pin: VisualPinCard) => void;
  className?: string;
}

export function DiscoveryPinCard({
  pin,
  onVote,
  onToggleSave,
  onPinClick,
  className = '',
}: DiscoveryPinCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [copied, setCopied] = useState(false);
  const { openPostModal } = usePostModal();

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVote(pin.id, pin.user_vote === 1 ? 0 : 1);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSave(pin.id);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const shareUrl = `${window.location.origin}/post/${pin.id}`;
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

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, textarea, [role="button"]')) return;
    openPostModal(pin.id);
  };

  return (
    <div
      data-testid={`discovery-pin-${pin.id}`}
      onClick={handleCardClick}
      className={`group/pin break-inside-avoid mb-4 sm:mb-6 rounded-2xl bg-surface-card border border-border overflow-hidden shadow-xs hover:border-border-strong hover:shadow-card-hover transition-all duration-200 cursor-pointer ${className}`}
    >
      {/* Media Box with CLS Aspect Ratio Reservation */}
      <div
        className="relative overflow-hidden bg-surface-subtle"
        style={{
          aspectRatio: pin.media.aspect_ratio || 1.0,
          backgroundColor: pin.dominant_color || undefined,
        }}
      >
        <Link
          to={`/post/${pin.id}`}
          onClick={(e) => {
            if (onPinClick) {
              e.preventDefault();
              onPinClick(pin);
            } else if (!e.metaKey && !e.ctrlKey && e.button === 0) {
              e.preventDefault();
              openPostModal(pin.id);
            }
          }}
          className="block w-full h-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
        >
          {!imageError ? (
            <img
              src={pin.media.url}
              alt={pin.media.alt_text || pin.title || 'Visual pin'}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover transition-all duration-300 group-hover/pin:scale-[1.02] ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-text-muted bg-surface-subtle">
              <ImageOff size={24} className="mb-1 text-text-muted opacity-60" />
              <span className="text-[11px] font-medium text-text-muted">Image unavailable</span>
            </div>
          )}
        </Link>

        {/* Floating Quick Save Button */}
        <button
          type="button"
          onClick={handleSave}
          aria-label={pin.is_saved ? 'Remove pin from saved collection' : 'Save pin to collection'}
          aria-pressed={pin.is_saved}
          className={`absolute top-3 right-3 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            pin.is_saved
              ? 'bg-ink-button text-white hover:bg-ink-button-hover opacity-100'
              : 'bg-primary text-white hover:bg-primary-hover opacity-100 sm:opacity-0 sm:group-hover/pin:opacity-100 focus:opacity-100'
          }`}
        >
          {pin.is_saved ? 'Saved' : 'Save'}
        </button>

        {/* Dominant Color Vignette Indicator */}
        {pin.community_slug && (
          <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-semibold text-white pointer-events-none opacity-0 group-hover/pin:opacity-100 transition-opacity">
            c/{pin.community_slug}
          </span>
        )}
      </div>

      {/* Pin Description & Metadata */}
      <div className="p-3">
        {pin.title && (
          <Link
            to={`/post/${pin.id}`}
            onClick={(e) => {
              if (onPinClick) {
                e.preventDefault();
                onPinClick(pin);
              } else if (!e.metaKey && !e.ctrlKey && e.button === 0) {
                e.preventDefault();
                openPostModal(pin.id);
              }
            }}
            className="block focus-visible:outline-none"
          >
            <h3 className="text-xs sm:text-sm font-bold text-text-primary hover:text-primary transition-colors leading-snug line-clamp-1 mb-1">
              {pin.title}
            </h3>
          </Link>
        )}

        {pin.caption && (
          <p className="text-[11px] sm:text-xs text-text-secondary line-clamp-2 leading-relaxed mb-2.5">
            {pin.caption}
          </p>
        )}

        {/* Creator Attribution & Interaction Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
          <Link
            to={`/u/${pin.author.username}`}
            className="flex items-center gap-1.5 min-w-0 group/author"
          >
            <Avatar src={pin.author.avatar_url} alt={pin.author.display_name} size="xs" />
            <span className="text-[11px] font-medium text-text-secondary group-hover/author:text-primary truncate">
              {pin.author.display_name}
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {/* Like Button */}
            <button
              type="button"
              onClick={handleLike}
              aria-label="Like pin"
              aria-pressed={pin.user_vote === 1}
              className={`flex items-center gap-1 p-1 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                pin.user_vote === 1
                  ? 'text-rose-500 font-bold'
                  : 'text-text-muted hover:text-rose-500'
              }`}
            >
              <Heart
                size={14}
                className={pin.user_vote === 1 ? 'fill-rose-500 text-rose-500' : ''}
              />
              <span className="text-[11px] tabular-nums font-semibold">{pin.score}</span>
            </button>

            {/* Share Button */}
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share pin"
              className="p-1 text-text-muted hover:text-text-primary rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
            </button>

            {/* Bookmark Button */}
            <button
              type="button"
              onClick={handleSave}
              aria-label="Save pin"
              aria-pressed={pin.is_saved}
              className={`p-1 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                pin.is_saved
                  ? 'text-primary'
                  : 'text-text-muted hover:text-primary'
              }`}
            >
              <Bookmark
                size={14}
                className={pin.is_saved ? 'fill-current text-primary' : ''}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiscoveryPinCard;
