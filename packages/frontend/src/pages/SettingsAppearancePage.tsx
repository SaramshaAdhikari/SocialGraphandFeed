import { Sun, Moon, Monitor, Check, Sparkles, ArrowLeft } from 'lucide-react';
import { useTheme } from '../theme';
import type { AppearanceMode, PaletteCategory, PaletteId } from '../theme/types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Link } from '../router/Router';

export function SettingsAppearancePage() {
  const { mode, resolvedTheme, paletteId, palette, allPalettes, setMode, setPaletteId } = useTheme();

  const appearanceModes: {
    id: AppearanceMode;
    label: string;
    description: string;
    icon: typeof Sun;
  }[] = [
    {
      id: 'light',
      label: 'Light',
      description: 'Airy and bright. Crisp white and warm-neutral surfaces with elegant contrast.',
      icon: Sun,
    },
    {
      id: 'dark',
      label: 'Dark',
      description: 'Deep and immersive. Charcoal surfaces designed for reading without harsh glare.',
      icon: Moon,
    },
    {
      id: 'system',
      label: 'System',
      description: 'Follows your device operating system setting automatically.',
      icon: Monitor,
    },
  ];

  const categories: PaletteCategory[] = [
    'Imperial & dramatic',
    'Jewel & mineral',
    'Soft & expressive',
    'Metallic & neutral',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16">
      {/* Page Header */}
      <div className="space-y-3 pb-6 border-b border-[#E2E8F0] dark:border-[#2E3544]">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
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
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
              Appearance & Personalization
            </h1>
            <p className="mt-1 text-sm text-[#64748B] dark:text-[#94A3B8]">
              Personalize your theme mode and select from 15 historical pigment, mineral, and royal gemstone palettes.
            </p>
          </div>

          <Badge variant="brand" size="md" className="self-start sm:self-auto shrink-0">
            Active: {palette.name}
          </Badge>
        </div>
      </div>

      {/* Section 1: Appearance Mode */}
      <section className="space-y-4" aria-labelledby="appearance-mode-heading">
        <div>
          <h2 id="appearance-mode-heading" className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
            Appearance Mode
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
            Choose whether SocialGraph displays in crisp light, deep charcoal dark, or syncs with your device.
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
                className={`relative flex flex-col items-start text-left p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-[#181B22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 shadow-md'
                    : 'border-[#E2E8F0] dark:border-[#2E3544] hover:border-slate-300 dark:hover:border-slate-600 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      isSelected
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-[#F4F4F5] dark:bg-[#262B36] text-[#64748B] dark:text-[#94A3B8]'
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
                  <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                    {item.label}
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
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
            <h2 id="accent-palette-heading" className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Accent Palette Library
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
              15 coordinated palettes inspired by real gemstones, precious metals, and historical royal pigments.
            </p>
          </div>
          <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
            Selected: <strong className="text-primary font-bold">{palette.name}</strong> ({palette.category})
          </span>
        </div>

        {/* Grouped by Curated Families */}
        <div className="space-y-8">
          {categories.map((category) => {
            const familyPalettes = allPalettes.filter((p) => p.category === category);

            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                    {category}
                  </h3>
                  <div className="flex-1 h-px bg-[#E2E8F0] dark:border-[#2E3544]" />
                </div>

                <div
                  role="radiogroup"
                  aria-label={category}
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
                >
                  {familyPalettes.map((p) => {
                    const isSelected = paletteId === p.id;

                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={`${p.name} - ${p.subtitle}`}
                        onClick={() => setPaletteId(p.id as PaletteId)}
                        className={`group relative flex flex-col p-3.5 rounded-2xl border transition-all cursor-pointer text-left bg-white dark:bg-[#181B22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/25 shadow-md scale-[1.02]'
                            : 'border-[#E2E8F0] dark:border-[#2E3544] hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xs'
                        }`}
                      >
                        {/* Anchor Swatch Block */}
                        <div
                          className="relative w-full aspect-16/9 rounded-xl shadow-xs mb-3 flex items-center justify-center transition-transform group-hover:scale-[1.02]"
                          style={{ backgroundColor: p.swatchColor }}
                        >
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-black/50 backdrop-blur-xs text-white flex items-center justify-center shadow-sm">
                              <Check size={14} strokeWidth={3} />
                            </div>
                          )}
                        </div>

                        {/* Text Metadata (Permanently visible on all viewports) */}
                        <div className="space-y-1 w-full min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-xs font-bold truncate ${
                                isSelected ? 'text-primary' : 'text-[#0F172A] dark:text-[#F8FAFC]'
                              }`}
                            >
                              {p.name}
                            </span>
                            <span className="text-[10px] font-mono text-[#94A3B8] shrink-0">
                              {p.swatchColor}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] line-clamp-1 leading-snug">
                            {p.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 3: Live Coordinated Preview */}
      <section className="space-y-4 pt-4 border-t border-[#E2E8F0] dark:border-[#2E3544]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              Live Theme Preview
            </h2>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Preview how "{palette.name}" pairs with {resolvedTheme === 'dark' ? 'Dark mode' : 'Light mode'} surfaces and actions.
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPaletteId('royal-blue');
              setMode('light');
            }}
          >
            Reset Defaults
          </Button>
        </div>

        {/* Mock Surface Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B22] border border-[#E2E8F0] dark:border-[#2E3544] shadow-sm space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                style={{ backgroundColor: palette[resolvedTheme].primary }}
              >
                SG
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  SocialGraph Architectural Preview
                </h4>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#F1F5F9] dark:border-[#262B36] text-xs">
            <div>
              <span className="text-[#94A3B8] block text-[11px]">Mode</span>
              <strong className="text-[#0F172A] dark:text-[#F8FAFC] capitalize">{mode} ({resolvedTheme})</strong>
            </div>
            <div>
              <span className="text-[#94A3B8] block text-[11px]">Primary Accent</span>
              <strong className="font-mono text-primary">{palette[resolvedTheme].primary}</strong>
            </div>
            <div>
              <span className="text-[#94A3B8] block text-[11px]">Surface Card</span>
              <strong className="font-mono text-[#0F172A] dark:text-[#F8FAFC]">{palette[resolvedTheme].surfaceCard}</strong>
            </div>
            <div>
              <span className="text-[#94A3B8] block text-[11px]">Canvas Background</span>
              <strong className="font-mono text-[#0F172A] dark:text-[#F8FAFC]">{palette[resolvedTheme].canvas}</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SettingsAppearancePage;
