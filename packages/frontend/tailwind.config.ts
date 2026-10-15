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
          DEFAULT: '#FAFAF9',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#18181B',
          card: '#FFFFFF',
          subtle: '#F4F4F5',
          elevated: '#FFFFFF',
          'subtle-dark': '#27272A',
          DEFAULT: '#FFFFFF',
        },
        border: {
          light: '#E2E8F0',
          dark: '#27272A',
          subtle: '#F1F5F9',
          DEFAULT: '#E2E8F0',
        },
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          soft: '#EFF6FF',
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
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#94A3B8',
          'primary-dark': '#F8FAFC',
          'secondary-dark': '#CBD5E1',
          'muted-dark': '#64748B',
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
    },
  },
  plugins: [],
};

export default config;
