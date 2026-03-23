import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: ['./pages/**/*.{ts,tsx}','./components/**/*.{ts,tsx}','./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bh: {
          bg:'#07060E', s1:'#0D0B1A', s2:'#131126', s3:'#1A1833', s4:'#21203F',
          text:'#F0ECFF', text2:'#8A85B0', text3:'#4A4670',
          green:'#C8FF57', pink:'#FF6B9D', cyan:'#00E5CC', yellow:'#FFD166', purple:'#A78BFA',
          chrome:'#F4845F', edge:'#3BA0E9', firefox:'#FF9500', brave:'#A78BFA', safari:'#34C759',
        },
        border:'hsl(var(--border))', input:'hsl(var(--input))', ring:'hsl(var(--ring))',
        background:'hsl(var(--background))', foreground:'hsl(var(--foreground))',
        primary:{ DEFAULT:'hsl(var(--primary))', foreground:'hsl(var(--primary-foreground))' },
        secondary:{ DEFAULT:'hsl(var(--secondary))', foreground:'hsl(var(--secondary-foreground))' },
        muted:{ DEFAULT:'hsl(var(--muted))', foreground:'hsl(var(--muted-foreground))' },
        accent:{ DEFAULT:'hsl(var(--accent))', foreground:'hsl(var(--accent-foreground))' },
      },
      borderRadius:{ lg:'var(--radius)', md:'calc(var(--radius) - 2px)', sm:'calc(var(--radius) - 4px)' },
      keyframes: {
        fadeUp:{ from:{ opacity:'0', transform:'translateY(12px)' }, to:{ opacity:'1', transform:'translateY(0)' } },
        slideRight:{ from:{ opacity:'0', transform:'translateX(-10px)' }, to:{ opacity:'1', transform:'translateX(0)' } },
        blink:{ '0%,100%':{ opacity:'1' }, '50%':{ opacity:'0.2' } },
      },
      animation:{
        'fade-up':'fadeUp 0.4s ease both',
        'slide-right':'slideRight 0.3s ease both',
        'blink':'blink 2s infinite',
      },
    },
  },
  plugins: [],
}

export default config
