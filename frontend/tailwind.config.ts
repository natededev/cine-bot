import type { Config } from 'tailwindcss'


export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './public/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: 'hsl(var(--primary) / <alpha-value>)',
        secondary: 'hsl(var(--secondary) / <alpha-value>)',
        accent: 'hsl(var(--accent) / <alpha-value>)',
        muted: 'hsl(var(--muted) / <alpha-value>)',
        destructive: 'hsl(var(--destructive) / <alpha-value>)',
        card: 'hsl(var(--card) / <alpha-value>)',
        popover: 'hsl(var(--popover) / <alpha-value>)',
      },
      borderColor: {
        border: 'hsl(var(--border) / <alpha-value>)',
      },
    },
  },
  plugins: [],
} satisfies Config;

