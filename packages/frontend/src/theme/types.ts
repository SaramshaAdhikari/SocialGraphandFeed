export type AppearanceMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export type PaletteCategory =
  | 'Imperial & dramatic'
  | 'Jewel & mineral'
  | 'Soft & expressive'
  | 'Metallic & neutral';

export type PaletteId =
  | 'tyrian-purple'
  | 'royal-purple'
  | 'oxblood'
  | 'dragons-blood'
  | 'lapis-lazuli'
  | 'malachite'
  | 'royal-blue'
  | 'dusty-rose'
  | 'mulberry'
  | 'burnt-sienna'
  | 'platinum'
  | 'champagne'
  | 'pearl'
  | 'eburnean'
  | 'wenge';

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
  category: PaletteCategory;
  subtitle: string;
  description: string;
  swatchColor: string; // The authentic anchor color representing the pigment/mineral
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
