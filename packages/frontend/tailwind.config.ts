import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: {
          light: '#FAFAF9',
          dark: '#09090B',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#18181B',
        },
        border: {
          light: '#E2E8F0',
          dark: '#27272A',
        },
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
        },
        secondary: {
          DEFAULT: '#0F172A',
          hover: '#1E293B',
        },
        muted: {
          light: '#64748B',
          dark: '#A1A1AA',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        pin: '16px',
        modal: '32px',
        full: '9999px',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      letterSpacing: {
        snug: '-0.015em',
        tighter: '-0.025em',
      },
    },
  },
  plugins: [],
};

export default config;
