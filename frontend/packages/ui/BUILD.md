# UI Package Build Process

This UI package is built using Vite in library mode with SWC for fast compilation and optimized code splitting.

## Build Commands

```bash
# Build the library (production)
bun run build

# Development mode (watch for changes)
bun run dev

# Type checking
bun run type-check

# Run tests
bun run test
```

## Build Output

The build process generates:
- `dist/index.mjs` (540KB) - Main bundle with all UI components
- `dist/index.cjs` - CommonJS format
- `dist/components/smooth-scroll-container.mjs` (308KB) - Separate bundle with GSAP
- `dist/globals.css` - Compiled Tailwind CSS styles
- `dist/**/*.d.ts` - TypeScript declarations

## Code Splitting Strategy

### Main Bundle (540KB)
Contains all UI components except heavy dependencies:
- All Radix UI components
- All standard UI components
- Utility functions and hooks

### Separate Bundles
- **smooth-scroll-container** (308KB) - Includes GSAP for smooth scrolling
  - Only loaded when explicitly imported
  - Saves 308KB for apps that don't need smooth scrolling

## Key Features

1. **"use client" Directive** - Automatically added to all bundles for Next.js App Router compatibility
2. **Code Splitting** - Large libraries like GSAP are in separate chunks
3. **SWC Compilation** - Fast builds with @vitejs/plugin-react-swc
4. **TypeScript Support** - Full type definitions with source maps
5. **Next.js Compatible** - Works with both Pages and App Router

## Benefits

- ✅ Fast compilation with SWC
- ✅ Optimized bundle sizes through code splitting
- ✅ Next.js App Router compatible ("use client" preserved)
- ✅ Tree-shaking support
- ✅ TypeScript declarations with source maps
- ✅ Errors in UI package won't break Next.js app build
- ✅ ~36% smaller initial bundle when GSAP not needed

## Import Examples

```tsx
// Standard components (from main bundle)
import { Button, Card, Dialog } from '@workspace/ui'
import { Badge } from '@/components/badge'

// Heavy component (separate bundle, loads GSAP)
import { SmoothScrollContainer } from '@/components/smooth-scroll-container'
```