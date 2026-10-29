import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { AppearanceMode, ResolvedTheme, PaletteId, ThemeContextValue } from './types';
import { PALETTES, PALETTE_LIST } from './palettes';

const THEME_MODE_STORAGE_KEY = 'socialgraph_theme_mode';
const THEME_PALETTE_STORAGE_KEY = 'socialgraph_theme_palette';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemPreference(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredMode(): AppearanceMode {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'light';
  }
  try {
    const stored = window.localStorage.getItem(THEME_MODE_STORAGE_KEY) as AppearanceMode | null;
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // Ignore storage errors
  }
  return 'dark';
}

function getStoredPalette(): PaletteId {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'royal-blue';
  }
  try {
    const stored = window.localStorage.getItem(THEME_PALETTE_STORAGE_KEY) as PaletteId | null;
    if (stored && PALETTES[stored]) {
      return stored;
    }
  } catch {
    // Ignore storage errors
  }
  return 'royal-blue';
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  initialMode?: AppearanceMode;
  initialPalette?: PaletteId;
}

export function ThemeProvider({
  children,
  initialMode,
  initialPalette,
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<AppearanceMode>(() => initialMode || getStoredMode());
  const [paletteId, setPaletteIdState] = useState<PaletteId>(() => initialPalette || getStoredPalette());
  const [systemPreference, setSystemPreference] = useState<ResolvedTheme>(getSystemPreference);

  // Synchronize OS media query changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (mode === 'system') return systemPreference;
    return mode;
  }, [mode, systemPreference]);

  const palette = useMemo(() => {
    return PALETTES[paletteId] || PALETTES['royal-blue'];
  }, [paletteId]);

  // Apply CSS variables and DOM data-attributes
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.setAttribute('data-theme', resolvedTheme);
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.setAttribute('data-palette', paletteId);

    // Apply active tokens
    if (resolvedTheme === 'dark') {
      root.style.setProperty('--color-canvas', '#000000');
      root.style.setProperty('--color-surface-card', '#0A0A0A');
      root.style.setProperty('--color-surface-elevated', '#141414');
      root.style.setProperty('--color-surface-subtle', 'rgba(255, 255, 255, 0.05)');
      root.style.setProperty('--surface-hover', 'rgba(255, 255, 255, 0.06)');
      root.style.setProperty('--color-border', 'rgba(255, 255, 255, 0.10)');
      root.style.setProperty('--color-border-strong', 'rgba(255, 255, 255, 0.18)');
      root.style.setProperty('--color-border-subtle', 'rgba(255, 255, 255, 0.05)');
      root.style.setProperty('--color-text-primary', '#F5F5F5');
      root.style.setProperty('--color-text-secondary', '#A8A8A8');
      root.style.setProperty('--color-text-muted', '#737373');

      root.style.setProperty('--color-primary', palette.dark.primary);
      root.style.setProperty('--color-primary-hover', palette.dark.primaryHover);
      root.style.setProperty('--color-primary-soft', palette.dark.primarySoft);
      root.style.setProperty('--color-primary-border', palette.dark.primaryBorder);
      root.style.setProperty('--color-focus-ring', palette.dark.focusRing);
      root.style.setProperty(
        '--gradient-accent',
        `linear-gradient(135deg, ${palette.dark.primary} 0%, ${palette.dark.primaryHover} 100%)`
      );
    } else {
      root.style.setProperty('--color-canvas', '#FFFFFF');
      root.style.setProperty('--color-surface-card', '#FFFFFF');
      root.style.setProperty('--color-surface-elevated', '#FFFFFF');
      root.style.setProperty('--color-surface-subtle', 'rgba(0, 0, 0, 0.04)');
      root.style.setProperty('--surface-hover', 'rgba(0, 0, 0, 0.04)');
      root.style.setProperty('--color-border', 'rgba(0, 0, 0, 0.08)');
      root.style.setProperty('--color-border-strong', 'rgba(0, 0, 0, 0.16)');
      root.style.setProperty('--color-border-subtle', 'rgba(0, 0, 0, 0.04)');
      root.style.setProperty('--color-text-primary', '#000000');
      root.style.setProperty('--color-text-secondary', '#525252');
      root.style.setProperty('--color-text-muted', '#737373');

      root.style.setProperty('--color-primary', palette.light.primary);
      root.style.setProperty('--color-primary-hover', palette.light.primaryHover);
      root.style.setProperty('--color-primary-soft', palette.light.primarySoft);
      root.style.setProperty('--color-primary-border', palette.light.primaryBorder);
      root.style.setProperty('--color-focus-ring', palette.light.focusRing);
      root.style.setProperty(
        '--gradient-accent',
        `linear-gradient(135deg, ${palette.light.primary} 0%, ${palette.light.primaryHover} 100%)`
      );
    }
  }, [resolvedTheme, paletteId, palette]);

  const setMode = useCallback((newMode: AppearanceMode) => {
    setModeState(newMode);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(THEME_MODE_STORAGE_KEY, newMode);
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  const setPaletteId = useCallback((newPaletteId: PaletteId) => {
    if (!PALETTES[newPaletteId]) return;
    setPaletteIdState(newPaletteId);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(THEME_PALETTE_STORAGE_KEY, newPaletteId);
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  const resetToDefault = useCallback(() => {
    setPaletteIdState('royal-blue');
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(THEME_PALETTE_STORAGE_KEY, 'royal-blue');
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  const value: ThemeContextValue = useMemo(
    () => ({
      mode,
      resolvedTheme,
      paletteId,
      palette,
      allPalettes: PALETTE_LIST,
      setMode,
      setPaletteId,
      resetToDefault,
    }),
    [mode, resolvedTheme, paletteId, palette, setMode, setPaletteId, resetToDefault]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

const DEFAULT_THEME_VALUE: ThemeContextValue = {
  mode: 'light',
  resolvedTheme: 'light',
  paletteId: 'royal-blue',
  palette: PALETTES['royal-blue'],
  allPalettes: PALETTE_LIST,
  setMode: () => {},
  setPaletteId: () => {},
  resetToDefault: () => {},
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  return context ?? DEFAULT_THEME_VALUE;
}
