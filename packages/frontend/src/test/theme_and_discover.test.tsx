import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { PALETTES, PALETTE_LIST } from '../theme/palettes';
import { ThemeProvider } from '../theme/ThemeContext';
import { AppearancePopover } from '../components/theme/AppearancePopover';
import { TopHeader } from '../components/layout/TopHeader';
import { MockAdapter } from '../api/mock/MockAdapter';
import { DiscoveryCategoryBar } from '../components/discovery/DiscoveryCategoryBar';
import { DiscoveryPinCard } from '../components/discovery/DiscoveryPinCard';
import { MasonryGrid, DiscoverySkeleton } from '../components/discovery/MasonryGrid';
import { DiscoverPage } from '../pages/DiscoverPage';
import { RouterProvider } from '../router/Router';
import type { VisualPinCard } from '@socialgraph/shared';

describe('Global Theming System — Tokens and Palettes', () => {
  it('defines exactly 8 coordinated palettes matching design specifications', () => {
    expect(PALETTE_LIST.length).toBe(8);
    const expectedIds = [
      'dragons-blood',
      'sovereign-blue',
      'emerald-court',
      'imperial-amethyst',
      'champagne-silk',
      'abyssal-jade',
      'velvet-rose',
      'phoenix-ember',
    ];
    expect(PALETTE_LIST.map((p) => p.id)).toEqual(expectedIds);
  });

  it('lists Dragon\'s Blood first as signature palette and Sovereign Blue as default', () => {
    expect(PALETTE_LIST[0].id).toBe('dragons-blood');
    expect(PALETTE_LIST[0].name).toBe("Dragon's Blood");
    expect(PALETTES['dragons-blood'].light.primary).toBe('#881337');
    expect(PALETTES['dragons-blood'].dark.primary).toBe('#FB7185');

    expect(PALETTES['sovereign-blue']).toBeDefined();
    expect(PALETTES['sovereign-blue'].name).toBe('Sovereign Blue');
    expect(PALETTES['sovereign-blue'].light.primary).toBe('#1D4ED8');
  });

  it('ensures each palette defines light and dark tokens with deep charcoal dark canvas', () => {
    for (const palette of PALETTE_LIST) {
      // Light mode tokens
      expect(palette.light.primary).toBeDefined();
      expect(palette.light.canvas).toBeDefined();
      expect(palette.light.surfaceCard).toBe('#FFFFFF');
      expect(palette.light.textPrimary).toBeDefined();

      // Dark mode tokens (deep charcoal rather than pure black)
      expect(palette.dark.primary).toBeDefined();
      expect(palette.dark.canvas).toMatch(/^#[0-1][0-9A-Fa-f]{5}/);
      expect(palette.dark.surfaceCard).toBeDefined();
      expect(palette.dark.surfaceSubtle).toBeDefined();
      expect(palette.dark.textPrimary).toMatch(/^#F[0-9A-Fa-f]{5}/);
      expect(palette.dark.border).toBeDefined();
    }
  });

  it('ThemeProvider renders children with light and dark mode defaults', () => {
    const lightHtml = renderToString(
      <ThemeProvider initialMode="light" initialPalette="sovereign-blue">
        <div data-testid="theme-test">Light App Content</div>
      </ThemeProvider>
    );
    expect(lightHtml).toContain('Light App Content');

    const darkHtml = renderToString(
      <ThemeProvider initialMode="dark" initialPalette="dragons-blood">
        <div data-testid="theme-test">Dark App Content</div>
      </ThemeProvider>
    );
    expect(darkHtml).toContain('Dark App Content');
  });
});

describe('Appearance Controls and Popover UI', () => {
  it('TopHeader includes the Appearance & Theme trigger button next to user profile', () => {
    const html = renderToString(
      <RouterProvider initialPath="/">
        <TopHeader />
      </RouterProvider>
    );

    expect(html).toContain('aria-label="Customize appearance and color palette"');
    expect(html).toContain('title="Customize appearance and color palette"');
  });

  it('AppearancePopover renders 3 theme modes (Light, Dark, System) with radio roles', () => {
    const html = renderToString(
      <ThemeProvider initialMode="light" initialPalette="sovereign-blue">
        <AppearancePopover isOpen={true} onClose={() => {}} />
      </ThemeProvider>
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-label="Appearance and Theme Settings"');
    expect(html).toContain('Theme Mode');
    expect(html).toContain('aria-label="Appearance Mode"');

    // Modes
    expect(html).toContain('Light');
    expect(html).toContain('Dark');
    expect(html).toContain('System');
  });

  it('AppearancePopover renders all 8 palettes in a 4x2 grid with visible names and checkmark on selected', () => {
    const html = renderToString(
      <ThemeProvider initialMode="light" initialPalette="dragons-blood">
        <AppearancePopover isOpen={true} onClose={() => {}} />
      </ThemeProvider>
    );

    expect(html).toContain('Color Palette');
    expect(html).toContain('Dragon&#x27;s Blood');
    expect(html).toContain('Sovereign Blue');
    expect(html).toContain('Emerald Court');
    expect(html).toContain('Imperial Amethyst');
    expect(html).toContain('Champagne Silk');
    expect(html).toContain('Abyssal Jade');
    expect(html).toContain('Velvet Rose');
    expect(html).toContain('Phoenix Ember');

    // Dragon's Blood is selected, verify active checkmark and aria-checked="true"
    expect(html).toContain('aria-label="Dragon&#x27;s Blood: Oxblood · Garnet · Antique copper · Bone"');
    expect(html).toContain('aria-checked="true"');
  });

  it('AppearancePopover returns null when isOpen is false', () => {
    const html = renderToString(
      <ThemeProvider>
        <AppearancePopover isOpen={false} onClose={() => {}} />
      </ThemeProvider>
    );
    expect(html).toBe('');
  });
});

describe('Screen 2 — Discover: API Mock Adapter Data Contract', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({ simulatedLatencyMs: 0 });
  });

  it('fetches discovery stream with visual pin cards and aspect ratios', async () => {
    const response = await adapter.getDiscovery({ limit: 10 });
    expect(response.success).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);

    for (const pin of response.data) {
      expect(pin.post_type).toBe('visual');
      expect(pin.media).toBeDefined();
      expect(pin.media.url).toBeDefined();
      expect(pin.media.aspect_ratio).toBeGreaterThan(0);
      expect(pin.media.aspect_ratio).toBeLessThan(3.0);
      expect(pin.dominant_color).toBeDefined();
      expect(pin.author).toBeDefined();
      expect(pin.author.username).toBeDefined();
    }
  });

  it('filters discovery pins by category="systems"', async () => {
    const response = await adapter.getDiscovery({ category: 'systems' });
    expect(response.success).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);

    for (const pin of response.data) {
      expect(pin.community_slug?.toLowerCase()).toContain('systems');
    }
  });

  it('supports pagination via limit and cursor', async () => {
    const firstPage = await adapter.getDiscovery({ limit: 4 });
    expect(firstPage.data.length).toBe(4);
    expect(firstPage.has_more).toBe(true);
    expect(firstPage.next_cursor).toBeDefined();

    const secondPage = await adapter.getDiscovery({
      limit: 4,
      cursor: firstPage.next_cursor ?? undefined,
    });
    expect(secondPage.data.length).toBeGreaterThan(0);

    // Verify disjoint IDs
    const firstIds = new Set(firstPage.data.map((p) => p.id));
    for (const pin of secondPage.data) {
      expect(firstIds.has(pin.id)).toBe(false);
    }
  });
});

