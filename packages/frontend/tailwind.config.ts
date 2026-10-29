import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: {
          light: '#FFFFFF',
          dark: '#000000',
          DEFAULT: 'var(--color-canvas, #000000)',
        },
        surface: {
          card: 'var(--color-surface-card, #0A0A0A)',
          subtle: 'var(--color-surface-subtle, rgba(255, 255, 255, 0.05))',
          elevated: 'var(--color-surface-elevated, #141414)',
          hover: 'var(--surface-hover, rgba(255, 255, 255, 0.06))',
          DEFAULT: 'var(--color-surface-card, #0A0A0A)',
        },
        border: {
          subtle: 'var(--color-border-subtle, rgba(255, 255, 255, 0.05))',
          strong: 'var(--color-border-strong, rgba(255, 255, 255, 0.18))',
          DEFAULT: 'var(--color-border, rgba(255, 255, 255, 0.10))',
        },
        primary: {
          DEFAULT: 'var(--color-primary, #FF3CAC)',
          hover: 'var(--color-primary-hover, #FF5CB8)',
          pressed: 'var(--accent-pressed, #E82E99)',
          soft: 'var(--color-primary-soft, #291322)',
          border: 'var(--color-primary-border, rgba(255, 60, 172, 0.4))',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: 'var(--accent-secondary, #8B5CF6)',
          hover: 'var(--accent-secondary-hover, #A78BFA)',
          soft: 'var(--accent-secondary-soft, #1D1434)',
        },
        accent: {
          magenta: '#FF3CAC',
          'magenta-hover': '#FF5CB8',
          'magenta-soft': '#291322',
          violet: '#8B5CF6',
          'violet-hover': '#A78BFA',
          'violet-soft': '#1D1434',
        },
        upvote: {
          DEFAULT: '#FF4500',
          hover: '#E03D00',
          soft: 'rgba(255, 69, 0, 0.12)',
        },
        downvote: {
          DEFAULT: '#8B5CF6',
          hover: '#A78BFA',
          soft: 'rgba(139, 92, 246, 0.12)',
        },
        ink: {
          button: '#0F172A',
          'button-hover': '#1E293B',
        },
        text: {
          primary: 'var(--color-text-primary, #F7F7FB)',
          secondary: 'var(--color-text-secondary, #B4B4C2)',
          muted: 'var(--color-text-muted, #858595)',
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
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px -1px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 4px 14px -2px rgba(0, 0, 0, 0.35)',
        modal: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
        pin: '0 2px 8px -2px rgba(0, 0, 0, 0.3)',
      },
      screens: {
        '3xl': '1750px',
      },
    },
  },
  plugins: [],
};

export default config;
