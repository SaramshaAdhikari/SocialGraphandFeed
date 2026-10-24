import type { VisualPinCard } from '@socialgraph/shared';
import { DiscoveryPinCard } from './DiscoveryPinCard';
import { useMasonryColumns } from '../../hooks/useMasonryColumns';

export interface MasonryGridProps {
  pins: VisualPinCard[];
  onVote: (pinId: string, direction: 1 | -1 | 0) => void;
  onToggleSave: (pinId: string) => void;
  className?: string;
  columns?: number;
  layout?: 'greedy' | 'columns';
}

export function MasonryGrid({
  pins,
  onVote,
  onToggleSave,
  className = '',
  columns: explicitColumns,
  layout = 'greedy',
}: MasonryGridProps) {
  const { columns } = useMasonryColumns(pins, { columns: explicitColumns });

  if (layout === 'columns') {
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

  return (
    <div
      data-testid="masonry-grid"
      className={`flex flex-row items-start gap-3 sm:gap-4 lg:gap-5 2xl:gap-6 ${className}`}
    >
      {columns.map((colPins, colIndex) => (
        <div key={colIndex} className="flex-1 flex flex-col min-w-0">
          {colPins.map((pin) => (
            <DiscoveryPinCard
              key={pin.id}
              pin={pin}
              onVote={onVote}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DiscoverySkeleton() {
  const aspectRatios = [1.33, 0.75, 1.0, 0.67, 1.25, 0.8, 1.4, 0.7];

  return (
    <div
      className="flex flex-row items-start gap-3 sm:gap-4 lg:gap-5 2xl:gap-6"
      aria-busy="true"
      aria-label="Loading discovery pins"
    >
      {[0, 1, 2, 3].map((colIndex) => {
        const responsiveVisibility =
          colIndex === 2 ? 'hidden sm:flex' : colIndex === 3 ? 'hidden lg:flex' : 'flex';

        return (
          <div
            key={colIndex}
            className={`${responsiveVisibility} flex-1 flex-col min-w-0`}
          >
            {aspectRatios.slice(colIndex * 2, colIndex * 2 + 2).map((ratio, i) => (
              <div
                key={i}
                className="break-inside-avoid mb-3 sm:mb-4 lg:mb-5 2xl:mb-6 bg-surface-card rounded-2xl border border-border overflow-hidden p-3 animate-pulse"
              >
                <div
                  className="w-full bg-surface-subtle rounded-xl mb-3"
                  style={{ aspectRatio: ratio }}
                />
                <div className="h-4 bg-surface-subtle rounded w-3/4 mb-2" />
                <div className="h-3 bg-surface-subtle rounded w-1/2" />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
