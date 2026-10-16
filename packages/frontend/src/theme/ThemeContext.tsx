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
  return 'light';
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
    root.setAttribute('data-palette', paletteId);

    // Apply active tokens
    const tokens = resolvedTheme === 'dark' ? palette.dark : palette.light;
    root.style.setProperty('--color-primary', tokens.primary);
    root.style.setProperty('--color-primary-hover', tokens.primaryHover);
    root.style.setProperty('--color-primary-soft', tokens.primarySoft);
    root.style.setProperty('--color-primary-border', tokens.primaryBorder);
    root.style.setProperty('--color-focus-ring', tokens.focusRing);
    root.style.setProperty('--color-canvas', tokens.canvas);
    root.style.setProperty('--color-surface-card', tokens.surfaceCard);
    root.style.setProperty('--color-surface-subtle', tokens.surfaceSubtle);
    root.style.setProperty('--color-text-primary', tokens.textPrimary);
    root.style.setProperty('--color-text-secondary', tokens.textSecondary);
    root.style.setProperty('--color-text-muted', tokens.textMuted);
    root.style.setProperty('--color-border', tokens.border);
    root.style.setProperty('--color-border-subtle', tokens.borderSubtle);
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

  const value: ThemeContextValue = useMemo(
    () => ({
      mode,
      resolvedTheme,
      paletteId,
      palette,
      allPalettes: PALETTE_LIST,
      setMode,
      setPaletteId,
    }),
    [mode, resolvedTheme, paletteId, palette, setMode, setPaletteId]
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
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  return context ?? DEFAULT_THEME_VALUE;
}
