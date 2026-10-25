import React from 'react';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react';

export interface VoteControlProps {
  score: number;
  userVote: 1 | -1 | 0;
  onVote: (direction: 1 | -1 | 0) => void;
  orientation?: 'vertical' | 'horizontal';
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
}

export function VoteControl({
  score,
  userVote,
  onVote,
  orientation = 'vertical',
  size = 'md',
  disabled = false,
  className = '',
}: VoteControlProps) {
  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onVote(userVote === 1 ? 0 : 1);
  };

  const handleDownvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onVote(userVote === -1 ? 0 : -1);
  };

  const formatScore = (num: number): string => {
    if (Math.abs(num) >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (Math.abs(num) >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const isVertical = orientation === 'vertical';
  const iconSize = size === 'sm' ? 18 : 22;

  const scoreColor =
    userVote === 1
      ? 'text-[#F97316] font-bold'
      : userVote === -1
      ? 'text-[#6366F1] font-bold'
      : 'text-text-primary font-semibold';

  return (
    <div
      role="group"
      aria-label="Vote on post"
      className={`inline-flex items-center select-none bg-surface-subtle rounded-full border border-border ${
        isVertical
          ? 'flex-col py-1.5 px-1 min-w-[36px]'
          : 'flex-row px-2 py-0.5 gap-1 min-h-[32px]'
      } ${className}`}
    >
      <button
        type="button"
        onClick={handleUpvote}
        disabled={disabled}
        aria-label="Upvote"
        aria-pressed={userVote === 1}
        className={`p-1 rounded-full transition-all duration-150 hover:scale-110 active:scale-90 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${
          userVote === 1
            ? 'text-[#F97316] hover:bg-[#FFEDD5] dark:hover:bg-[#431407]'
            : 'text-text-muted hover:text-[#F97316] hover:bg-surface-card'
        }`}
      >
        <ArrowBigUp
          size={iconSize}
          className={userVote === 1 ? 'fill-[#F97316]' : ''}
          aria-hidden="true"
        />
      </button>

      <span
        className={`text-xs tabular-nums text-center px-1 ${scoreColor} ${
          isVertical ? 'my-0.5' : ''
        }`}
        aria-label={`Current score: ${score}`}
      >
        {formatScore(score)}
      </span>

      <button
        type="button"
        onClick={handleDownvote}
        disabled={disabled}
        aria-label="Downvote"
        aria-pressed={userVote === -1}
        className={`p-1 rounded-full transition-all duration-150 hover:scale-110 active:scale-90 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${
          userVote === -1
            ? 'text-[#6366F1] hover:bg-[#EEF2FF] dark:hover:bg-[#1E1B4B]'
            : 'text-text-muted hover:text-[#6366F1] hover:bg-surface-card'
        }`}
      >
        <ArrowBigDown
          size={iconSize}
          className={userVote === -1 ? 'fill-[#6366F1]' : ''}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
