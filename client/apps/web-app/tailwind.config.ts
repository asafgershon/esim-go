import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'hebrew': ['Rubik', 'system-ui', '-apple-system', 'sans-serif'],
        'english': ['Agency FB', 'Agency', 'Arial', 'sans-serif'],
        'fallback': ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        border: "border",
        input: "input",
        ring: "ring",
        background: "background",
        foreground: "foreground",
        primary: {
          DEFAULT: "primary",
          foreground: "primary-foreground",
        },
        secondary: {
          DEFAULT: "secondary",
          foreground: "secondary-foreground",
        },
        destructive: {
          DEFAULT: "destructive",
          foreground: "destructive-foreground",
        },
        muted: {
          DEFAULT: "muted",
          foreground: "muted-foreground",
        },
        accent: {
          DEFAULT: "accent",
          foreground: "accent-foreground",
        },
        popover: {
          DEFAULT: "popover",
          foreground: "popover-foreground",
        },
        card: {
          DEFAULT: "card",
          foreground: "card-foreground",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('tailwindcss-animate'),
  ],
}

export default config