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
      root.style.setProperty('--color-surface-card', '#0B0B0F');
      root.style.setProperty('--color-surface-subtle', '#14141A');
      root.style.setProperty('--color-border', '#262630');
      root.style.setProperty('--color-border-strong', '#393944');
      root.style.setProperty('--color-border-subtle', '#1C1C24');
      root.style.setProperty('--color-text-primary', '#F7F7FB');
      root.style.setProperty('--color-text-secondary', '#B4B4C2');
      root.style.setProperty('--color-text-muted', '#858595');

      if (paletteId === 'royal-blue') {
        root.style.setProperty('--color-primary', '#FF3CAC');
        root.style.setProperty('--color-primary-hover', '#FF5CB8');
        root.style.setProperty('--color-primary-soft', '#291322');
        root.style.setProperty('--color-primary-border', '#FF3CAC');
        root.style.setProperty('--color-focus-ring', '#C084FC');
      } else {
        root.style.setProperty('--color-primary', palette.dark.primary);
        root.style.setProperty('--color-primary-hover', palette.dark.primaryHover);
        root.style.setProperty('--color-primary-soft', palette.dark.primarySoft);
        root.style.setProperty('--color-primary-border', palette.dark.primaryBorder);
        root.style.setProperty('--color-focus-ring', palette.dark.focusRing);
      }
    } else {
      root.style.setProperty('--color-canvas', '#FFFFFF');
      root.style.setProperty('--color-surface-card', '#F7F7FA');
      root.style.setProperty('--color-surface-subtle', '#F5F5F5');
      root.style.setProperty('--color-border', '#E5E5E5');
      root.style.setProperty('--color-border-strong', '#D4CEDF');
      root.style.setProperty('--color-border-subtle', '#EFEFEF');
      root.style.setProperty('--color-text-primary', '#17131D');
      root.style.setProperty('--color-text-secondary', '#625B6D');
      root.style.setProperty('--color-text-muted', '#716A7E');

      if (paletteId === 'royal-blue') {
        root.style.setProperty('--color-primary', '#D92691');
        root.style.setProperty('--color-primary-hover', '#BC1E7C');
        root.style.setProperty('--color-primary-soft', '#FCE7F4');
        root.style.setProperty('--color-primary-border', '#F7C0E4');
        root.style.setProperty('--color-focus-ring', '#8B5CF6');
      } else {
        root.style.setProperty('--color-primary', palette.light.primary);
        root.style.setProperty('--color-primary-hover', palette.light.primaryHover);
        root.style.setProperty('--color-primary-soft', palette.light.primarySoft);
        root.style.setProperty('--color-primary-border', palette.light.primaryBorder);
        root.style.setProperty('--color-focus-ring', palette.light.focusRing);
      }
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
