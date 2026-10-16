import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { PALETTES, PALETTE_LIST } from '../theme/palettes';
import { ThemeProvider } from '../theme/ThemeContext';
import { TopHeader } from '../components/layout/TopHeader';
import { SettingsAppearancePage } from '../pages/SettingsAppearancePage';
import { MockAdapter } from '../api/mock/MockAdapter';
import { DiscoveryCategoryBar } from '../components/discovery/DiscoveryCategoryBar';
import { DiscoveryPinCard } from '../components/discovery/DiscoveryPinCard';
import { MasonryGrid, DiscoverySkeleton } from '../components/discovery/MasonryGrid';
import { DiscoverPage } from '../pages/DiscoverPage';
import { RouterProvider } from '../router/Router';
import type { VisualPinCard } from '@socialgraph/shared';

describe('Global Theming System — 15 Authentic Regal Color Palettes', () => {
  it('defines exactly 15 authentic palettes organized into 4 curated families', () => {
    expect(PALETTE_LIST.length).toBe(15);

    const expectedIds = [
      // Imperial & dramatic
      'tyrian-purple',
      'royal-purple',
      'oxblood',
      'dragons-blood',
      // Jewel & mineral
      'lapis-lazuli',
      'malachite',
      'royal-blue',
      // Soft & expressive
      'dusty-rose',
      'mulberry',
      'burnt-sienna',
      // Metallic & neutral
      'platinum',
      'champagne',
      'pearl',
      'eburnean',
      'wenge',
    ];
    expect(PALETTE_LIST.map((p) => p.id)).toEqual(expectedIds);

    // Verify categories
    const categories = new Set(PALETTE_LIST.map((p) => p.category));
    expect(categories).toEqual(
      new Set([
        'Imperial & dramatic',
        'Jewel & mineral',
        'Soft & expressive',
        'Metallic & neutral',
      ])
    );
  });

  it('sets Royal Blue as the initial default palette and defines authentic historical swatches', () => {
    expect(PALETTES['royal-blue']).toBeDefined();
    expect(PALETTES['royal-blue'].name).toBe('Royal Blue');
    expect(PALETTES['royal-blue'].swatchColor).toBe('#4169E1');
    expect(PALETTES['royal-blue'].category).toBe('Jewel & mineral');

    // Tyrian Purple
    expect(PALETTES['tyrian-purple'].swatchColor).toBe('#66023C');
    // Dragon's Blood
    expect(PALETTES['dragons-blood'].swatchColor).toBe('#A82220');
    // Malachite
    expect(PALETTES['malachite'].swatchColor).toBe('#0BDA51');
    // Champagne
    expect(PALETTES['champagne'].swatchColor).toBe('#F7E7CE');
    // Pearl
    expect(PALETTES['pearl'].swatchColor).toBe('#EAE0C8');
  });

  it('ensures each palette defines WCAG-accessible light and dark mode tokens on shared foundation', () => {
    for (const palette of PALETTE_LIST) {
      // Light mode shared foundation
      expect(palette.light.canvas).toBe('#FFFFFF');
      expect(palette.light.surfaceCard).toBe('#F7F5F6');
      expect(palette.light.textPrimary).toBe('#242127');
      expect(palette.light.primary).toBeDefined();

      // Dark mode shared foundation (deep charcoal rather than pure black)
      expect(palette.dark.canvas).toMatch(/^#[0-1][0-9A-Fa-f]{5}/);
      expect(palette.dark.surfaceCard).toMatch(/^#[2][0-9A-Fa-f]{5}/);
      expect(palette.dark.textPrimary).toBe('#F5F0F7');
      expect(palette.dark.primary).toBeDefined();
    }
  });

  it('ThemeProvider renders children with light and dark mode defaults', () => {
    const lightHtml = renderToString(
      <ThemeProvider initialMode="light" initialPalette="royal-blue">
        <div data-testid="theme-test">Light App Content</div>
      </ThemeProvider>
    );
    expect(lightHtml).toContain('Light App Content');

    const darkHtml = renderToString(
      <ThemeProvider initialMode="dark" initialPalette="tyrian-purple">
        <div data-testid="theme-test">Dark App Content</div>
      </ThemeProvider>
    );
    expect(darkHtml).toContain('Dark App Content');
  });
});

describe('Header Appearance Controls vs Settings Page Architecture', () => {
  it('TopHeader provides a compact quick sun/moon toggle without cluttering the header with palette swatches', () => {
    const html = renderToString(
      <RouterProvider initialPath="/">
        <ThemeProvider initialMode="light">
          <TopHeader />
        </ThemeProvider>
      </RouterProvider>
    );

    // Compact toggle button present
    expect(html).toContain('aria-label="Switch to dark mode"');
    expect(html).toContain('title="Switch to dark mode"');

    // Settings link present
    expect(html).toContain('aria-label="Theme &amp; Appearance Settings"');
    expect(html).toContain('href="/settings/appearance"');

    // Header does NOT contain permanent palette swatches or dropdown list
    expect(html).not.toContain('Tyrian Purple');
    expect(html).not.toContain('Malachite');
  });

  it('TopHeader toggle button displays switch to light mode when in dark mode', () => {
    const html = renderToString(
      <RouterProvider initialPath="/">
        <ThemeProvider initialMode="dark">
          <TopHeader />
        </ThemeProvider>
      </RouterProvider>
    );

    expect(html).toContain('aria-label="Switch to light mode"');
    expect(html).toContain('title="Switch to light mode"');
  });

  it('SettingsAppearancePage renders full personalization center with mode selector, all 15 palettes, and preview', () => {
    const html = renderToString(
      <RouterProvider initialPath="/settings/appearance">
        <ThemeProvider initialMode="light" initialPalette="royal-blue">
          <SettingsAppearancePage />
        </ThemeProvider>
      </RouterProvider>
    );

    // Heading
    expect(html).toContain('Appearance &amp; Personalization');
    expect(html).toContain('Active: <!-- -->Royal Blue');

    // Section 1: Appearance Mode Cards
    expect(html).toContain('Appearance Mode');
    expect(html).toContain('Light');
    expect(html).toContain('Airy and bright');
    expect(html).toContain('Dark');
    expect(html).toContain('Deep and immersive');
    expect(html).toContain('System');
    expect(html).toContain('Follows your device');

    // Section 2: Accent Palette Library with 4 curated families
    expect(html).toContain('Accent Palette Library');
    expect(html).toContain('Imperial &amp; dramatic');
    expect(html).toContain('Jewel &amp; mineral');
    expect(html).toContain('Soft &amp; expressive');
    expect(html).toContain('Metallic &amp; neutral');

    // All 15 palettes are rendered with visible names
    expect(html).toContain('Tyrian Purple');
    expect(html).toContain('Royal Purple');
    expect(html).toContain('Oxblood');
    expect(html).toContain('Dragon&#x27;s Blood');
    expect(html).toContain('Lapis Lazuli');
    expect(html).toContain('Malachite');
    expect(html).toContain('Royal Blue');
    expect(html).toContain('Dusty Rose');
    expect(html).toContain('Mulberry');
    expect(html).toContain('Burnt Sienna');
    expect(html).toContain('Platinum');
    expect(html).toContain('Champagne');
    expect(html).toContain('Pearl');
    expect(html).toContain('Eburnean');
    expect(html).toContain('Wenge');

    // Section 3: Live Theme Preview
    expect(html).toContain('Live Theme Preview');
    expect(html).toContain('Save Collection');
    expect(html).toContain('Explore More');
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
