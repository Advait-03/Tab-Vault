import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bh: {
          bg: 'rgb(var(--bh-bg) / <alpha-value>)',
          s1: 'rgb(var(--bh-s1) / <alpha-value>)',
          s2: 'rgb(var(--bh-s2) / <alpha-value>)',
          s3: 'rgb(var(--bh-s3) / <alpha-value>)',
          s4: 'rgb(var(--bh-s4) / <alpha-value>)',
          text: 'rgb(var(--bh-text) / <alpha-value>)',
          text2: 'rgb(var(--bh-text2) / <alpha-value>)',
          text3: 'rgb(var(--bh-text3) / <alpha-value>)',
          green: 'rgb(var(--bh-green) / <alpha-value>)',
          pink: 'rgb(var(--bh-pink) / <alpha-value>)',
          cyan: 'rgb(var(--bh-cyan) / <alpha-value>)',
          yellow: 'rgb(var(--bh-yellow) / <alpha-value>)',
          purple: 'rgb(var(--bh-purple) / <alpha-value>)',
          chrome: '#ea4335',
          edge: '#1a73e8',
          firefox: '#ff8c00',
          brave: '#fb542b',
          safari: '#34a853',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        fadeUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideRight: { from: { opacity: '0', transform: 'translateX(-10px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease both',
        'slide-right': 'slideRight 0.3s ease both',
      },
    },
  },
  plugins: [],
}

export default config
