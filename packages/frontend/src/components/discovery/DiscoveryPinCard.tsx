import React, { useState } from 'react';
import type { VisualPinCard } from '@socialgraph/shared';
import { Heart, Bookmark, Share2, Check } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Link } from '../../router/Router';

export interface DiscoveryPinCardProps {
  pin: VisualPinCard;
  onVote: (pinId: string, direction: 1 | -1 | 0) => void;
  onToggleSave: (pinId: string) => void;
  className?: string;
}

export function DiscoveryPinCard({
  pin,
  onVote,
  onToggleSave,
  className = '',
}: DiscoveryPinCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

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

  return (
    <div
      data-testid={`discovery-pin-${pin.id}`}
      className={`group/pin break-inside-avoid mb-4 sm:mb-6 rounded-2xl bg-white dark:bg-[#181B22] border border-[#E2E8F0] dark:border-[#2E3544] overflow-hidden shadow-xs hover:shadow-card-hover transition-all duration-200 ${className}`}
    >
      {/* Media Box with CLS Aspect Ratio Reservation */}
      <div
        className="relative overflow-hidden bg-slate-100 dark:bg-[#12141A]"
        style={{
          aspectRatio: pin.media.aspect_ratio || 1.0,
          backgroundColor: pin.dominant_color || '#F1F5F9',
        }}
      >
        <Link to={`/post/${pin.id}`} className="block w-full h-full cursor-pointer focus-visible:outline-none">
          <img
            src={pin.media.url}
            alt={pin.media.alt_text || pin.title || 'Visual pin'}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-300 group-hover/pin:scale-[1.02] ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </Link>

        {/* Floating Quick Save Button (Pinterest style overlay) */}
        <button
          type="button"
          onClick={handleSave}
          aria-label={pin.is_saved ? 'Remove pin from saved collection' : 'Save pin to collection'}
          aria-pressed={pin.is_saved}
          className={`absolute top-3 right-3 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md transition-all duration-150 cursor-pointer ${
            pin.is_saved
              ? 'bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] hover:bg-black opacity-100'
              : 'bg-[#E60023] text-white hover:bg-[#ad081b] opacity-0 group-hover/pin:opacity-100 focus:opacity-100'
          }`}
        >
          {pin.is_saved ? 'Saved' : 'Save'}
        </button>

        {/* Dominant Color Vignette Indicator */}
        {pin.community_slug && (
          <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-xs text-[10px] font-semibold text-white pointer-events-none opacity-0 group-hover/pin:opacity-100 transition-opacity">
            c/{pin.community_slug}
          </span>
        )}
      </div>

      {/* Pin Description & Metadata */}
      <div className="p-3">
        {pin.title && (
          <Link to={`/post/${pin.id}`} className="block focus-visible:outline-none">
            <h3 className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] hover:text-primary transition-colors leading-snug line-clamp-1 mb-1">
              {pin.title}
            </h3>
          </Link>
        )}

        {pin.caption && (
          <p className="text-[11px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] line-clamp-2 leading-relaxed mb-2.5">
            {pin.caption}
          </p>
        )}

        {/* Creator Attribution & Interaction Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-[#F8FAFC] dark:border-[#262B36] text-xs">
          <Link
            to={`/u/${pin.author.username}`}
            className="flex items-center gap-1.5 min-w-0 group/author"
          >
            <Avatar src={pin.author.avatar_url} alt={pin.author.display_name} size="xs" />
            <span className="text-[11px] font-medium text-[#475569] dark:text-[#CBD5E1] group-hover/author:text-primary truncate">
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
              className={`flex items-center gap-1 p-1 rounded-md transition-colors cursor-pointer ${
                pin.user_vote === 1
                  ? 'text-[#E11D48]'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#E11D48]'
              }`}
            >
              <Heart
                size={14}
                className={pin.user_vote === 1 ? 'fill-[#E11D48]' : ''}
              />
              <span className="text-[11px] tabular-nums font-semibold">{pin.score}</span>
            </button>

            {/* Share Button */}
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share pin"
              className="p-1 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white rounded-md transition-colors cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
            </button>

            {/* Bookmark Button */}
            <button
              type="button"
              onClick={handleSave}
              aria-label="Save pin"
              aria-pressed={pin.is_saved}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                pin.is_saved
                  ? 'text-primary'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-primary'
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
