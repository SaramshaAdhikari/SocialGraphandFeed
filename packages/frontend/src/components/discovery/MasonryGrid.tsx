import type { VisualPinCard } from '@socialgraph/shared';
import { DiscoveryPinCard } from './DiscoveryPinCard';

export interface MasonryGridProps {
  pins: VisualPinCard[];
  onVote: (pinId: string, direction: 1 | -1 | 0) => void;
  onToggleSave: (pinId: string) => void;
  className?: string;
}

export function MasonryGrid({
  pins,
  onVote,
  onToggleSave,
  className = '',
}: MasonryGridProps) {
  return (
    <div
      className={`columns-2 sm:columns-2 md:columns-3 lg:columns-4 2xl:columns-5 3xl:columns-6 gap-3 sm:gap-4 lg:gap-5 2xl:gap-6 ${className}`}
    >
      {pins.map((pin) => (
        <DiscoveryPinCard
          key={pin.id}
          pin={pin}
          onVote={onVote}
          onToggleSave={onToggleSave}
        />
      ))}
    </div>
  );
}

export function DiscoverySkeleton() {
  const aspectRatios = [1.33, 0.75, 1.0, 0.67, 1.25, 0.8, 1.4, 0.7];

  return (
    <div
      className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 2xl:columns-5 3xl:columns-6 gap-3 sm:gap-4 lg:gap-5 2xl:gap-6"
      aria-busy="true"
      aria-label="Loading discovery pins"
    >
      {aspectRatios.map((ratio, i) => (
        <div
          key={i}
          className="break-inside-avoid mb-3 sm:mb-4 lg:mb-5 2xl:mb-6 bg-white dark:bg-[#181B22] rounded-2xl border border-[#E2E8F0] dark:border-[#2E3544] overflow-hidden p-3 animate-pulse"
        >
          <div
            className="w-full bg-slate-200 dark:bg-[#262B36] rounded-xl mb-3"
            style={{ aspectRatio: ratio }}
          />
          <div className="h-4 bg-slate-200 dark:bg-[#262B36] rounded w-3/4 mb-2" />
          <div className="h-3 bg-slate-100 dark:bg-[#1E232E] rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
