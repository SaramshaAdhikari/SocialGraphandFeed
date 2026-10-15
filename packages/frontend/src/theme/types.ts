export type AppearanceMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export type PaletteId =
  | 'dragons-blood'
  | 'sovereign-blue'
  | 'emerald-court'
  | 'imperial-amethyst'
  | 'champagne-silk'
  | 'abyssal-jade'
  | 'velvet-rose'
  | 'phoenix-ember';

export interface PaletteModeTokens {
  // Primary accent & interaction tokens
  primary: string;
  primaryHover: string;
  primarySoft: string;
  primaryBorder: string;
  focusRing: string;

  // Canvas & surface tokens
  canvas: string;
  surfaceCard: string;
  surfaceSubtle: string;

  // Text tokens
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Border tokens
  border: string;
  borderSubtle: string;
}

export interface PaletteDefinition {
  id: PaletteId;
  name: string;
  subtitle: string;
  description: string;
  swatchColor: string; // The representative color shown on the swatch button
  light: PaletteModeTokens;
  dark: PaletteModeTokens;
}

export interface ThemeContextValue {
  mode: AppearanceMode;
  resolvedTheme: ResolvedTheme;
  paletteId: PaletteId;
  palette: PaletteDefinition;
  allPalettes: PaletteDefinition[];
  setMode: (mode: AppearanceMode) => void;
  setPaletteId: (id: PaletteId) => void;
}
