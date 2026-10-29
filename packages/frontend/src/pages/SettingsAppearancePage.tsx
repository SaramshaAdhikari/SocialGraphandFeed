import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Check,
  Sparkles,
  ArrowLeft,
  User,
  Palette,
} from 'lucide-react';
import { useTheme } from '../theme/ThemeContext';
import { PALETTES, PALETTE_LIST } from '../theme/palettes';
import type { AppearanceMode, PaletteCategory, PaletteId } from '../theme/types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Link } from '../router/Router';

export function SettingsAppearancePage() {
  const { mode, resolvedTheme, paletteId, setMode, setPaletteId, resetToDefault } = useTheme();
  const [inspectedPalette, setInspectedPalette] = useState<PaletteId | null>(null);

  const palette = PALETTES[paletteId] || PALETTES['royal-blue'];
  const allPalettes = PALETTE_LIST;

  const appearanceModes: {
    id: AppearanceMode;
    label: string;
    description: string;
    icon: React.ElementType;
  }[] = [
    {
      id: 'light',
      label: 'Light',
      description: 'Airy and bright (#FFFFFF canvas, #F7F7FA cards)',
      icon: Sun,
    },
    {
      id: 'dark',
      label: 'Dark',
      description: 'Deep and immersive (#000000 canvas, #0A0A0A cards)',
      icon: Moon,
    },
    {
      id: 'system',
      label: 'System',
      description: 'Follows your device preferences automatically',
      icon: Laptop,
    },
  ];

  const categories: PaletteCategory[] = [
    'Imperial & dramatic',
    'Jewel & mineral',
    'Soft & expressive',
    'Metallic & neutral',
  ];

  const activeCanvas = resolvedTheme === 'dark' ? '#000000' : '#FFFFFF';
  const activeSurfaceCard = resolvedTheme === 'dark' ? '#0A0A0A' : '#FFFFFF';
  const activePrimary = resolvedTheme === 'dark' ? palette.dark.primary : palette.light.primary;

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16">
      {/* Page Header */}
      <div className="space-y-3 pb-6 border-b border-border">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
          <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <span>/</span>
          <span>Settings</span>
          <span>/</span>
          <span className="text-primary font-bold">Appearance</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
              Appearance &amp; Personalization
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Personalize your theme mode and select from 15 historical pigment, mineral, and royal gemstone palettes on a pure monochrome foundation.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (resetToDefault) resetToDefault();
                else setPaletteId('royal-blue');
              }}
              title="Restore signature Noir Pink-Violet default palette"
            >
              Reset to Default Appearance
            </Button>
            <Badge variant="brand" size="md">
              Active: {palette.name}
            </Badge>
          </div>
        </div>
      </div>

      {/* Settings Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border">
        <Link
          to="/settings/profile"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 border-transparent text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          <User size={15} className="shrink-0" />
          <span>Profile &amp; Identity</span>
        </Link>
        <Link
          to="/settings/appearance"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 border-primary text-primary transition-colors cursor-pointer"
        >
          <Palette size={15} className="shrink-0" />
          <span>Appearance &amp; Themes</span>
        </Link>
      </div>

      {/* Section 1: Appearance Mode */}
      <section className="space-y-4" aria-labelledby="appearance-mode-heading">
        <div>
          <h2 id="appearance-mode-heading" className="text-lg font-bold text-text-primary">
            Appearance Mode
          </h2>
          <p className="text-xs sm:text-sm text-text-muted">
            Choose whether SocialGraph displays in crisp monochrome light, deep true-black Noir, or syncs with your device.
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Appearance Mode"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
        >
          {appearanceModes.map((item) => {
            const Icon = item.icon;
            const isSelected = mode === item.id;

            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setMode(item.id)}
                className={`relative flex flex-col items-start text-left p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer bg-surface-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 shadow-md'
                    : 'border-border hover:border-border-strong shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      isSelected
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-surface-subtle text-text-muted'
                    }`}
                  >
                    <Icon size={20} />
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-text-primary">
                    {item.label}
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Section 2: Accent Palette Library (15 Authentic Palettes) */}
      <section className="space-y-8" aria-labelledby="accent-palette-heading">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 id="accent-palette-heading" className="text-lg font-bold text-text-primary">
              Accent Palette Library
            </h2>
            <p className="text-xs sm:text-sm text-text-muted">
              15 curated palettes. Neutral surfaces stay pure monochrome; only brand accents update.
            </p>
          </div>
          <span className="text-xs text-text-muted">
            Selected: <strong className="text-primary font-bold">{palette.name}</strong> ({palette.category})
          </span>
        </div>

        {/* Default Monochrome Foundation Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-surface-card border border-border">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-text-primary">Default Palette</h3>
                {paletteId === 'royal-blue' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                    Active Default
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Restores the standard Royal Blue sapphire accent palette on the pure monochrome foundation.
              </p>
            </div>
          </div>
          <Button
            variant={paletteId === 'royal-blue' ? 'outline' : 'primary'}
            size="sm"
            onClick={() => {
              if (resetToDefault) resetToDefault();
              else setPaletteId('royal-blue');
            }}
            className="shrink-0"
          >
            {paletteId === 'royal-blue' ? 'Default Active' : 'Restore Default Palette'}
          </Button>
        </div>

        {/* Grouped by Curated Families */}
        <div className="space-y-8">
          {categories.map((category) => {
            const familyPalettes = allPalettes.filter((p) => p.category === category);

            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                    {category}
                  </h3>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div
                  role="radiogroup"
                  aria-label={category}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3"
                >
                  {familyPalettes.map((p) => {
                    const isSelected = paletteId === p.id;
                    const isInspected = (inspectedPalette || paletteId) === p.id;

                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={`${p.name} - ${p.subtitle}`}
                        onClick={() => {
                          setPaletteId(p.id as PaletteId);
                          setInspectedPalette(p.id as PaletteId);
                        }}
                        onMouseEnter={() => setInspectedPalette(p.id as PaletteId)}
                        onFocus={() => setInspectedPalette(p.id as PaletteId)}
                        className={`group relative flex flex-col p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer text-left bg-surface-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/30 shadow-xs'
                            : isInspected
                            ? 'border-border-strong bg-surface-hover/70 shadow-2xs'
                            : 'border-border hover:border-border-strong hover:bg-surface-hover/40'
                        }`}
                      >
                        {/* Compact Square Swatch */}
                        <div
                          className="relative w-full aspect-square rounded-lg shadow-xs mb-2 flex items-center justify-center transition-transform group-hover:scale-[1.02]"
                          style={{ backgroundColor: p.swatchColor }}
                        >
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-black/70 backdrop-blur-xs text-white flex items-center justify-center shadow-xs">
                              <Check size={13} strokeWidth={3} />
                            </div>
                          )}
                        </div>

                        {/* Name & Hex Code */}
                        <div className="space-y-0.5 w-full min-w-0">
                          <span
                            className={`text-xs font-bold truncate block ${
                              isSelected ? 'text-primary' : 'text-text-primary'
                            }`}
                          >
                            {p.name}
                          </span>
                          <span className="text-[10px] font-mono text-text-muted truncate block">
                            {p.swatchColor}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Detail Panel for Inspected Palette */}
        {(() => {
          const detail = PALETTES[inspectedPalette || paletteId] || palette;
          return (
            <div
              data-testid="palette-detail-panel"
              className="p-3.5 sm:p-4 rounded-2xl bg-surface-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl shadow-xs shrink-0 border border-white/20 flex items-center justify-center"
                  style={{ backgroundColor: detail.swatchColor }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-white/70 shadow-xs" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-text-primary">{detail.name}</span>
                    <span className="font-mono text-xs text-primary font-bold">{detail.swatchColor}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-subtle text-text-secondary border border-border">
                      {detail.category}
                    </span>
                  </div>
                  <p className="text-text-muted text-xs mt-0.5 line-clamp-1">{detail.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-xs text-text-muted bg-surface-subtle px-3 py-1.5 rounded-xl border border-border/60">
                <span>Light: <strong className="font-mono text-text-primary font-semibold">{detail.light.primary}</strong></span>
                <span className="text-border-strong">•</span>
                <span>Dark: <strong className="font-mono text-text-primary font-semibold">{detail.dark.primary}</strong></span>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Section 3: Live Coordinated Preview */}
      <section className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              Live Theme Preview
            </h2>
            <p className="text-xs text-text-muted">
              Preview how &ldquo;{palette.name}&rdquo; pairs with {resolvedTheme === 'dark' ? 'Noir Dark' : 'Monochrome Light'} canvas and surfaces.
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (resetToDefault) resetToDefault();
              else setPaletteId('royal-blue');
            }}
          >
            Reset to Default Appearance
          </Button>
        </div>

        {/* Mock Surface Card */}
        <div className="p-6 rounded-2xl bg-surface-card border border-border shadow-sm space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                style={{ backgroundColor: activePrimary }}
              >
                SG
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary">
                  SocialGraph Architectural Preview
                </h4>
                <p className="text-xs text-text-muted">
                  {palette.name} · {palette.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm">
                Save Collection
              </Button>
              <Button variant="outline" size="sm">
                Explore More
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border text-xs">
            <div>
              <span className="text-text-muted block text-[11px]">Mode</span>
              <strong className="text-text-primary capitalize">{mode} ({resolvedTheme})</strong>
            </div>
            <div>
              <span className="text-text-muted block text-[11px]">Primary Accent</span>
              <strong className="font-mono text-primary">{activePrimary}</strong>
            </div>
            <div>
              <span className="text-text-muted block text-[11px]">Surface Card</span>
              <strong className="font-mono text-text-primary">{activeSurfaceCard}</strong>
            </div>
            <div>
              <span className="text-text-muted block text-[11px]">Canvas Background</span>
              <strong className="font-mono text-text-primary">{activeCanvas}</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SettingsAppearancePage;
