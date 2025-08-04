import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Rubik', 'system-ui', '-apple-system', 'sans-serif'], // Default font
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
        // Hiiilo Brand Colors
        "brand-green": "#00E095",
        "brand-purple": "#535FC8",
        "brand-dark": "#0A232E",
        "brand-light-blue": "#F8FAFC",
        "brand-white": "#FEFEFE",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
    },
  },
}

export default config