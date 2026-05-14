import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        app: 'var(--bg-app)',
        panel: 'var(--bg-panel)',
        surface: 'var(--bg-surface)',
        hover: 'var(--bg-hover)',
        border: 'var(--border)',
        'border-subtle': 'var(--border-subtle)',
        'text-primary': 'var(--text-primary)',
        'text-muted': 'var(--text-muted)',
        'text-faint': 'var(--text-faint)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-green': 'var(--accent-green)',
        'accent-red': 'var(--accent-red)',
        'accent-amber': 'var(--accent-amber)',
        'accent-purple': 'var(--accent-purple)',
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        caption: ['11px', '14px'],
        body: ['13px', '18px'],
        ui: ['14px', '20px'],
        heading: ['16px', '22px'],
        display: ['20px', '28px'],
      },
      borderRadius: {
        md: '6px',
        lg: '8px',
      },
      transitionDuration: {
        '150': '150ms',
      },
      animation: {
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
        'fade-in': 'fadeIn 400ms ease-out',
        'spin-slow': 'spin 2s linear infinite',
        'countdown': 'countdown 30s linear',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        countdown: {
          '0%': { 'stroke-dashoffset': '0' },
          '100%': { 'stroke-dashoffset': '283' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
