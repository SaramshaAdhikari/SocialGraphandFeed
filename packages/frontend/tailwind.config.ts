import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: {
          light: '#FAFAF9',
          dark: '#0F1117',
          DEFAULT: 'var(--color-canvas, #FAFAF9)',
        },
        surface: {
          card: 'var(--color-surface-card, #FFFFFF)',
          subtle: 'var(--color-surface-subtle, #F4F4F5)',
          elevated: 'var(--color-surface-card, #FFFFFF)',
          DEFAULT: 'var(--color-surface-card, #FFFFFF)',
        },
        border: {
          subtle: 'var(--color-border-subtle, #F1F5F9)',
          DEFAULT: 'var(--color-border, #E2E8F0)',
        },
        primary: {
          DEFAULT: 'var(--color-primary, #1D4ED8)',
          hover: 'var(--color-primary-hover, #1E40AF)',
          soft: 'var(--color-primary-soft, #EFF6FF)',
          border: 'var(--color-primary-border, #BFDBFE)',
          foreground: '#FFFFFF',
        },
        upvote: {
          DEFAULT: '#F97316',
          hover: '#EA580C',
          soft: '#FFF7ED',
        },
        downvote: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          soft: '#EEF2FF',
        },
        ink: {
          button: '#0F172A',
          'button-hover': '#1E293B',
        },
        text: {
          primary: 'var(--color-text-primary, #0F172A)',
          secondary: 'var(--color-text-secondary, #475569)',
          muted: 'var(--color-text-muted, #94A3B8)',
        },
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '16px',
        pin: '16px',
        '2xl': '20px',
        modal: '24px',
        full: '9999px',
      },
      spacing: {
        0.5: '2px',
        1: '4px',
        1.5: '6px',
        2: '8px',
        2.5: '10px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        7: '28px',
        8: '32px',
        10: '40px',
        12: '48px',
        14: '56px',
        16: '64px',
        20: '80px',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        display: [
          '"Plus Jakarta Sans"',
          'Inter',
          '-apple-system',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"Fira Code"',
          'monospace',
        ],
      },
      letterSpacing: {
        snug: '-0.015em',
        tightest: '-0.025em',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
        modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        pin: '0 2px 8px -2px rgba(0, 0, 0, 0.08)',
      },
      screens: {
        '3xl': '1750px',
      },
    },
  },
  plugins: [],
};

export default config;
