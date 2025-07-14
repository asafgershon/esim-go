import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // eSIM Go Brand Colors (from screenshot analysis)
        "deep-navy": "#1a1d3a",
        "space-blue": "#2d3561", 
        "indigo-primary": "#6366f1",
        "purple-accent": "#8b5cf6",
        "vibrant-purple": "#a855f7",
        "cyan-highlight": "#06b6d4",
        "light-gray": "#b8c5d6",
        "slate-gray": "#64748b",
        "pure-white": "#ffffff",
        
        // Status Colors
        "success-green": "#10b981",
        "warning-orange": "#f59e0b", 
        "error-red": "#ef4444",
        
        // Legacy custom colors (keeping for backward compatibility)
        "deep-space-blue": "#1C1C3A",
        "midnight-blue": "#2A2A4E", 
        "lavender-blue": "#7B8CDE",
        "periwinkle": "#A8B6F0",
        "minty-cyan": "#B3F6E8",
        "ghost-white": "#F0F2FF",
        "cool-gray": "#8A8AA4",
        
        // eSIM-specific semantic colors
        esim: {
          // Primary brand colors
          navy: "#1a1d3a",
          blue: "#2d3561",
          primary: "#6366f1",
          accent: "#8b5cf6",
          highlight: "#06b6d4",
          
          // Status indicators for eSIM states
          active: "#10b981",      // Green for active eSIMs
          pending: "#f59e0b",     // Orange for pending activation
          inactive: "#64748b",    // Gray for inactive eSIMs
          error: "#ef4444",       // Red for errors
          
          // Data usage colors
          low: "#10b981",         // Green for low usage
          medium: "#f59e0b",      // Orange for medium usage  
          high: "#ef4444",        // Red for high usage
          unlimited: "#06b6d4",   // Cyan for unlimited plans
          
          // Background variations
          surface: "#2d3561",     // Card/surface backgrounds
          background: "#1a1d3a",  // Main background
          overlay: "rgba(45, 53, 97, 0.8)", // Modal overlays
        },
        
        // Semantic color mappings (shadcn/ui)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        // eSIM-specific animations
        "pulse-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 0 0 rgba(99, 102, 241, 0.7)" 
          },
          "50%": { 
            boxShadow: "0 0 0 10px rgba(99, 102, 241, 0)" 
          },
        },
        "data-flow": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)"
          },
          "100%": {
            opacity: "1", 
            transform: "translateY(0)"
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "data-flow": "data-flow 2s linear infinite",
        "fade-in-up": "fade-in-up 0.3s ease-out",
      },
      // eSIM-specific utilities
      backgroundImage: {
        'gradient-esim': 'linear-gradient(135deg, #1a1d3a 0%, #2d3561 100%)',
        'gradient-card': 'linear-gradient(145deg, #2d3561 0%, #1a1d3a 100%)',
        'gradient-accent': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        'gradient-data': 'linear-gradient(90deg, #06b6d4 0%, #8b5cf6 100%)',
      },
      backdropBlur: {
        'esim': '10px',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}

export default config