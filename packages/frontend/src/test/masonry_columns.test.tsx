import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  distributePinsToColumns,
  getResponsiveColumnCount,
  useMasonryColumns,
} from '../hooks/useMasonryColumns';
import { MasonryGrid } from '../components/discovery/MasonryGrid';
import { RouterProvider } from '../router/Router';
import type { VisualPinCard } from '@socialgraph/shared';

describe('Greedy Shortest-Column Masonry System', () => {
  const makePin = (id: string, aspectRatio: number, title: string): VisualPinCard => ({
    id,
    author: {
      id: 'usr_author',
      username: 'author',
      display_name: 'Author Name',
      avatar_url: 'https://example.com/avatar.jpg',
      is_verified: true,
    },
    title,
    caption: 'Content description',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    score: 10,
    user_vote: 0,
    comments_count: 5,
    community_id: 'comm_systems',
    community_slug: 'systems',
    post_type: 'visual',
    media: {
      id: `med_${id}`,
      url: `https://example.com/${id}.jpg`,
      width: 800,
      height: Math.round(800 / (aspectRatio || 1.0)),
      aspect_ratio: aspectRatio,
      alt_text: title,
    },
    dominant_color: '#1E293B',
    is_saved: false,
  });

  describe('getResponsiveColumnCount', () => {
    it('returns 2 columns for mobile screens (< 640px)', () => {
      expect(getResponsiveColumnCount(375)).toBe(2);
      expect(getResponsiveColumnCount(639)).toBe(2);
    });

    it('returns 3 columns for tablet screens (640px - 1023px)', () => {
      expect(getResponsiveColumnCount(640)).toBe(3);
      expect(getResponsiveColumnCount(768)).toBe(3);
      expect(getResponsiveColumnCount(1023)).toBe(3);
    });

    it('returns 4 columns for desktop screens (1024px - 1535px)', () => {
      expect(getResponsiveColumnCount(1024)).toBe(4);
      expect(getResponsiveColumnCount(1440)).toBe(4);
    });

    it('returns 5 columns for wide / 2K displays (>= 1536px)', () => {
      expect(getResponsiveColumnCount(1536)).toBe(5);
      expect(getResponsiveColumnCount(2560)).toBe(5);
    });
  });

  describe('distributePinsToColumns', () => {
    it('handles an empty pin array gracefully', () => {
      const result = distributePinsToColumns([], 3);
      expect(result).toEqual([[], [], []]);
    });

    it('places all pins into a single column when columnCount is 1', () => {
      const pins = [
        makePin('1', 1.0, 'Square Pin'),
        makePin('2', 0.75, 'Tall Pin'),
      ];
      const result = distributePinsToColumns(pins, 1);
      expect(result.length).toBe(1);
      expect(result[0].map((p) => p.id)).toEqual(['1', '2']);
    });

    it('greedily places next pin into whichever column is shortest', () => {
      // Pin 1: Very tall portrait (aspect ratio 0.5 -> relative height = 2.0 + 0.35 = 2.35)
      // Pin 2: Wide landscape (aspect ratio 2.0 -> relative height = 0.5 + 0.35 = 0.85)
      // Pin 3: Normal square (aspect ratio 1.0 -> relative height = 1.0 + 0.35 = 1.35)
      const pin1 = makePin('tall', 0.5, 'Tall Pin');
      const pin2 = makePin('wide', 2.0, 'Wide Pin');
      const pin3 = makePin('third', 1.0, 'Third Pin');

      // Distribution into 2 columns:
      // Step 1: pin1 goes to col 0 (heights: [2.35, 0])
      // Step 2: pin2 goes to col 1 because col 1 height is 0 (heights: [2.35, 0.85])
      // Step 3: pin3 goes to col 1 because col 1 (0.85) < col 0 (2.35)!
      const result = distributePinsToColumns([pin1, pin2, pin3], 2);

      expect(result[0].map((p) => p.id)).toEqual(['tall']);
      expect(result[1].map((p) => p.id)).toEqual(['wide', 'third']);
    });

    it('preserves all pins without duplicates or omissions across 4 columns', () => {
      const pins = Array.from({ length: 12 }, (_, i) =>
        makePin(`pin_${i}`, 0.6 + (i % 5) * 0.2, `Pin ${i}`)
      );

      const columns = distributePinsToColumns(pins, 4);
      expect(columns.length).toBe(4);

      const allPlacedIds = columns.flat().map((p) => p.id);
      expect(allPlacedIds.length).toBe(12);
      expect(new Set(allPlacedIds).size).toBe(12);
      expect(allPlacedIds.sort()).toEqual(pins.map((p) => p.id).sort());
    });

    it('handles pins with undefined or zero aspect ratio with fallback', () => {
      const safePin = makePin('broken', 0, 'Zero Ratio');
      (safePin.media as any).aspect_ratio = 0;

      const result = distributePinsToColumns([safePin], 2);
      expect(result[0].length + result[1].length).toBe(1);
    });
  });

  describe('MasonryGrid Integration', () => {
    it('useMasonryColumns hook returns reactive columns and default column count via component', () => {
      const pins = [
        makePin('a', 1.0, 'Alpha Pin'),
        makePin('b', 0.75, 'Beta Pin'),
      ];

      function TestHookComponent() {
        const { columnCount, columns: distributed } = useMasonryColumns(pins, { columns: 2 });
        return (
          <div data-testid="hook-result" data-columns={columnCount} data-count={distributed.flat().length} />
        );
      }

      const html = renderToString(<TestHookComponent />);
      expect(html).toContain('data-columns="2"');
      expect(html).toContain('data-count="2"');
    });

    it('renders all pins inside responsive flex container', () => {
      const pins = [
        makePin('a', 1.0, 'Alpha Pin'),
        makePin('b', 0.75, 'Beta Pin'),
        makePin('c', 1.33, 'Gamma Pin'),
      ];

      const html = renderToString(
        <RouterProvider initialPath="/explore">
          <MasonryGrid
            pins={pins}
            columns={3}
            onVote={() => {}}
            onToggleSave={() => {}}
          />
        </RouterProvider>
      );

      expect(html).toContain('data-testid="masonry-grid"');
      expect(html).toContain('Alpha Pin');
      expect(html).toContain('Beta Pin');
      expect(html).toContain('Gamma Pin');
    });
  });
});
