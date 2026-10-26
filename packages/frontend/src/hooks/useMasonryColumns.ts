import { useMemo, useState, useEffect } from 'react';
import type { VisualPinCard } from '@socialgraph/shared';

/**
 * Calculates responsive column count based on viewport width:
 * < 640px: 2 columns (mobile 2-column masonry per Pinterest mobile standard)
 * 640px - 1024px: 3 columns (tablet)
 * 1024px - 1536px: 4 columns (desktop standard)
 * >= 1536px: 5 columns (wide / 2K displays)
 */
export function getResponsiveColumnCount(width: number): number {
  if (width < 640) return 2;
  if (width < 1024) return 3;
  if (width < 1536) return 4;
  return 5;
}

export interface UseMasonryColumnsOptions {
  columns?: number;
  defaultColumns?: number;
}

/**
 * Greedy shortest-column masonry distributor.
 *
 * For each pin, calculates estimated vertical height using:
 *   estimatedHeight = (1 / aspect_ratio) + title/text overhead
 * Then allocates the pin to whichever column currently has the minimum
 * cumulative height. This prevents jagged bottom alignments and
 * guarantees left-to-right reading order across columns.
 */
export function distributePinsToColumns(
  pins: VisualPinCard[],
  columnCount: number
): VisualPinCard[][] {
  const safeCount = Math.max(1, Math.floor(columnCount));
  const columns: VisualPinCard[][] = Array.from({ length: safeCount }, () => []);
  const heights: number[] = new Array(safeCount).fill(0);

  for (const pin of pins) {
    // Find column with minimal cumulative height
    let minCol = 0;
    let minHeight = heights[0];

    for (let i = 1; i < safeCount; i++) {
      if (heights[i] < minHeight) {
        minHeight = heights[i];
        minCol = i;
      }
    }

    columns[minCol].push(pin);

    // Calculate relative height contribution
    // Aspect ratio = width / height => height = 1 / aspect_ratio
    const ratio = pin.media?.aspect_ratio && pin.media.aspect_ratio > 0
      ? pin.media.aspect_ratio
      : 1.0;
    const cardOverhead = 0.35; // Normalized height for title, avatar, and tags
    const estimatedHeight = 1 / ratio + cardOverhead;

    heights[minCol] += estimatedHeight;
  }

  return columns;
}

export interface UseMasonryColumnsReturn {
  columns: VisualPinCard[][];
  columnCount: number;
}

export function useMasonryColumns(
  pins: VisualPinCard[],
  options: UseMasonryColumnsOptions = {}
): UseMasonryColumnsReturn {
  const [columnCount, setColumnCount] = useState<number>(() => {
    if (options.columns) return options.columns;
    if (typeof window !== 'undefined' && window.innerWidth) {
      return getResponsiveColumnCount(window.innerWidth);
    }
    return options.defaultColumns ?? 4;
  });

  useEffect(() => {
    if (options.columns) {
      setColumnCount(options.columns);
      return;
    }

    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setColumnCount(getResponsiveColumnCount(window.innerWidth));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [options.columns]);

  const columns = useMemo(() => {
    return distributePinsToColumns(pins, columnCount);
  }, [pins, columnCount]);

  return { columns, columnCount };
}
