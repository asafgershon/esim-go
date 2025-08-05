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
      // Note: Colors are defined via @theme directive in src/styles/globals.css for Tailwind v4
      // Keeping semantic color references for compatibility
      colors: {
        // Brand colors
        'brand': {
          'green': '#00E095',
          'purple': '#535FC8',
          'dark': '#0A232E',
          'light-blue': '#F8FAFC',
          'white': '#FEFEFE',
        },
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
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
}

export default config