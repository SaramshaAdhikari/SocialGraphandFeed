import React, { useEffect, useRef } from 'react';
import { Sun, Moon, Monitor, Check, X, Palette } from 'lucide-react';
import { useTheme } from '../../theme';
import type { AppearanceMode, PaletteId } from '../../theme/types';

export interface AppearancePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export function AppearancePopover({ isOpen, onClose }: AppearancePopoverProps) {
  const { mode, setMode, paletteId, setPaletteId, allPalettes, palette } = useTheme();
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay slightly to prevent the open click from immediately closing
    const timer = setTimeout(() => {
      window.addEventListener('click', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modes: { id: AppearanceMode; label: string; icon: typeof Sun }[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Appearance and Theme Settings"
      className="fixed inset-0 z-50 flex items-start justify-center sm:justify-end p-4 sm:p-6 bg-black/40 backdrop-blur-xs animate-fade-in"
    >
      <div
        ref={popoverRef}
        className="w-full max-w-sm sm:max-w-md bg-surface-card rounded-2xl border border-border shadow-2xl p-5 sm:p-6 space-y-6 text-text-primary animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Palette size={18} className="text-primary" />
            <h2 className="text-sm sm:text-base font-bold">Your appearance</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close appearance settings"
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Appearance Mode Selection */}
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">
            Theme Mode
          </label>
          <div
            role="radiogroup"
            aria-label="Appearance Mode"
            className="grid grid-cols-3 gap-1.5 p-1 bg-surface-subtle rounded-xl border border-border"
          >
            {modes.map((m) => {
              const Icon = m.icon;
              const isSelected = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setMode(m.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isSelected
                      ? 'bg-surface-card text-text-primary shadow-xs border border-border/40'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <Icon size={14} className={isSelected ? 'text-primary' : ''} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Curated Color Palette Collection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Color Palette
            </label>
            <span className="text-xs font-medium text-primary">
              Selected: <strong className="font-bold">{palette.name}</strong>
            </span>
          </div>

          <div
            role="radiogroup"
            aria-label="Color Palette"
            className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-2.5 max-h-72 overflow-y-auto pr-1"
          >
            {allPalettes.map((p) => {
              const isSelected = paletteId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`${p.name}: ${p.subtitle}`}
                  onClick={() => setPaletteId(p.id as PaletteId)}
                  className={`group flex flex-col items-center text-center focus-visible:outline-none rounded-xl p-1 transition-transform cursor-pointer ${
                    isSelected ? 'scale-[1.02]' : 'hover:scale-102'
                  }`}
                >
                  {/* Swatch Box */}
                  <div
                    className={`relative w-full aspect-4/3 rounded-xl shadow-xs transition-all flex items-center justify-center border-2 ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-primary ring-offset-surface-card border-surface-card'
                        : 'border-transparent group-hover:ring-1 group-hover:ring-neutral-300 dark:group-hover:ring-neutral-700'
                    }`}
                    style={{ backgroundColor: p.swatchColor }}
                  >
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-white">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Palette Name Label (Always visible per design requirements) */}
                  <span
                    className={`mt-1.5 text-[11px] leading-tight transition-colors line-clamp-1 ${
                      isSelected
                        ? 'font-bold text-primary'
                        : 'font-medium text-text-muted group-hover:text-text-primary'
                    }`}
                  >
                    {p.name}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
            {palette.description}
          </p>
        </div>
      </div>
    </div>
  );
}