describe('Screen 2 — Discover: Components & Visual Layout', () => {
  const samplePin: VisualPinCard = {
    id: 'pin_test_101',
    author: {
      id: 'usr_sarah',
      username: 'sarahc',
      display_name: 'Sarah Chen',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      is_verified: true,
    },
    title: 'Distributed Log Consensus Architecture',
    caption: 'High-throughput event sourcing with Raft replication pipelines.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    score: 842,
    comments_count: 56,
    community_id: 'c_systems',
    community_slug: 'systems',
    post_type: 'visual',
    media: {
      id: 'med_test_101',
      url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
      width: 1200,
      height: 1600,
      aspect_ratio: 0.75,
      alt_text: 'Consensus Architecture Diagram',
    },
    dominant_color: '#1E293B',
    is_saved: false,
    user_vote: 0,
  };

  it('DiscoveryCategoryBar renders 5 category pills and marks active category', () => {
    const html = renderToString(
      <DiscoveryCategoryBar
        category="systems"
        onCategoryChange={() => {}}
      />
    );

    expect(html).toContain('All Inspirations');
    expect(html).toContain('Distributed Systems');
    expect(html).toContain('Design &amp; Visuals');
    expect(html).toContain('Hardware &amp; Silicon');
    expect(html).toContain('Algorithms');

    // Systems is active
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('Distributed Systems');
  });

  it('DiscoveryPinCard preserves natural aspect ratio in inline style to prevent CLS', () => {
    const html = renderToString(
      <RouterProvider initialPath="/explore">
        <DiscoveryPinCard
          pin={samplePin}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );

    // Aspect ratio style matches 0.75 exactly
    expect(html).toContain('aspect-ratio:0.75');
    expect(html).toContain('background-color:#1E293B');
    expect(html).toContain('Consensus Architecture Diagram');
  });

  it('DiscoveryPinCard provides hover save overlay and author attribution', () => {
    const html = renderToString(
      <RouterProvider initialPath="/explore">
        <DiscoveryPinCard
          pin={samplePin}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );

    // Save button
    expect(html).toContain('aria-label="Save pin to collection"');
    expect(html).toContain('Save');

    // Author metadata
    expect(html).toContain('Sarah Chen');
    expect(html).toMatch(/c\/<!-- -->systems|c\/systems/);
    expect(html).toContain('842'); // Score
  });

  it('DiscoveryPinCard displays "Saved" state when pin.is_saved is true', () => {
    const savedPin: VisualPinCard = { ...samplePin, is_saved: true };
    const html = renderToString(
      <RouterProvider initialPath="/explore">
        <DiscoveryPinCard
          pin={savedPin}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );

    expect(html).toContain('aria-label="Remove pin from saved collection"');
    expect(html).toContain('Saved');
    expect(html).toContain('aria-pressed="true"');
  });

  it('MasonryGrid applies multi-column responsive classes and renders all pins', () => {
    const html = renderToString(
      <RouterProvider initialPath="/explore">
        <MasonryGrid
          pins={[samplePin]}
          onVote={() => {}}
          onToggleSave={() => {}}
        />
      </RouterProvider>
    );

    expect(html).toContain('columns-2 sm:columns-2 md:columns-3 xl:columns-4 2xl:columns-5');
    expect(html).toContain('break-inside-avoid');
    expect(html).toContain(samplePin.title);
  });

  it('DiscoverySkeleton renders multiple card skeletons with variable aspect ratios', () => {
    const html = renderToString(<DiscoverySkeleton />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-label="Loading discovery pins"');
    expect(html).toContain('aspect-ratio:1.33');
    expect(html).toContain('aspect-ratio:0.75');
    expect(html).toContain('animate-pulse');
  });

  it('DiscoverPage renders header title, subtitle, and categories', () => {
    const html = renderToString(
      <RouterProvider initialPath="/explore">
        <DiscoverPage />
      </RouterProvider>
    );

    expect(html).toContain('Visual Discovery');
    expect(html).toContain('High-density architectural masonry gallery preserving natural media aspect ratios');
    expect(html).toContain('All Inspirations');
  });
});
